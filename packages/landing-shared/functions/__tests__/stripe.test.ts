/**
 * Tests for _shared/stripe.ts — Stripe API helpers and webhook signature verification.
 *
 * verifyWebhookSignature is the most payment-critical function: it guards
 * every webhook event that creates/modifies licenses. A bug here means
 * either accepting forged events (security) or rejecting real ones (revenue loss).
 */

import { generateWebhookSignature } from './test-helpers';
import {
  verifyWebhookSignature,
  createCheckoutSession,
  retrieveCheckoutSession,
  createPortalSession,
  createStripeCoupon,
  createStripePromotionCode,
} from '../api/_shared/stripe';

// ---------------------------------------------------------------------------
// Mock fetch globally for Stripe API calls
// ---------------------------------------------------------------------------

const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
Object.defineProperty(globalThis, 'fetch', { value: fetchMock, writable: true });

beforeEach(() => {
  fetchMock.mockReset();
});

// ---------------------------------------------------------------------------
// verifyWebhookSignature
// ---------------------------------------------------------------------------

describe('verifyWebhookSignature', () => {
  const secret = 'whsec_test_secret_key_123';
  const payload = '{"id":"evt_test","type":"checkout.session.completed"}';

  it('accepts a valid signature', async () => {
    const { header } = await generateWebhookSignature(payload, secret);
    const result = await verifyWebhookSignature(payload, header, secret);
    expect(result).toBe(true);
  });

  it('rejects an invalid signature', async () => {
    const { header } = await generateWebhookSignature(payload, secret);
    // Tamper with the signature
    const tamperedHeader = header.replace(/v1=[a-f0-9]+/, 'v1=0000000000000000000000000000000000000000000000000000000000000000');
    const result = await verifyWebhookSignature(payload, tamperedHeader, secret);
    expect(result).toBe(false);
  });

  it('rejects when the payload has been tampered with', async () => {
    const { header } = await generateWebhookSignature(payload, secret);
    const tamperedPayload = payload.replace('checkout.session.completed', 'hacked');
    const result = await verifyWebhookSignature(tamperedPayload, header, secret);
    expect(result).toBe(false);
  });

  it('rejects when signed with a different secret', async () => {
    const { header } = await generateWebhookSignature(payload, 'wrong_secret');
    const result = await verifyWebhookSignature(payload, header, secret);
    expect(result).toBe(false);
  });

  it('rejects an expired timestamp (beyond tolerance)', async () => {
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
    const { header } = await generateWebhookSignature(payload, secret, oldTimestamp);
    const result = await verifyWebhookSignature(payload, header, secret, 300);
    expect(result).toBe(false);
  });

  it('accepts a timestamp within tolerance', async () => {
    const recentTimestamp = Math.floor(Date.now() / 1000) - 100; // 100 seconds ago
    const { header } = await generateWebhookSignature(payload, secret, recentTimestamp);
    const result = await verifyWebhookSignature(payload, header, secret, 300);
    expect(result).toBe(true);
  });

  it('returns false when timestamp is missing', async () => {
    const result = await verifyWebhookSignature(payload, 'v1=somesig', secret);
    expect(result).toBe(false);
  });

  it('returns false when v1 signature is missing', async () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const result = await verifyWebhookSignature(payload, `t=${timestamp}`, secret);
    expect(result).toBe(false);
  });

  it('returns false for a completely empty signature header', async () => {
    const result = await verifyWebhookSignature(payload, '', secret);
    expect(result).toBe(false);
  });

  it('handles multiple v1 signatures (Stripe may send multiple)', async () => {
    // Stripe can include multiple v1= signatures during key rotation
    const { header } = await generateWebhookSignature(payload, secret);
    const parts = header.split(',');
    const timestamp = parts[0];
    const validSig = parts[1];
    const multiHeader = `${timestamp},v1=invalid_hex_signature,${validSig}`;

    const result = await verifyWebhookSignature(payload, multiHeader, secret);
    expect(result).toBe(true);
  });

  it('accepts a future timestamp within tolerance', async () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 100;
    const { header } = await generateWebhookSignature(payload, secret, futureTimestamp);
    const result = await verifyWebhookSignature(payload, header, secret, 300);
    expect(result).toBe(true);
  });

  it('rejects a future timestamp beyond tolerance', async () => {
    const futureTimestamp = Math.floor(Date.now() / 1000) + 600;
    const { header } = await generateWebhookSignature(payload, secret, futureTimestamp);
    const result = await verifyWebhookSignature(payload, header, secret, 300);
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createCheckoutSession
// ---------------------------------------------------------------------------

describe('createCheckoutSession', () => {
  const secretKey = 'sk_test_123';

  it('sends correct parameters and returns session', async () => {
    const mockSession = { id: 'cs_test_123', url: 'https://checkout.stripe.com/cs_test_123' };
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(mockSession), { status: 200 }));

    const result = await createCheckoutSession(secretKey, {
      priceId: 'price_123',
      mode: 'subscription',
      successUrl: 'https://darklysuite.com/success',
      cancelUrl: 'https://darklysuite.com/cancel',
      metadata: { token: 'tok_abc', plan: 'yearly' },
    });

    expect(result).toEqual(mockSession);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.stripe.com/v1/checkout/sessions');
    expect(options.method).toBe('POST');
    expect(options.headers).toHaveProperty('Authorization', `Bearer ${secretKey}`);

    // Verify body contains expected parameters
    const body = options.body as string;
    expect(body).toContain('line_items%5B0%5D%5Bprice%5D=price_123');
    expect(body).toContain('mode=subscription');
    expect(body).toContain('metadata%5Btoken%5D=tok_abc');
    expect(body).toContain('metadata%5Bplan%5D=yearly');
    expect(body).toContain('allow_promotion_codes=true');
  });

  it('includes customer_email when provided', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 200 }));

    await createCheckoutSession(secretKey, {
      priceId: 'price_123',
      mode: 'payment',
      successUrl: 'https://darklysuite.com/success',
      cancelUrl: 'https://darklysuite.com/cancel',
      metadata: {},
      customerEmail: 'user@example.com',
    });

    const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string;
    expect(body).toContain('customer_email=user%40example.com');
  });

  it('throws on non-OK response', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Invalid price', { status: 400 }));

    await expect(
      createCheckoutSession(secretKey, {
        priceId: 'price_invalid',
        mode: 'subscription',
        successUrl: 'https://darklysuite.com/success',
        cancelUrl: 'https://darklysuite.com/cancel',
        metadata: {},
      }),
    ).rejects.toThrow('Stripe createCheckoutSession failed (400)');
  });
});

// ---------------------------------------------------------------------------
// retrieveCheckoutSession
// ---------------------------------------------------------------------------

describe('retrieveCheckoutSession', () => {
  const secretKey = 'sk_test_123';

  it('retrieves a session by ID', async () => {
    const mockSession = { id: 'cs_test_123', url: 'https://checkout.stripe.com/cs_test_123', metadata: { token: 'tok' } };
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(mockSession), { status: 200 }));

    const result = await retrieveCheckoutSession(secretKey, 'cs_test_123');

    expect(result).toEqual(mockSession);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.stripe.com/v1/checkout/sessions/cs_test_123');
    expect(options.method).toBe('GET');
    expect(options.headers).toHaveProperty('Authorization', `Bearer ${secretKey}`);
  });

  it('throws on non-OK response', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Not found', { status: 404 }));

    await expect(retrieveCheckoutSession(secretKey, 'cs_invalid')).rejects.toThrow(
      'Stripe retrieveCheckoutSession failed (404)',
    );
  });
});

// ---------------------------------------------------------------------------
// createPortalSession
// ---------------------------------------------------------------------------

describe('createPortalSession', () => {
  const secretKey = 'sk_test_123';

  it('creates a portal session with correct parameters', async () => {
    const mockPortal = { id: 'bps_123', url: 'https://billing.stripe.com/session/bps_123' };
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(mockPortal), { status: 200 }));

    const result = await createPortalSession(secretKey, 'cus_test', 'https://darklysuite.com/');

    expect(result).toEqual(mockPortal);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.stripe.com/v1/billing_portal/sessions');
    expect(options.method).toBe('POST');

    const body = options.body as string;
    expect(body).toContain('customer=cus_test');
    expect(body).toContain('return_url=https%3A%2F%2Fdarklysuite.com%2F');
  });

  it('throws on non-OK response', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Bad request', { status: 400 }));

    await expect(createPortalSession(secretKey, 'cus_bad', 'https://darklysuite.com/')).rejects.toThrow(
      'Stripe createPortalSession failed (400)',
    );
  });
});

// ---------------------------------------------------------------------------
// createStripeCoupon
// ---------------------------------------------------------------------------

describe('createStripeCoupon', () => {
  const secretKey = 'sk_test_123';

  it('creates a percent-off coupon', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ id: 'coup_1', object: 'coupon' }), { status: 200 }));

    await createStripeCoupon(secretKey, { discountType: 'percent', discountValue: 25, name: '25% Off' });

    const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string;
    expect(body).toContain('percent_off=25');
    expect(body).toContain('duration=once');
    expect(body).not.toContain('amount_off');
  });

  it('creates a 100% off coupon with forever duration', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ id: 'coup_2', object: 'coupon' }), { status: 200 }));

    await createStripeCoupon(secretKey, { discountType: 'percent', discountValue: 100, name: 'Free' });

    const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string;
    expect(body).toContain('percent_off=100');
    expect(body).toContain('duration=forever');
  });

  it('creates a fixed-amount coupon', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ id: 'coup_3', object: 'coupon' }), { status: 200 }));

    await createStripeCoupon(secretKey, { discountType: 'fixed', discountValue: 5, name: '$5 Off' });

    const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string;
    expect(body).toContain('amount_off=500'); // $5 = 500 cents
    expect(body).toContain('currency=usd');
    expect(body).not.toContain('percent_off');
  });

  it('throws on non-OK response', async () => {
    fetchMock.mockResolvedValueOnce(new Response('error', { status: 400 }));

    await expect(
      createStripeCoupon(secretKey, { discountType: 'percent', discountValue: 10, name: 'Bad' }),
    ).rejects.toThrow('Stripe createCoupon failed (400)');
  });
});

// ---------------------------------------------------------------------------
// createStripePromotionCode
// ---------------------------------------------------------------------------

describe('createStripePromotionCode', () => {
  const secretKey = 'sk_test_123';

  it('creates a promotion code', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'promo_1', code: 'SAVE20', object: 'promotion_code' }), { status: 200 }),
    );

    await createStripePromotionCode(secretKey, { couponId: 'coup_1', code: 'SAVE20' });

    const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string;
    expect(body).toContain('code=SAVE20');
    expect(body).toContain('promotion%5Btype%5D=coupon');
    expect(body).toContain('promotion%5Bcoupon%5D=coup_1');
    expect(body).not.toContain('expires_at');
  });

  it('includes expires_at when provided', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'promo_2', code: 'TEMP', object: 'promotion_code' }), { status: 200 }),
    );

    await createStripePromotionCode(secretKey, {
      couponId: 'coup_1',
      code: 'TEMP',
      expiresAt: '2026-12-31T23:59:59Z',
    });

    const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string;
    expect(body).toContain('expires_at=');
  });

  it('throws on non-OK response', async () => {
    fetchMock.mockResolvedValueOnce(new Response('error', { status: 400 }));

    await expect(
      createStripePromotionCode(secretKey, { couponId: 'coup_1', code: 'BAD' }),
    ).rejects.toThrow('Stripe createPromotionCode failed (400)');
  });
});
