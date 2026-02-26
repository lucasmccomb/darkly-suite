/**
 * Tests for webhook.ts — Stripe webhook event processing.
 *
 * This is the most critical endpoint: it creates and updates licenses.
 * A bug here means licenses aren't created after payment (revenue loss)
 * or licenses are created from forged events (security hole).
 */

import { createMockContext, createMockEnv, generateWebhookSignature } from './test-helpers';
import type { MockD1Database } from './test-helpers';

// ---------------------------------------------------------------------------
// Mock fetch for Stripe API calls (retrieveCheckoutSession, trackDiscountUsage)
// and Resend API calls (sendAdminEmail)
// ---------------------------------------------------------------------------

const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
Object.defineProperty(globalThis, 'fetch', { value: fetchMock, writable: true });

// ---------------------------------------------------------------------------
// Import the handler
// ---------------------------------------------------------------------------

import { onRequestPost } from '../api/webhook';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWebhookEvent(type: string, data: Record<string, unknown>) {
  return JSON.stringify({ id: `evt_${Date.now()}`, type, data: { object: data } });
}

/** Respond with 200 to any remaining fetch calls (e.g. sendAdminEmail) */
function mockResendSuccess() {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ id: 'email_ok' }), { status: 200 }));
}

async function callWebhook(
  eventBody: string,
  env?: ReturnType<typeof createMockEnv>,
) {
  const testEnv = env ?? createMockEnv();
  const { header } = await generateWebhookSignature(eventBody, testEnv.STRIPE_WEBHOOK_SECRET);

  const request = new Request('https://darklysuite.com/api/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': header,
    },
    body: eventBody,
  });

  const context = createMockContext({ request, env: testEnv });
  return onRequestPost(context);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  fetchMock.mockReset();
});

describe('webhook — signature validation', () => {
  it('returns 400 when stripe-signature header is missing', async () => {
    const request = new Request('https://darklysuite.com/api/webhook', {
      method: 'POST',
      body: '{}',
    });
    const context = createMockContext({ request });
    const response = await onRequestPost(context);

    expect(response.status).toBe(400);
    const body = await response.json() as { error: string };
    expect(body.error).toContain('Missing stripe-signature');
  });

  it('returns 400 when signature is invalid', async () => {
    const request = new Request('https://darklysuite.com/api/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 't=12345,v1=invalidsig' },
      body: '{}',
    });
    const context = createMockContext({ request });
    const response = await onRequestPost(context);

    expect(response.status).toBe(400);
    const body = await response.json() as { error: string };
    expect(body.error).toContain('Invalid signature');
  });
});

describe('webhook — checkout.session.completed', () => {
  it('creates a license in D1 on successful checkout', async () => {
    // retrieveCheckoutSession mock
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'cs_test_123',
          url: 'https://checkout.stripe.com/cs_test',
          metadata: { token: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', plan: 'yearly', product: 'gmail' },
          customer: 'cus_123',
          subscription: 'sub_456',
          customer_details: { email: 'buyer@example.com' },
          amount_total: 999,
        }),
        { status: 200 },
      ),
    );

    // trackDiscountUsage — expanded session fetch
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ total_details: { breakdown: { discounts: [] } } }), { status: 200 }),
    );

    // sendAdminEmail
    mockResendSuccess();

    const env = createMockEnv();
    const eventBody = makeWebhookEvent('checkout.session.completed', { id: 'cs_test_123' });
    const response = await callWebhook(eventBody, env);

    expect(response.status).toBe(200);
    const body = await response.json() as { received: boolean };
    expect(body.received).toBe(true);

    // Verify the DB insert was called
    const db = env.DB as unknown as MockD1Database;
    expect(db.prepare).toHaveBeenCalled();

    // The first prepare call should be the INSERT INTO licenses
    const sql = db.prepare.mock.calls[0][0] as string;
    expect(sql).toContain('INSERT INTO licenses');
    expect(sql).toContain('ON CONFLICT(token, product) DO UPDATE');
  });

  it('sends admin email notification on new purchase', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'cs_notify',
          url: '',
          metadata: { token: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', plan: 'yearly', product: 'sheets' },
          customer: 'cus_n',
          subscription: 'sub_n',
          customer_details: { email: 'buyer@example.com' },
          amount_total: 999,
        }),
        { status: 200 },
      ),
    );

    // trackDiscountUsage
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ total_details: { breakdown: { discounts: [] } } }), { status: 200 }),
    );

    // sendAdminEmail
    mockResendSuccess();

    const env = createMockEnv();
    const eventBody = makeWebhookEvent('checkout.session.completed', { id: 'cs_notify' });
    await callWebhook(eventBody, env);

    // The third fetch call should be the Resend email
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const [emailUrl, emailOpts] = fetchMock.mock.calls[2];
    expect(emailUrl).toBe('https://api.resend.com/emails');
    const emailBody = JSON.parse(emailOpts?.body as string);
    expect(emailBody.subject).toContain('New purchase');
    expect(emailBody.subject).toContain('Sheets');
    expect(emailBody.subject).toContain('buyer@example.com');
    expect(emailBody.text).toContain('$9.99');
  });

  it('includes promo code info in purchase notification', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'cs_promo',
          url: '',
          metadata: { token: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', plan: 'yearly', product: 'gmail' },
          customer: 'cus_p',
          subscription: 'sub_p',
          customer_details: { email: 'promo@example.com' },
          amount_total: 0,
        }),
        { status: 200 },
      ),
    );

    // trackDiscountUsage — with promo code
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          total_details: {
            breakdown: {
              discounts: [
                { discount: { promotion_code: 'promo_abc123', coupon: { name: 'LAUNCH50' } } },
              ],
            },
          },
        }),
        { status: 200 },
      ),
    );

    // sendAdminEmail
    mockResendSuccess();

    const env = createMockEnv();
    const eventBody = makeWebhookEvent('checkout.session.completed', { id: 'cs_promo' });
    await callWebhook(eventBody, env);

    const [, emailOpts] = fetchMock.mock.calls[2];
    const emailBody = JSON.parse(emailOpts?.body as string);
    expect(emailBody.text).toContain('LAUNCH50');
  });

  it('handles missing metadata gracefully (no crash)', async () => {
    // retrieveCheckoutSession mock returns no metadata
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'cs_test_no_meta',
          url: '',
          metadata: {},
          customer: null,
          subscription: null,
        }),
        { status: 200 },
      ),
    );

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const eventBody = makeWebhookEvent('checkout.session.completed', { id: 'cs_test_no_meta' });
    const response = await callWebhook(eventBody);

    // Should still return 200 (event acknowledged, but not processed)
    expect(response.status).toBe(200);

    consoleSpy.mockRestore();
  });

  it('sets expires_at for lifetime plans to 2099', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'cs_lt',
          url: '',
          metadata: { token: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', plan: 'lifetime', product: 'suite' },
          customer: 'cus_lt',
          subscription: null,
          customer_details: { email: 'lt@example.com' },
          amount_total: 4999,
        }),
        { status: 200 },
      ),
    );

    // trackDiscountUsage
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ total_details: { breakdown: { discounts: [] } } }), { status: 200 }),
    );

    // sendAdminEmail
    mockResendSuccess();

    const env = createMockEnv();
    const eventBody = makeWebhookEvent('checkout.session.completed', { id: 'cs_lt' });
    await callWebhook(eventBody, env);

    const db = env.DB as unknown as MockD1Database;
    // Check that bind was called with '2099-12-31T23:59:59Z' as the expiresAt
    const bindArgs = db._statement.bind.mock.calls[0];
    expect(bindArgs).toContain('2099-12-31T23:59:59Z');
  });

  it('defaults product to gmail when not in metadata', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'cs_default',
          url: '',
          metadata: { token: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', plan: 'monthly' },
          customer: 'cus_def',
          subscription: 'sub_def',
          customer_details: { email: 'default@example.com' },
          amount_total: 99,
        }),
        { status: 200 },
      ),
    );

    // trackDiscountUsage
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ total_details: { breakdown: { discounts: [] } } }), { status: 200 }),
    );

    // sendAdminEmail
    mockResendSuccess();

    const env = createMockEnv();
    const eventBody = makeWebhookEvent('checkout.session.completed', { id: 'cs_default' });
    await callWebhook(eventBody, env);

    const db = env.DB as unknown as MockD1Database;
    const bindArgs = db._statement.bind.mock.calls[0];
    // Product should be 'gmail' (the default)
    expect(bindArgs[1]).toBe('gmail');
  });
});

describe('webhook — discount usage tracking', () => {
  it('logs promotion code usage on checkout with discount', async () => {
    // retrieveCheckoutSession
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'cs_disc',
          url: '',
          metadata: { token: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', plan: 'yearly', product: 'gmail' },
          customer: 'cus_disc',
          subscription: 'sub_disc',
          customer_details: { email: 'discount@example.com' },
          amount_total: 0,
        }),
        { status: 200 },
      ),
    );

    // trackDiscountUsage — expanded session with a discount
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          total_details: {
            breakdown: {
              discounts: [
                { discount: { promotion_code: 'promo_abc123' } },
              ],
            },
          },
        }),
        { status: 200 },
      ),
    );

    // sendAdminEmail
    mockResendSuccess();

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const env = createMockEnv();
    const eventBody = makeWebhookEvent('checkout.session.completed', { id: 'cs_disc' });
    const response = await callWebhook(eventBody, env);

    expect(response.status).toBe(200);

    // Stripe tracks times_redeemed natively — we just log for observability
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('promo_abc123'),
    );

    consoleSpy.mockRestore();
  });
});

describe('webhook — customer.subscription.updated', () => {
  it('maps "active" Stripe status to "active" license with "active" stripe_status', async () => {
    const env = createMockEnv();
    const eventBody = makeWebhookEvent('customer.subscription.updated', {
      id: 'sub_123',
      status: 'active',
    });
    const response = await callWebhook(eventBody, env);

    expect(response.status).toBe(200);
    const db = env.DB as unknown as MockD1Database;
    expect(db._statement.bind).toHaveBeenCalledWith('active', 'active', null, 'sub_123');
  });

  it('maps "canceled" Stripe status to "inactive" license', async () => {
    const env = createMockEnv();
    const eventBody = makeWebhookEvent('customer.subscription.updated', {
      id: 'sub_456',
      status: 'canceled',
    });
    await callWebhook(eventBody, env);

    const db = env.DB as unknown as MockD1Database;
    expect(db._statement.bind).toHaveBeenCalledWith('inactive', 'active', null, 'sub_456');
  });

  it('maps "past_due" Stripe status to "active" license with "past_due" stripe_status', async () => {
    const env = createMockEnv();
    const eventBody = makeWebhookEvent('customer.subscription.updated', {
      id: 'sub_pd',
      status: 'past_due',
    });
    await callWebhook(eventBody, env);

    const db = env.DB as unknown as MockD1Database;
    expect(db._statement.bind).toHaveBeenCalledWith('active', 'past_due', null, 'sub_pd');
  });

  it('maps "incomplete_expired" to "inactive"', async () => {
    const env = createMockEnv();
    const eventBody = makeWebhookEvent('customer.subscription.updated', {
      id: 'sub_ie',
      status: 'incomplete_expired',
    });
    await callWebhook(eventBody, env);

    const db = env.DB as unknown as MockD1Database;
    expect(db._statement.bind).toHaveBeenCalledWith('inactive', 'active', null, 'sub_ie');
  });

  it('maps "trialing" to "active"', async () => {
    const env = createMockEnv();
    const eventBody = makeWebhookEvent('customer.subscription.updated', {
      id: 'sub_trial',
      status: 'trialing',
    });
    await callWebhook(eventBody, env);

    const db = env.DB as unknown as MockD1Database;
    expect(db._statement.bind).toHaveBeenCalledWith('active', 'active', null, 'sub_trial');
  });

  it('defaults unknown Stripe status to "inactive"', async () => {
    const env = createMockEnv();
    const eventBody = makeWebhookEvent('customer.subscription.updated', {
      id: 'sub_unknown',
      status: 'some_new_status',
    });
    await callWebhook(eventBody, env);

    const db = env.DB as unknown as MockD1Database;
    expect(db._statement.bind).toHaveBeenCalledWith('inactive', 'active', null, 'sub_unknown');
  });

  it('sets stripe_status to "cancel_at_period_end" and stores cancel_at date when subscription is canceling', async () => {
    const env = createMockEnv();
    // current_period_end is a Unix timestamp (seconds): 2026-03-15T00:00:00Z
    const periodEnd = Math.floor(new Date('2026-03-15T00:00:00Z').getTime() / 1000);
    const eventBody = makeWebhookEvent('customer.subscription.updated', {
      id: 'sub_canceling',
      status: 'active',
      cancel_at_period_end: true,
      current_period_end: periodEnd,
    });
    await callWebhook(eventBody, env);

    const db = env.DB as unknown as MockD1Database;
    const bindArgs = db._statement.bind.mock.calls[0];
    expect(bindArgs[0]).toBe('active');
    expect(bindArgs[1]).toBe('cancel_at_period_end');
    expect(bindArgs[2]).toBe('2026-03-15T00:00:00.000Z');
    expect(bindArgs[3]).toBe('sub_canceling');
  });

  it('clears cancel_at when subscription is renewed (cancel_at_period_end becomes false)', async () => {
    const env = createMockEnv();
    const eventBody = makeWebhookEvent('customer.subscription.updated', {
      id: 'sub_renewed',
      status: 'active',
      cancel_at_period_end: false,
    });
    await callWebhook(eventBody, env);

    const db = env.DB as unknown as MockD1Database;
    const bindArgs = db._statement.bind.mock.calls[0];
    expect(bindArgs[0]).toBe('active');
    expect(bindArgs[1]).toBe('active');
    expect(bindArgs[2]).toBeNull();
    expect(bindArgs[3]).toBe('sub_renewed');
  });

  it('sends notification when status changes to a problematic state', async () => {
    const env = createMockEnv();

    // sendAdminEmail for the notification
    mockResendSuccess();

    const eventBody = JSON.stringify({
      id: `evt_${Date.now()}`,
      type: 'customer.subscription.updated',
      data: {
        object: { id: 'sub_pd_notify', status: 'past_due' },
        previous_attributes: { status: 'active' },
      },
    });

    const { header } = await generateWebhookSignature(eventBody, env.STRIPE_WEBHOOK_SECRET);
    const request = new Request('https://darklysuite.com/api/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': header },
      body: eventBody,
    });
    const context = createMockContext({ request, env });
    await onRequestPost(context);

    // Verify email was sent (license lookup + email send)
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [emailUrl] = fetchMock.mock.calls[0];
    expect(emailUrl).toBe('https://api.resend.com/emails');
  });

  it('includes cancellation reason and comment in notification email', async () => {
    const env = createMockEnv();
    const db = env.DB as unknown as MockD1Database;
    db._statement.first.mockResolvedValueOnce({ email: 'cancel@example.com', product: 'gmail', plan: 'monthly' });

    // sendAdminEmail
    mockResendSuccess();

    const eventBody = JSON.stringify({
      id: `evt_${Date.now()}`,
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_cancel_reason',
          status: 'canceled',
          cancellation_details: {
            feedback: 'too_expensive',
            comment: 'I love the extension but cannot afford it right now',
            reason: 'cancellation_requested',
          },
        },
        previous_attributes: { status: 'active' },
      },
    });

    const { header } = await generateWebhookSignature(eventBody, env.STRIPE_WEBHOOK_SECRET);
    const request = new Request('https://darklysuite.com/api/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': header },
      body: eventBody,
    });
    const context = createMockContext({ request, env });
    await onRequestPost(context);

    const [, emailOpts] = fetchMock.mock.calls[0];
    const emailBody = JSON.parse(emailOpts?.body as string);
    expect(emailBody.text).toContain('Too expensive');
    expect(emailBody.text).toContain('I love the extension but cannot afford it right now');
  });

  it('does not send notification when status remains active', async () => {
    const env = createMockEnv();

    const eventBody = JSON.stringify({
      id: `evt_${Date.now()}`,
      type: 'customer.subscription.updated',
      data: {
        object: { id: 'sub_active', status: 'active' },
        previous_attributes: { status: 'trialing' },
      },
    });

    const { header } = await generateWebhookSignature(eventBody, env.STRIPE_WEBHOOK_SECRET);
    const request = new Request('https://darklysuite.com/api/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'stripe-signature': header },
      body: eventBody,
    });
    const context = createMockContext({ request, env });
    await onRequestPost(context);

    // No Resend fetch should have been made
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('webhook — customer.subscription.deleted', () => {
  it('sets license status to "inactive" and sends notification', async () => {
    // sendAdminEmail
    mockResendSuccess();

    const env = createMockEnv();
    const eventBody = makeWebhookEvent('customer.subscription.deleted', {
      id: 'sub_deleted',
    });
    const response = await callWebhook(eventBody, env);

    expect(response.status).toBe(200);
    const db = env.DB as unknown as MockD1Database;

    // First call: SELECT license for notification context
    const selectSql = db.prepare.mock.calls[0][0] as string;
    expect(selectSql).toContain('SELECT email, product, plan');

    // Second call: UPDATE license status
    const updateSql = db.prepare.mock.calls[1][0] as string;
    expect(updateSql).toContain("status = 'inactive'");

    // Verify email was sent
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [emailUrl] = fetchMock.mock.calls[0];
    expect(emailUrl).toBe('https://api.resend.com/emails');
  });

  it('includes cancellation reason in deleted subscription notification', async () => {
    const env = createMockEnv();
    const db = env.DB as unknown as MockD1Database;
    db._statement.first.mockResolvedValueOnce({ email: 'gone@example.com', product: 'sheets', plan: 'yearly' });

    // sendAdminEmail
    mockResendSuccess();

    const eventBody = makeWebhookEvent('customer.subscription.deleted', {
      id: 'sub_deleted_reason',
      cancellation_details: {
        feedback: 'switched_service',
        comment: null,
        reason: 'cancellation_requested',
      },
    });
    const response = await callWebhook(eventBody, env);

    expect(response.status).toBe(200);
    const [, emailOpts] = fetchMock.mock.calls[0];
    const emailBody = JSON.parse(emailOpts?.body as string);
    expect(emailBody.text).toContain('Found an alternative');
    expect(emailBody.text).not.toContain('Comment:');
  });

  it('falls back to Stripe data when license is deleted from D1', async () => {
    // D1 first() returns null by default (license already deleted)

    // retrieveCustomer — Stripe API fallback for email
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ id: 'cus_del', email: 'deleted@example.com', name: null, created: 1700000000 }),
        { status: 200 },
      ),
    );

    // sendAdminEmail
    mockResendSuccess();

    const env = createMockEnv();
    const eventBody = makeWebhookEvent('customer.subscription.deleted', {
      id: 'sub_deleted_no_d1',
      customer: 'cus_del',
      items: { data: [{ price: { id: 'price_sheets_yearly' } }] },
    });
    const response = await callWebhook(eventBody, env);

    expect(response.status).toBe(200);

    // Verify retrieveCustomer was called
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain('/customers/cus_del');

    // Verify email contains correct info from Stripe fallback
    const emailBody = JSON.parse(fetchMock.mock.calls[1][1]?.body as string);
    expect(emailBody.subject).toContain('Sheets');
    expect(emailBody.subject).toContain('Yearly');
    expect(emailBody.subject).toContain('deleted@example.com');
    expect(emailBody.text).toContain('Sheets');
    expect(emailBody.text).toContain('Yearly');
    expect(emailBody.text).toContain('deleted@example.com');
  });
});

describe('webhook — invoice.payment_failed', () => {
  it('sets stripe_status to "past_due" (keeps license active) and sends notifications', async () => {
    // sendAdminEmail + sendUserEmail
    mockResendSuccess();
    mockResendSuccess();

    const env = createMockEnv();
    // Mock the SELECT to return a license with an email so sendUserEmail fires
    const db = env.DB as unknown as MockD1Database;
    db._statement.first.mockResolvedValueOnce({ email: 'user@example.com', product: 'gmail', plan: 'yearly' });

    const eventBody = makeWebhookEvent('invoice.payment_failed', {
      subscription: 'sub_pastdue',
    });
    const response = await callWebhook(eventBody, env);

    expect(response.status).toBe(200);

    // First call: UPDATE stripe_status (license stays active for grace period)
    const updateSql = db.prepare.mock.calls[0][0] as string;
    expect(updateSql).toContain("stripe_status = 'past_due'");
    expect(updateSql).not.toContain("status = 'inactive'");

    // Second call: SELECT license for notification
    const selectSql = db.prepare.mock.calls[1][0] as string;
    expect(selectSql).toContain('SELECT email, product, plan');

    // Verify both emails were sent (admin + user)
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.resend.com/emails');
    expect(fetchMock.mock.calls[1][0]).toBe('https://api.resend.com/emails');

    // Second email should be the user notification
    const userEmailBody = JSON.parse(fetchMock.mock.calls[1][1]?.body as string);
    expect(userEmailBody.to).toBe('user@example.com');
    expect(userEmailBody.subject).toContain('Update your payment method');
  });

  it('does nothing when subscription ID is null', async () => {
    const env = createMockEnv();
    const eventBody = makeWebhookEvent('invoice.payment_failed', {
      subscription: null,
    });
    const response = await callWebhook(eventBody, env);

    expect(response.status).toBe(200);
    const db = env.DB as unknown as MockD1Database;
    expect(db.prepare).not.toHaveBeenCalled();
  });
});

describe('webhook — unknown event type', () => {
  it('returns 200 (acknowledged but not processed)', async () => {
    const eventBody = makeWebhookEvent('some.unknown.event', { id: 'unknown' });
    const response = await callWebhook(eventBody);

    expect(response.status).toBe(200);
    const body = await response.json() as { received: boolean };
    expect(body.received).toBe(true);
  });
});

describe('webhook — handler errors', () => {
  it('returns 500 when handler throws', async () => {
    const env = createMockEnv();

    // retrieveCheckoutSession fails
    fetchMock.mockRejectedValueOnce(new Error('Stripe API down'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const eventBody = makeWebhookEvent('checkout.session.completed', { id: 'cs_crash' });
    const response = await callWebhook(eventBody, env);

    expect(response.status).toBe(500);
    const body = await response.json() as { error: string };
    expect(body.error).toContain('Webhook handler failed');

    consoleSpy.mockRestore();
  });
});

describe('webhook — email notification resilience', () => {
  it('does not break webhook processing when email sending fails', async () => {
    // retrieveCheckoutSession
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'cs_email_fail',
          url: '',
          metadata: { token: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', plan: 'monthly', product: 'gmail' },
          customer: 'cus_ef',
          subscription: 'sub_ef',
          customer_details: { email: 'test@example.com' },
          amount_total: 99,
        }),
        { status: 200 },
      ),
    );

    // trackDiscountUsage
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ total_details: { breakdown: { discounts: [] } } }), { status: 200 }),
    );

    // sendAdminEmail — fails
    fetchMock.mockRejectedValueOnce(new Error('Resend down'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const env = createMockEnv();
    const eventBody = makeWebhookEvent('checkout.session.completed', { id: 'cs_email_fail' });
    const response = await callWebhook(eventBody, env);

    // Webhook should still return 200 — email failure doesn't break it
    expect(response.status).toBe(200);

    consoleSpy.mockRestore();
  });

  it('skips email when RESEND_API_KEY is not configured', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'cs_no_key',
          url: '',
          metadata: { token: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', plan: 'monthly', product: 'gmail' },
          customer: 'cus_nk',
          subscription: 'sub_nk',
          customer_details: { email: 'test@example.com' },
          amount_total: 99,
        }),
        { status: 200 },
      ),
    );

    // trackDiscountUsage
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ total_details: { breakdown: { discounts: [] } } }), { status: 200 }),
    );

    const env = createMockEnv({ RESEND_API_KEY: undefined });
    const eventBody = makeWebhookEvent('checkout.session.completed', { id: 'cs_no_key' });
    const response = await callWebhook(eventBody, env);

    expect(response.status).toBe(200);
    // Only 2 fetch calls (Stripe), no Resend call
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
