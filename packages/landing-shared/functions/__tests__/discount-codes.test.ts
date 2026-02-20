/**
 * Tests for admin/discount-codes.ts — Stripe-backed CRUD endpoints.
 *
 * All discount code data lives in Stripe (promotion codes + coupons).
 * The admin panel is a thin UI wrapper around Stripe's API.
 */

import { createMockContext, createMockEnv } from './test-helpers';
import type { MockD1Database } from './test-helpers';
import {
  makeStripePromotionCode,
  makeStripeListResponse,
  CREATE_PROMO_PARAMS,
  LIST_PROMO_PARAMS,
} from './fixtures/stripe-promotion-code';

// ---------------------------------------------------------------------------
// Mock fetch for Stripe API calls
// ---------------------------------------------------------------------------

const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
Object.defineProperty(globalThis, 'fetch', { value: fetchMock, writable: true });

// ---------------------------------------------------------------------------
// Import handlers
// ---------------------------------------------------------------------------

import {
  onRequestGet,
  onRequestPost,
  onRequestPatch,
  onRequestDelete,
} from '../api/admin/discount-codes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createAdminContext(request: Request, envOverrides?: Partial<ReturnType<typeof createMockEnv>>) {
  const ctx = createMockContext({
    request,
    env: envOverrides,
  });

  const db = ctx.env.DB as unknown as MockD1Database;
  db._statement.first.mockResolvedValue({ id: 1, session_token: 'tok', email: 'admin@example.com', expires_at: '2099-01-01' });

  return ctx;
}

function adminRequest(url: string, init?: RequestInit): Request {
  return new Request(url, {
    ...init,
    headers: {
      Cookie: 'darkly_admin_session=valid_session_token',
      ...(init?.headers ?? {}),
    },
  });
}

// Fixture: makeStripePromotionCode from ./fixtures/stripe-promotion-code.ts
// Sourced from Stripe API docs, NOT from our code. See fixture file for doc links.

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  fetchMock.mockReset();
});

describe('GET /api/admin/discount-codes', () => {
  it('returns 401 without admin session', async () => {
    const request = new Request('https://darklysuite.com/api/admin/discount-codes');
    const ctx = createMockContext({ request });
    const response = await onRequestGet(ctx);
    expect(response.status).toBe(401);
  });

  // Contract: GET /v1/promotion_codes
  // https://docs.stripe.com/api/promotion_codes/list
  // Must expand data.promotion.coupon to get coupon details.

  it('returns paginated codes from Stripe', async () => {
    const promos = [
      makeStripePromotionCode({ id: 'promo_1', code: 'CODE1' }),
      makeStripePromotionCode({ id: 'promo_2', code: 'CODE2' }),
      makeStripePromotionCode({ id: 'promo_3', code: 'CODE3' }),
    ];

    // Stripe listPromotionCodes
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(makeStripeListResponse(promos)), { status: 200 }),
    );

    const ctx = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/discount-codes?page=1&limit=2'),
    );

    const response = await onRequestGet(ctx);
    expect(response.status).toBe(200);

    // Verify we request the correct expand path (promotion.coupon, NOT coupon)
    const listUrl = (fetchMock.mock.calls[0] as [string, RequestInit])[0];
    expect(listUrl).toContain(LIST_PROMO_PARAMS.expandCoupon);

    const body = await response.json() as { codes: unknown[]; total: number; page: number; limit: number };
    expect(body.total).toBe(3);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(2);
    expect(body.codes).toHaveLength(2);
  });

  it('filters by search term', async () => {
    const promos = [
      makeStripePromotionCode({ id: 'promo_1', code: 'LAUNCH50' }),
      makeStripePromotionCode({ id: 'promo_2', code: 'WELCOME10' }),
    ];

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(makeStripeListResponse(promos)), { status: 200 }),
    );

    const ctx = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/discount-codes?search=LAUNCH'),
    );

    const response = await onRequestGet(ctx);
    const body = await response.json() as { codes: Array<{ code: string }>; total: number };
    expect(body.total).toBe(1);
    expect(body.codes[0].code).toBe('LAUNCH50');
  });

  it('filters by status', async () => {
    const promos = [
      makeStripePromotionCode({ id: 'promo_active', code: 'ACTIVE', active: true, times_redeemed: 0 }),
      makeStripePromotionCode({ id: 'promo_inactive', code: 'INACTIVE', active: false }),
    ];

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(makeStripeListResponse(promos)), { status: 200 }),
    );

    const ctx = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/discount-codes?status=inactive'),
    );

    const response = await onRequestGet(ctx);
    const body = await response.json() as { codes: Array<{ code: string }>; total: number };
    expect(body.total).toBe(1);
    expect(body.codes[0].code).toBe('INACTIVE');
  });

  it('filters by product', async () => {
    const promos = [
      makeStripePromotionCode({ id: 'promo_gmail', code: 'GMAIL', metadata: { product: 'gmail' } }),
      makeStripePromotionCode({ id: 'promo_all', code: 'ALLAPPS', metadata: {} }),
      makeStripePromotionCode({ id: 'promo_sheets', code: 'SHEETS', metadata: { product: 'sheets' } }),
    ];

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(makeStripeListResponse(promos)), { status: 200 }),
    );

    const ctx = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/discount-codes?product=gmail'),
    );

    const response = await onRequestGet(ctx);
    const body = await response.json() as { codes: Array<{ code: string }>; total: number };
    // Should match gmail-specific + codes with no product (applicable to all)
    expect(body.total).toBe(2);
    const codes = body.codes.map((c) => c.code);
    expect(codes).toContain('GMAIL');
    expect(codes).toContain('ALLAPPS');
  });
});

describe('POST /api/admin/discount-codes', () => {
  // Contract: POST /v1/promotion_codes
  // https://docs.stripe.com/api/promotion_codes/create
  // Coupon MUST be nested: promotion[type]=coupon & promotion[coupon]=<id>

  it('creates a single code with Stripe coupon and promo code', async () => {
    // Stripe createCoupon
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'coupon_123', object: 'coupon' }), { status: 200 }),
    );
    // Stripe createPromotionCode
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'promo_123', code: 'TESTCODE', object: 'promotion_code' }), { status: 200 }),
    );

    const ctx = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'TESTCODE',
          discount_type: 'percent',
          discount_value: 50,
          product: 'gmail',
        }),
      }),
    );

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(201);

    const body = await response.json() as { id: string; code: string };
    expect(body.id).toBe('promo_123');
    expect(body.code).toBe('TESTCODE');

    // Verify promo creation uses correct nested Stripe params (not bare `coupon`)
    const promoCall = fetchMock.mock.calls[1];
    const promoBody = promoCall[1]?.body as string;
    expect(promoBody).toContain(CREATE_PROMO_PARAMS.promotionType);
    expect(promoBody).toContain(CREATE_PROMO_PARAMS.promotionCouponPrefix + 'coupon_123');
    expect(promoBody).toContain('metadata%5Bproduct%5D=gmail');
  });

  it('validates discount_type', async () => {
    const ctx = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discount_type: 'invalid', discount_value: 50 }),
      }),
    );

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
  });

  it('rejects bulk with custom code', async () => {
    const ctx = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discount_type: 'percent', discount_value: 50, code: 'CUSTOM', count: 5 }),
      }),
    );

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(400);
    const body = await response.json() as { error: string };
    expect(body.error).toContain('Cannot specify a custom code');
  });

  it('creates bulk codes', async () => {
    const count = 3;

    // 1 coupon call + 3 promo calls
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'coupon_bulk', object: 'coupon' }), { status: 200 }),
    );
    for (let i = 0; i < count; i++) {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ id: `promo_${i}`, code: `CODE${i}`, object: 'promotion_code' }), { status: 200 }),
      );
    }

    const ctx = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discount_type: 'percent', discount_value: 100, count }),
      }),
    );

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(201);

    const body = await response.json() as { codes: unknown[]; count: number };
    expect(body.count).toBe(3);
    expect(body.codes).toHaveLength(3);
  });
});

describe('PATCH /api/admin/discount-codes', () => {
  it('returns 400 without id parameter', async () => {
    const ctx = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/discount-codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      }),
    );

    const response = await onRequestPatch(ctx);
    expect(response.status).toBe(400);
  });

  it('returns 400 when no fields to update', async () => {
    const ctx = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/discount-codes?id=promo_123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );

    const response = await onRequestPatch(ctx);
    expect(response.status).toBe(400);
  });

  it('toggles active state via Stripe', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'promo_123', active: false }), { status: 200 }),
    );

    const ctx = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/discount-codes?id=promo_123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      }),
    );

    const response = await onRequestPatch(ctx);
    expect(response.status).toBe(200);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/promotion_codes/promo_123'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('updates product scope via Stripe metadata', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'promo_123', active: true }), { status: 200 }),
    );

    const ctx = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/discount-codes?id=promo_123', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: 'sheets' }),
      }),
    );

    const response = await onRequestPatch(ctx);
    expect(response.status).toBe(200);

    const callBody = fetchMock.mock.calls[0][1]?.body as string;
    expect(callBody).toContain('metadata%5Bproduct%5D=sheets');
  });
});

describe('DELETE /api/admin/discount-codes', () => {
  it('returns 400 without id parameter', async () => {
    const ctx = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/discount-codes', {
        method: 'DELETE',
      }),
    );

    const response = await onRequestDelete(ctx);
    expect(response.status).toBe(400);
  });

  it('deactivates promo code via Stripe', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'promo_del', active: false }), { status: 200 }),
    );

    const ctx = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/discount-codes?id=promo_del', {
        method: 'DELETE',
      }),
    );

    const response = await onRequestDelete(ctx);
    expect(response.status).toBe(200);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/promotion_codes/promo_del'),
      expect.objectContaining({ method: 'POST' }),
    );

    // Verify it sets active=false
    const callBody = fetchMock.mock.calls[0][1]?.body as string;
    expect(callBody).toContain('active=false');
  });
});
