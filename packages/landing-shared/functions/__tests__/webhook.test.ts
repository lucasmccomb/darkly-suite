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
        }),
        { status: 200 },
      ),
    );

    // trackDiscountUsage — expanded session fetch
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ total_details: { breakdown: { discounts: [] } } }), { status: 200 }),
    );

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
        }),
        { status: 200 },
      ),
    );

    // trackDiscountUsage
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ total_details: { breakdown: { discounts: [] } } }), { status: 200 }),
    );

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
        }),
        { status: 200 },
      ),
    );

    // trackDiscountUsage
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ total_details: { breakdown: { discounts: [] } } }), { status: 200 }),
    );

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
  it('increments use_count and inserts usage row on checkout with discount', async () => {
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

    const env = createMockEnv();
    const db = env.DB as unknown as MockD1Database;

    // Mock: license lookup returns id=5
    db._statement.first.mockResolvedValueOnce({ id: 5 });
    // Mock: discount_code lookup returns id=10
    db._statement.first.mockResolvedValueOnce({ id: 10 });

    const eventBody = makeWebhookEvent('checkout.session.completed', { id: 'cs_disc' });
    const response = await callWebhook(eventBody, env);

    expect(response.status).toBe(200);

    // Verify use_count increment SQL
    const allSql = db.prepare.mock.calls.map(([sql]: [string]) => sql as string);
    const incrementSql = allSql.find((s: string) => s.includes('use_count = use_count + 1'));
    expect(incrementSql).toBeDefined();

    // Verify discount_code_usages INSERT
    const usageInsert = allSql.find((s: string) => s.includes('INSERT INTO discount_code_usages'));
    expect(usageInsert).toBeDefined();
  });
});

describe('webhook — customer.subscription.updated', () => {
  it('maps "active" Stripe status to "active" license status', async () => {
    const env = createMockEnv();
    const eventBody = makeWebhookEvent('customer.subscription.updated', {
      id: 'sub_123',
      status: 'active',
    });
    const response = await callWebhook(eventBody, env);

    expect(response.status).toBe(200);
    const db = env.DB as unknown as MockD1Database;
    expect(db._statement.bind).toHaveBeenCalledWith('active', 'sub_123');
  });

  it('maps "canceled" Stripe status to "cancelled" license status', async () => {
    const env = createMockEnv();
    const eventBody = makeWebhookEvent('customer.subscription.updated', {
      id: 'sub_456',
      status: 'canceled',
    });
    await callWebhook(eventBody, env);

    const db = env.DB as unknown as MockD1Database;
    expect(db._statement.bind).toHaveBeenCalledWith('cancelled', 'sub_456');
  });

  it('maps "past_due" Stripe status to "past_due"', async () => {
    const env = createMockEnv();
    const eventBody = makeWebhookEvent('customer.subscription.updated', {
      id: 'sub_pd',
      status: 'past_due',
    });
    await callWebhook(eventBody, env);

    const db = env.DB as unknown as MockD1Database;
    expect(db._statement.bind).toHaveBeenCalledWith('past_due', 'sub_pd');
  });

  it('maps "incomplete_expired" to "expired"', async () => {
    const env = createMockEnv();
    const eventBody = makeWebhookEvent('customer.subscription.updated', {
      id: 'sub_ie',
      status: 'incomplete_expired',
    });
    await callWebhook(eventBody, env);

    const db = env.DB as unknown as MockD1Database;
    expect(db._statement.bind).toHaveBeenCalledWith('expired', 'sub_ie');
  });

  it('maps "trialing" to "active"', async () => {
    const env = createMockEnv();
    const eventBody = makeWebhookEvent('customer.subscription.updated', {
      id: 'sub_trial',
      status: 'trialing',
    });
    await callWebhook(eventBody, env);

    const db = env.DB as unknown as MockD1Database;
    expect(db._statement.bind).toHaveBeenCalledWith('active', 'sub_trial');
  });

  it('defaults unknown Stripe status to "active"', async () => {
    const env = createMockEnv();
    const eventBody = makeWebhookEvent('customer.subscription.updated', {
      id: 'sub_unknown',
      status: 'some_new_status',
    });
    await callWebhook(eventBody, env);

    const db = env.DB as unknown as MockD1Database;
    expect(db._statement.bind).toHaveBeenCalledWith('active', 'sub_unknown');
  });
});

describe('webhook — customer.subscription.deleted', () => {
  it('sets license status to "cancelled"', async () => {
    const env = createMockEnv();
    const eventBody = makeWebhookEvent('customer.subscription.deleted', {
      id: 'sub_deleted',
    });
    const response = await callWebhook(eventBody, env);

    expect(response.status).toBe(200);
    const db = env.DB as unknown as MockD1Database;
    const sql = db.prepare.mock.calls[0][0] as string;
    expect(sql).toContain("status = 'cancelled'");
    expect(db._statement.bind).toHaveBeenCalledWith('sub_deleted');
  });
});

describe('webhook — invoice.payment_failed', () => {
  it('sets license status to "past_due"', async () => {
    const env = createMockEnv();
    const eventBody = makeWebhookEvent('invoice.payment_failed', {
      subscription: 'sub_pastdue',
    });
    const response = await callWebhook(eventBody, env);

    expect(response.status).toBe(200);
    const db = env.DB as unknown as MockD1Database;
    const sql = db.prepare.mock.calls[0][0] as string;
    expect(sql).toContain("status = 'past_due'");
    expect(db._statement.bind).toHaveBeenCalledWith('sub_pastdue');
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
