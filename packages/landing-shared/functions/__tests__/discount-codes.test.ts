/**
 * Tests for admin/discount-codes.ts — CRUD endpoints for discount code management.
 *
 * Tests: paginated GET with filters, bulk POST, PATCH (edit/toggle), DELETE.
 */

import { createMockContext, createMockEnv } from './test-helpers';
import type { MockD1Database } from './test-helpers';

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

/** Create an admin-authenticated context with the given request. */
function createAdminContext(request: Request, envOverrides?: Partial<ReturnType<typeof createMockEnv>>) {
  const ctx = createMockContext({
    request,
    env: envOverrides,
  });

  // Mock admin session — requireAdmin calls db.prepare(SELECT admin_sessions).bind(cookie).first()
  // Make first() return a session so requireAdmin returns null (authorized)
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

  it('returns paginated codes', async () => {
    const ctx = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/discount-codes?page=1&limit=25'),
    );

    const db = ctx.env.DB as unknown as MockD1Database;
    // first() for admin session (already mocked), then first() for COUNT
    db._statement.first
      .mockResolvedValueOnce({ id: 1, session_token: 'tok', email: 'admin@example.com', expires_at: '2099-01-01' })
      .mockResolvedValueOnce({ total: 42 });
    db._statement.all.mockResolvedValueOnce({
      results: [{ id: 1, code: 'TESTCODE', discount_type: 'percent', discount_value: 50, active: 1 }],
      success: true,
    });

    const response = await onRequestGet(ctx);
    expect(response.status).toBe(200);
    const body = await response.json() as { codes: unknown[]; total: number; page: number; limit: number };
    expect(body.total).toBe(42);
    expect(body.page).toBe(1);
    expect(body.limit).toBe(25);
    expect(body.codes).toHaveLength(1);
  });

  it('applies search filter', async () => {
    const ctx = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/discount-codes?search=LAUNCH'),
    );

    const db = ctx.env.DB as unknown as MockD1Database;
    db._statement.first
      .mockResolvedValueOnce({ id: 1, session_token: 'tok', email: 'admin@example.com', expires_at: '2099-01-01' })
      .mockResolvedValueOnce({ total: 1 });
    db._statement.all.mockResolvedValueOnce({ results: [], success: true });

    await onRequestGet(ctx);

    // Check that the COUNT query includes the search condition
    const countSql = db.prepare.mock.calls[1][0] as string;
    expect(countSql).toContain('LIKE');
  });

  it('applies status filter for inactive codes', async () => {
    const ctx = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/discount-codes?status=inactive'),
    );

    const db = ctx.env.DB as unknown as MockD1Database;
    db._statement.first
      .mockResolvedValueOnce({ id: 1, session_token: 'tok', email: 'admin@example.com', expires_at: '2099-01-01' })
      .mockResolvedValueOnce({ total: 0 });
    db._statement.all.mockResolvedValueOnce({ results: [], success: true });

    await onRequestGet(ctx);

    const countSql = db.prepare.mock.calls[1][0] as string;
    expect(countSql).toContain('active = 0');
  });
});

describe('POST /api/admin/discount-codes', () => {
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
          product: ['gmail', 'sheets'],
        }),
      }),
    );

    const db = ctx.env.DB as unknown as MockD1Database;
    db._statement.run.mockResolvedValue({ success: true, meta: { last_row_id: 1 } });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(201);

    const body = await response.json() as { code: string; stripe_coupon_id: string };
    expect(body.code).toBe('TESTCODE');
    expect(body.stripe_coupon_id).toBe('coupon_123');
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

    // Each bulk code needs 2 Stripe calls (coupon shared, but promo is per-code)
    // Actually: 1 coupon call + N promo calls
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

    const db = ctx.env.DB as unknown as MockD1Database;
    db._statement.run.mockResolvedValue({ success: true, meta: { last_row_id: 1 } });

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

  it('returns 404 when code not found', async () => {
    const ctx = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/discount-codes?id=999', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      }),
    );

    const db = ctx.env.DB as unknown as MockD1Database;
    // Admin session check returns session, then code lookup returns null
    db._statement.first
      .mockResolvedValueOnce({ id: 1, session_token: 'tok', email: 'admin@example.com', expires_at: '2099-01-01' })
      .mockResolvedValueOnce(null);

    const response = await onRequestPatch(ctx);
    expect(response.status).toBe(404);
  });

  it('toggles active and syncs with Stripe', async () => {
    // Stripe updatePromotionCode
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'promo_123', active: false }), { status: 200 }),
    );

    const ctx = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/discount-codes?id=1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      }),
    );

    const db = ctx.env.DB as unknown as MockD1Database;
    db._statement.first
      .mockResolvedValueOnce({ id: 1, session_token: 'tok', email: 'admin@example.com', expires_at: '2099-01-01' })
      .mockResolvedValueOnce({ id: 1, stripe_promo_code_id: 'promo_123' });

    const response = await onRequestPatch(ctx);
    expect(response.status).toBe(200);

    // Verify Stripe was called to deactivate
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/promotion_codes/promo_123'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('updates expiration and max_uses', async () => {
    const ctx = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/discount-codes?id=1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_at: '2026-12-31T00:00:00Z', max_uses: 10 }),
      }),
    );

    const db = ctx.env.DB as unknown as MockD1Database;
    db._statement.first
      .mockResolvedValueOnce({ id: 1, session_token: 'tok', email: 'admin@example.com', expires_at: '2099-01-01' })
      .mockResolvedValueOnce({ id: 1, stripe_promo_code_id: null });

    const response = await onRequestPatch(ctx);
    expect(response.status).toBe(200);

    // Verify UPDATE query includes both fields
    const updateCalls = db.prepare.mock.calls.filter(([sql]: [string]) => (sql as string).includes('UPDATE discount_codes SET'));
    expect(updateCalls.length).toBe(1);
    expect(updateCalls[0][0]).toContain('expires_at');
    expect(updateCalls[0][0]).toContain('max_uses');
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

  it('deactivates Stripe promo and deletes from D1', async () => {
    // Stripe updatePromotionCode (deactivate)
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'promo_del', active: false }), { status: 200 }),
    );

    const ctx = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/discount-codes?id=1', {
        method: 'DELETE',
      }),
    );

    const db = ctx.env.DB as unknown as MockD1Database;
    db._statement.first
      .mockResolvedValueOnce({ id: 1, session_token: 'tok', email: 'admin@example.com', expires_at: '2099-01-01' })
      .mockResolvedValueOnce({ id: 1, stripe_promo_code_id: 'promo_del' });

    const response = await onRequestDelete(ctx);
    expect(response.status).toBe(200);

    // Verify Stripe deactivation was called
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/promotion_codes/promo_del'),
      expect.objectContaining({ method: 'POST' }),
    );

    // Verify D1 deletes (usages + code)
    const deleteSqls = db.prepare.mock.calls
      .map(([sql]: [string]) => sql as string)
      .filter((sql: string) => sql.includes('DELETE'));
    expect(deleteSqls).toHaveLength(2);
    expect(deleteSqls[0]).toContain('discount_code_usages');
    expect(deleteSqls[1]).toContain('discount_codes');
  });

  it('returns 404 when code not found', async () => {
    const ctx = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/discount-codes?id=999', {
        method: 'DELETE',
      }),
    );

    const db = ctx.env.DB as unknown as MockD1Database;
    db._statement.first
      .mockResolvedValueOnce({ id: 1, session_token: 'tok', email: 'admin@example.com', expires_at: '2099-01-01' })
      .mockResolvedValueOnce(null);

    const response = await onRequestDelete(ctx);
    expect(response.status).toBe(404);
  });
});
