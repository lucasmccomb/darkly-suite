/**
 * Tests for status/[token].ts — License status API.
 *
 * Every extension calls this endpoint to check if the user has paid.
 * A bug here means either blocking paying users or granting free access.
 */

import { createMockContext, createMockLicense } from './test-helpers';
import type { MockD1Database } from './test-helpers';
import { onRequestGet, onRequestOptions } from '../api/status/[token]';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('status/[token] — OPTIONS', () => {
  it('returns 204 with CORS headers', async () => {
    const context = createMockContext({
      request: new Request('https://darklysuite.com/api/status/tok', {
        method: 'OPTIONS',
        headers: { Origin: 'https://mail.google.com' },
      }),
    });

    const response = await onRequestOptions(context);
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://mail.google.com');
  });
});

describe('status/[token] — GET', () => {
  const validToken = '12345678-1234-4123-8123-123456789abc';

  it('returns { paid: true } for a valid token with active license', async () => {
    const license = createMockLicense({
      token: validToken,
      product: 'gmail',
      plan: 'yearly',
      status: 'active',
      expires_at: null,
    });

    const context = createMockContext({
      request: new Request(`https://darklysuite.com/api/status/${validToken}?product=gmail`, {
        headers: { Origin: 'https://mail.google.com' },
      }),
      params: { token: validToken },
    });

    const db = context.env.DB as unknown as MockD1Database;
    db._statement.first.mockResolvedValueOnce(license);

    const response = await onRequestGet(context);
    expect(response.status).toBe(200);

    const body = await response.json() as { paid: boolean; plan: string; product: string; expiresAt: string | null };
    expect(body.paid).toBe(true);
    expect(body.plan).toBe('yearly');
    expect(body.product).toBe('gmail');
  });

  it('returns { paid: false } when no license exists', async () => {
    const context = createMockContext({
      request: new Request(`https://darklysuite.com/api/status/${validToken}?product=gmail`, {
        headers: { Origin: 'https://mail.google.com' },
      }),
      params: { token: validToken },
    });

    const db = context.env.DB as unknown as MockD1Database;
    db._statement.first.mockResolvedValueOnce(null);

    const response = await onRequestGet(context);
    expect(response.status).toBe(200);

    const body = await response.json() as { paid: boolean; plan: null; product: null; expiresAt: null };
    expect(body.paid).toBe(false);
    expect(body.plan).toBeNull();
    expect(body.product).toBeNull();
    expect(body.expiresAt).toBeNull();
  });

  it('returns 400 for an invalid token format', async () => {
    const context = createMockContext({
      request: new Request('https://darklysuite.com/api/status/not-a-uuid?product=gmail', {
        headers: { Origin: 'https://mail.google.com' },
      }),
      params: { token: 'not-a-uuid' },
    });

    const response = await onRequestGet(context);
    expect(response.status).toBe(400);

    const body = await response.json() as { error: string };
    expect(body.error).toContain('Invalid token');
  });

  it('returns 400 for an invalid product', async () => {
    const context = createMockContext({
      request: new Request(`https://darklysuite.com/api/status/${validToken}?product=outlook`, {
        headers: { Origin: 'https://mail.google.com' },
      }),
      params: { token: validToken },
    });

    const response = await onRequestGet(context);
    expect(response.status).toBe(400);

    const body = await response.json() as { error: string };
    expect(body.error).toContain('Invalid product');
  });

  it('defaults product to "gmail" when not specified', async () => {
    const license = createMockLicense({ product: 'gmail' });

    const context = createMockContext({
      request: new Request(`https://darklysuite.com/api/status/${validToken}`, {
        headers: { Origin: 'https://mail.google.com' },
      }),
      params: { token: validToken },
    });

    const db = context.env.DB as unknown as MockD1Database;
    db._statement.first.mockResolvedValueOnce(license);

    const response = await onRequestGet(context);
    expect(response.status).toBe(200);

    const body = await response.json() as { paid: boolean };
    expect(body.paid).toBe(true);
  });

  it('suite license satisfies individual product query', async () => {
    // A suite license should show up when querying for 'gmail'
    // The SQL uses `product IN (?, 'suite')` with ORDER BY preference
    const suiteLicense = createMockLicense({
      product: 'suite',
      plan: 'lifetime',
      expires_at: '2099-12-31T23:59:59Z',
    });

    const context = createMockContext({
      request: new Request(`https://darklysuite.com/api/status/${validToken}?product=gmail`, {
        headers: { Origin: 'https://mail.google.com' },
      }),
      params: { token: validToken },
    });

    const db = context.env.DB as unknown as MockD1Database;
    db._statement.first.mockResolvedValueOnce(suiteLicense);

    const response = await onRequestGet(context);
    const body = await response.json() as { paid: boolean; product: string; plan: string };
    expect(body.paid).toBe(true);
    expect(body.product).toBe('suite');
    expect(body.plan).toBe('lifetime');
  });

  it('returns 500 on database error', async () => {
    const context = createMockContext({
      request: new Request(`https://darklysuite.com/api/status/${validToken}?product=gmail`, {
        headers: { Origin: 'https://mail.google.com' },
      }),
      params: { token: validToken },
    });

    const db = context.env.DB as unknown as MockD1Database;
    db._statement.first.mockRejectedValueOnce(new Error('D1 connection failed'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const response = await onRequestGet(context);
    expect(response.status).toBe(500);

    const body = await response.json() as { error: string };
    expect(body.error).toContain('Internal server error');

    consoleSpy.mockRestore();
  });

  it('includes CORS headers in all responses', async () => {
    const context = createMockContext({
      request: new Request(`https://darklysuite.com/api/status/${validToken}?product=gmail`, {
        headers: { Origin: 'https://mail.google.com' },
      }),
      params: { token: validToken },
    });

    const db = context.env.DB as unknown as MockD1Database;
    db._statement.first.mockResolvedValueOnce(null);

    const response = await onRequestGet(context);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://mail.google.com');
  });
});
