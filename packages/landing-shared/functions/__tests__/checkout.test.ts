/**
 * Tests for checkout.ts — Stripe Checkout session creation.
 *
 * This endpoint initiates the payment flow. Bugs here mean users can't pay
 * (revenue loss) or get charged wrong amounts (bad UX + support burden).
 */

import { createMockContext } from './test-helpers';

// ---------------------------------------------------------------------------
// Mock fetch for Stripe API calls
// ---------------------------------------------------------------------------

const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
Object.defineProperty(globalThis, 'fetch', { value: fetchMock, writable: true });

import { onRequestGet, onRequestPost, onRequestOptions } from '../api/checkout';

beforeEach(() => {
  fetchMock.mockReset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const validToken = '12345678-1234-4123-8123-123456789abc';

describe('checkout — OPTIONS', () => {
  it('returns 204 with CORS headers', async () => {
    const context = createMockContext({
      request: new Request('https://darklysuite.com/api/checkout', {
        method: 'OPTIONS',
        headers: { Origin: 'https://mail.google.com' },
      }),
    });

    const response = await onRequestOptions(context);
    expect(response.status).toBe(204);
  });
});

describe('checkout — validation', () => {
  it('returns 400 when token is missing', async () => {
    const context = createMockContext({
      request: new Request('https://darklysuite.com/api/checkout?plan=yearly&product=gmail'),
    });

    const response = await onRequestGet(context);
    expect(response.status).toBe(400);

    const body = await response.json() as { error: string };
    expect(body.error).toContain('token');
  });

  it('returns 400 when token is invalid format', async () => {
    const context = createMockContext({
      request: new Request('https://darklysuite.com/api/checkout?token=bad-token&plan=yearly&product=gmail'),
    });

    const response = await onRequestGet(context);
    expect(response.status).toBe(400);

    const body = await response.json() as { error: string };
    expect(body.error).toContain('token');
  });

  it('returns 400 when plan is missing', async () => {
    const context = createMockContext({
      request: new Request(`https://darklysuite.com/api/checkout?token=${validToken}&product=gmail`),
    });

    const response = await onRequestGet(context);
    expect(response.status).toBe(400);

    const body = await response.json() as { error: string };
    expect(body.error).toContain('plan');
  });

  it('returns 400 when plan is invalid', async () => {
    const context = createMockContext({
      request: new Request(`https://darklysuite.com/api/checkout?token=${validToken}&plan=weekly&product=gmail`),
    });

    const response = await onRequestGet(context);
    expect(response.status).toBe(400);

    const body = await response.json() as { error: string };
    expect(body.error).toContain('plan');
  });

  it('returns 400 when product is invalid', async () => {
    const context = createMockContext({
      request: new Request(`https://darklysuite.com/api/checkout?token=${validToken}&plan=yearly&product=outlook`),
    });

    const response = await onRequestGet(context);
    expect(response.status).toBe(400);

    const body = await response.json() as { error: string };
    expect(body.error).toContain('product');
  });
});

describe('checkout — successful session creation', () => {
  it('creates a subscription checkout for monthly plan', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ id: 'cs_test', url: 'https://checkout.stripe.com/cs_test' }),
        { status: 200 },
      ),
    );

    const context = createMockContext({
      request: new Request(
        `https://darklysuite.com/api/checkout?token=${validToken}&plan=monthly&product=gmail`,
      ),
    });

    const response = await onRequestGet(context);
    expect(response.status).toBe(303);
    expect(response.headers.get('Location')).toBe('https://checkout.stripe.com/cs_test');

    // Verify Stripe API was called with subscription mode
    const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string;
    expect(body).toContain('mode=subscription');
    expect(body).toContain(encodeURIComponent('line_items[0][price]') + '=price_gmail_monthly');
    // customer_creation is only valid for payment mode — must not be sent for subscriptions
    expect(body).not.toContain('customer_creation');
  });

  it('creates a payment checkout for lifetime plan with customer_creation=always', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ id: 'cs_lt', url: 'https://checkout.stripe.com/cs_lt' }),
        { status: 200 },
      ),
    );

    const context = createMockContext({
      request: new Request(
        `https://darklysuite.com/api/checkout?token=${validToken}&plan=lifetime&product=suite`,
      ),
    });

    const response = await onRequestGet(context);
    expect(response.status).toBe(303);

    const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string;
    expect(body).toContain('mode=payment');
    expect(body).toContain(encodeURIComponent('line_items[0][price]') + '=price_suite_lifetime');
    expect(body).toContain('customer_creation=always');
  });

  it('creates a subscription checkout for yearly plan', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ id: 'cs_yr', url: 'https://checkout.stripe.com/cs_yr' }),
        { status: 200 },
      ),
    );

    const context = createMockContext({
      request: new Request(
        `https://darklysuite.com/api/checkout?token=${validToken}&plan=yearly&product=sheets`,
      ),
    });

    const response = await onRequestGet(context);
    expect(response.status).toBe(303);

    const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string;
    expect(body).toContain('mode=subscription');
    expect(body).toContain(encodeURIComponent('line_items[0][price]') + '=price_sheets_yearly');
  });

  it('defaults product to gmail when not specified', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ id: 'cs_default', url: 'https://checkout.stripe.com/cs_default' }),
        { status: 200 },
      ),
    );

    const context = createMockContext({
      request: new Request(
        `https://darklysuite.com/api/checkout?token=${validToken}&plan=yearly`,
      ),
    });

    const response = await onRequestGet(context);
    expect(response.status).toBe(303);

    const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string;
    expect(body).toContain(encodeURIComponent('line_items[0][price]') + '=price_gmail_yearly');
  });

  it('includes metadata with token, plan, and product', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'cs_meta', url: 'https://checkout.stripe.com/cs_meta' }), { status: 200 }),
    );

    const context = createMockContext({
      request: new Request(
        `https://darklysuite.com/api/checkout?token=${validToken}&plan=yearly&product=docs`,
      ),
    });

    await onRequestGet(context);

    const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string;
    expect(body).toContain(encodeURIComponent('metadata[token]') + `=${encodeURIComponent(validToken)}`);
    expect(body).toContain(encodeURIComponent('metadata[plan]') + '=yearly');
    expect(body).toContain(encodeURIComponent('metadata[product]') + '=docs');
  });

  it('sets correct success and cancel URLs', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'cs_urls', url: 'https://checkout.stripe.com/cs_urls' }), { status: 200 }),
    );

    const context = createMockContext({
      request: new Request(
        `https://darklysuite.com/api/checkout?token=${validToken}&plan=yearly&product=sheets`,
      ),
    });

    await onRequestGet(context);

    const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string;
    expect(body).toContain(encodeURIComponent('success_url'));
    expect(body).toContain(encodeURIComponent('{CHECKOUT_SESSION_ID}'));
    expect(body).toContain(encodeURIComponent('cancel_url'));
  });

  it('sets suite cancel URL to root (no product path)', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'cs_suite', url: 'https://checkout.stripe.com/cs_suite' }), { status: 200 }),
    );

    const context = createMockContext({
      request: new Request(
        `https://darklysuite.com/api/checkout?token=${validToken}&plan=yearly&product=suite`,
      ),
    });

    await onRequestGet(context);

    const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string;
    // Suite cancel URL should be the root + #pricing, not /suite#pricing
    const cancelUrlParam = decodeURIComponent(body).match(/cancel_url=([^&]+)/)?.[1];
    expect(cancelUrlParam).toContain('darklysuite.com/#pricing');
  });
});

describe('checkout — POST handler', () => {
  it('also handles POST requests', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ id: 'cs_post', url: 'https://checkout.stripe.com/cs_post' }),
        { status: 200 },
      ),
    );

    const context = createMockContext({
      request: new Request(
        `https://darklysuite.com/api/checkout?token=${validToken}&plan=yearly&product=gmail`,
        { method: 'POST' },
      ),
    });

    const response = await onRequestPost(context);
    expect(response.status).toBe(303);
  });
});

describe('checkout — email prefill', () => {
  it('passes customer_email to Stripe when email param is present', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ id: 'cs_email', url: 'https://checkout.stripe.com/cs_email' }),
        { status: 200 },
      ),
    );

    const context = createMockContext({
      request: new Request(
        `https://darklysuite.com/api/checkout?token=${validToken}&plan=yearly&product=gmail&email=user%40example.com`,
      ),
    });

    const response = await onRequestGet(context);
    expect(response.status).toBe(303);

    const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string;
    expect(body).toContain('customer_email=user%40example.com');
  });

  it('does not include customer_email when email param is absent', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ id: 'cs_noemail', url: 'https://checkout.stripe.com/cs_noemail' }),
        { status: 200 },
      ),
    );

    const context = createMockContext({
      request: new Request(
        `https://darklysuite.com/api/checkout?token=${validToken}&plan=yearly&product=gmail`,
      ),
    });

    const response = await onRequestGet(context);
    expect(response.status).toBe(303);

    const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string;
    expect(body).not.toContain('customer_email');
  });
});

describe('checkout — Stripe error handling', () => {
  it('returns 500 when Stripe API fails', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Internal server error', { status: 500 }));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const context = createMockContext({
      request: new Request(
        `https://darklysuite.com/api/checkout?token=${validToken}&plan=yearly&product=gmail`,
      ),
    });

    const response = await onRequestGet(context);
    expect(response.status).toBe(500);

    const body = await response.json() as { error: string };
    expect(body.error).toContain('Failed to create checkout session');

    consoleSpy.mockRestore();
  });
});
