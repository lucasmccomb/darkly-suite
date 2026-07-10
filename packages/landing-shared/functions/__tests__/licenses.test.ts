/**
 * Tests for admin/licenses.ts — POST (list/search) and DELETE handlers.
 *
 * The list/search endpoint is a POST with a JSON body so admin searches
 * (which routinely contain customer email addresses) never appear in GET
 * query strings or access logs (#670).
 *
 * Also verifies license deletion with Stripe subscription cancellation
 * and D1 foreign key cleanup.
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

import { onRequestDelete, onRequestGet, onRequestPost } from '../api/admin/licenses';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createAdminContext(request: Request, envOverrides?: Partial<ReturnType<typeof createMockEnv>>) {
  const ctx = createMockContext({
    request,
    env: envOverrides,
  });

  const db = ctx.env.DB as unknown as MockD1Database;
  // Admin session check — return a valid session
  db._statement.first.mockResolvedValue({ id: 1, session_token: 'tok', email: 'admin@example.com', expires_at: '2099-01-01' });

  return { ctx, db };
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

describe('POST /api/admin/licenses (list/search)', () => {
  it('returns 401 without admin session', async () => {
    const request = new Request('https://darklysuite.com/api/admin/licenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ search: 'user@example.com' }),
    });
    const ctx = createMockContext({ request });
    const response = await onRequestPost(ctx);
    expect(response.status).toBe(401);
  });

  it('accepts the search term in the JSON body and applies it as a LIKE filter', async () => {
    const { ctx, db } = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search: 'user@example.com', sort: 'email', order: 'asc', page: 1 }),
      }),
    );

    // Admin session check, then COUNT query
    db._statement.first
      .mockResolvedValueOnce({ id: 1, session_token: 'tok', email: 'admin@example.com', expires_at: '2099-01-01' })
      .mockResolvedValueOnce({ total: 1 });
    db._statement.all.mockResolvedValueOnce({
      results: [{ id: 7, email: 'user@example.com', product: 'gmail', plan: 'yearly', status: 'active' }],
      success: true,
    });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(200);

    const body = await response.json() as { licenses: unknown[]; total: number; page: number };
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
    expect(body.licenses).toHaveLength(1);

    // The email search must be bound as a LIKE parameter…
    const bindCalls = db._statement.bind.mock.calls.flat();
    expect(bindCalls).toContain('%user@example.com%');
    // …and must never have been part of the request URL
    expect(ctx.request.url).not.toContain('user');
  });

  it('applies status/plan/product filters from the body', async () => {
    const { ctx, db } = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active', plan: 'yearly', product: 'gmail' }),
      }),
    );

    db._statement.first
      .mockResolvedValueOnce({ id: 1, session_token: 'tok', email: 'admin@example.com', expires_at: '2099-01-01' })
      .mockResolvedValueOnce({ total: 0 });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(200);

    const countSql = db.prepare.mock.calls[1][0] as string;
    expect(countSql).toContain('l.status = ?');
    expect(countSql).toContain('l.plan = ?');
    expect(countSql).toContain('l.product = ?');

    const bindCalls = db._statement.bind.mock.calls.flat();
    expect(bindCalls).toContain('active');
    expect(bindCalls).toContain('yearly');
    expect(bindCalls).toContain('gmail');
  });

  it('returns defaults (page 1, no filters) for an empty or malformed body', async () => {
    const { ctx, db } = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/licenses', {
        method: 'POST',
      }),
    );

    db._statement.first
      .mockResolvedValueOnce({ id: 1, session_token: 'tok', email: 'admin@example.com', expires_at: '2099-01-01' })
      .mockResolvedValueOnce({ total: 0 });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(200);

    const body = await response.json() as { page: number; limit: number };
    expect(body.page).toBe(1);
    expect(body.limit).toBe(50);

    const countSql = db.prepare.mock.calls[1][0] as string;
    expect(countSql).not.toContain('WHERE');
  });

  it('returns 405 for GET — the retired query-string list endpoint (#670)', async () => {
    const { ctx } = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/licenses?search=user%40example.com'),
    );

    const response = await onRequestGet(ctx);
    expect(response.status).toBe(405);

    const body = await response.json() as { error: string };
    expect(body.error).toContain('POST');
  });

  it('whitelists the sort column (rejects SQL injection via sort)', async () => {
    const { ctx, db } = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort: 'created_at; DROP TABLE licenses' }),
      }),
    );

    db._statement.first
      .mockResolvedValueOnce({ id: 1, session_token: 'tok', email: 'admin@example.com', expires_at: '2099-01-01' })
      .mockResolvedValueOnce({ total: 0 });

    const response = await onRequestPost(ctx);
    expect(response.status).toBe(200);

    const listSql = db.prepare.mock.calls[2][0] as string;
    expect(listSql).toContain('ORDER BY l.created_at DESC');
    expect(listSql).not.toContain('DROP TABLE');
  });
});

describe('DELETE /api/admin/licenses', () => {
  it('returns 401 without admin session', async () => {
    const request = new Request('https://darklysuite.com/api/admin/licenses?id=1', {
      method: 'DELETE',
    });
    const ctx = createMockContext({ request });
    const response = await onRequestDelete(ctx);
    expect(response.status).toBe(401);
  });

  it('returns 400 without id parameter', async () => {
    const { ctx } = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/licenses', {
        method: 'DELETE',
      }),
    );

    const response = await onRequestDelete(ctx);
    expect(response.status).toBe(400);

    const body = await response.json() as { error: string };
    expect(body.error).toContain('Missing required parameter: id');
  });

  it('returns ok when license does not exist (idempotent)', async () => {
    const { ctx, db } = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/licenses?id=999', {
        method: 'DELETE',
      }),
    );

    // Admin session check returns valid session, then license lookup returns null
    db._statement.first
      .mockResolvedValueOnce({ id: 1, session_token: 'tok', email: 'admin@example.com', expires_at: '2099-01-01' })
      .mockResolvedValueOnce(null);

    const response = await onRequestDelete(ctx);
    expect(response.status).toBe(200);

    const body = await response.json() as { ok: boolean };
    expect(body.ok).toBe(true);

    // Should NOT call Stripe or batch
    expect(fetchMock).not.toHaveBeenCalled();
    expect(db.batch).not.toHaveBeenCalled();
  });

  it('deletes license and cleans up FK references', async () => {
    const { ctx, db } = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/licenses?id=42', {
        method: 'DELETE',
      }),
    );

    // Admin session, then license lookup (no subscription)
    db._statement.first
      .mockResolvedValueOnce({ id: 1, session_token: 'tok', email: 'admin@example.com', expires_at: '2099-01-01' })
      .mockResolvedValueOnce({ id: 42, stripe_subscription_id: null });

    const response = await onRequestDelete(ctx);
    expect(response.status).toBe(200);

    // Should NOT call Stripe (no subscription)
    expect(fetchMock).not.toHaveBeenCalled();

    // Should call batch with 3 statements
    expect(db.batch).toHaveBeenCalledTimes(1);
    const batchArgs = db.batch.mock.calls[0][0];
    expect(batchArgs).toHaveLength(3);
  });

  it('cancels Stripe subscription when present', async () => {
    const { ctx, db } = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/licenses?id=42', {
        method: 'DELETE',
      }),
    );

    db._statement.first
      .mockResolvedValueOnce({ id: 1, session_token: 'tok', email: 'admin@example.com', expires_at: '2099-01-01' })
      .mockResolvedValueOnce({ id: 42, stripe_subscription_id: 'sub_abc123' });

    // Stripe cancelSubscription succeeds
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'sub_abc123', status: 'canceled' }), { status: 200 }),
    );

    const response = await onRequestDelete(ctx);
    expect(response.status).toBe(200);

    // Verify Stripe was called with DELETE /subscriptions/sub_abc123
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/subscriptions/sub_abc123'),
      expect.objectContaining({ method: 'DELETE' }),
    );

    // D1 batch should still be called
    expect(db.batch).toHaveBeenCalledTimes(1);
  });

  it('still deletes D1 record if Stripe cancellation fails', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { ctx, db } = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/licenses?id=42', {
        method: 'DELETE',
      }),
    );

    db._statement.first
      .mockResolvedValueOnce({ id: 1, session_token: 'tok', email: 'admin@example.com', expires_at: '2099-01-01' })
      .mockResolvedValueOnce({ id: 42, stripe_subscription_id: 'sub_gone' });

    // Stripe fails (subscription already cancelled)
    fetchMock.mockResolvedValueOnce(
      new Response('No such subscription', { status: 404 }),
    );

    const response = await onRequestDelete(ctx);
    expect(response.status).toBe(200);

    // D1 batch should still proceed
    expect(db.batch).toHaveBeenCalledTimes(1);

    // Should have logged a warning
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to cancel Stripe subscription sub_gone'),
      expect.anything(),
    );

    warnSpy.mockRestore();
  });

  it('returns 500 when D1 batch fails', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { ctx, db } = createAdminContext(
      adminRequest('https://darklysuite.com/api/admin/licenses?id=42', {
        method: 'DELETE',
      }),
    );

    db._statement.first
      .mockResolvedValueOnce({ id: 1, session_token: 'tok', email: 'admin@example.com', expires_at: '2099-01-01' })
      .mockResolvedValueOnce({ id: 42, stripe_subscription_id: null });

    // D1 batch throws
    db.batch.mockRejectedValueOnce(new Error('D1 batch failed'));

    const response = await onRequestDelete(ctx);
    expect(response.status).toBe(500);

    const body = await response.json() as { error: string };
    expect(body.error).toBe('Failed to delete license');

    errorSpy.mockRestore();
  });
});
