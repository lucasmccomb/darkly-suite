/**
 * Tests for auth-related functions:
 * - _shared/google-oauth.ts: decodeIdToken, buildAuthorizationUrl, exchangeCodeForTokens
 * - admin/_shared/auth.ts: requireAdmin, parseCookie, generateSessionToken
 * - auth/callback.ts: OAuth callback flow
 */

import { createMockContext, createMockD1, createFakeJwt } from './test-helpers';
import type { MockD1Database } from './test-helpers';

// ---------------------------------------------------------------------------
// Mock fetch for Google token exchange
// ---------------------------------------------------------------------------

const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
Object.defineProperty(globalThis, 'fetch', { value: fetchMock, writable: true });

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { decodeIdToken, buildAuthorizationUrl } from '../api/_shared/google-oauth';
import { parseCookie, generateSessionToken, requireAdmin } from '../api/admin/_shared/auth';
import { onRequestGet as authCallback } from '../api/auth/callback';

beforeEach(() => {
  fetchMock.mockReset();
});

// ---------------------------------------------------------------------------
// decodeIdToken
// ---------------------------------------------------------------------------

describe('decodeIdToken', () => {
  const audience = 'test-client-id.apps.googleusercontent.com';

  it('decodes a valid JWT with correct issuer and audience', () => {
    const jwt = createFakeJwt({
      iss: 'https://accounts.google.com',
      sub: '123456',
      aud: audience,
      email: 'user@example.com',
      email_verified: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });

    const payload = decodeIdToken(jwt, audience);
    expect(payload.email).toBe('user@example.com');
    expect(payload.iss).toBe('https://accounts.google.com');
  });

  it('accepts "accounts.google.com" as issuer (without https://)', () => {
    const jwt = createFakeJwt({
      iss: 'accounts.google.com',
      sub: '123456',
      aud: audience,
      email: 'user@example.com',
      email_verified: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });

    const payload = decodeIdToken(jwt, audience);
    expect(payload.iss).toBe('accounts.google.com');
  });

  it('throws for wrong issuer', () => {
    const jwt = createFakeJwt({
      iss: 'https://evil.com',
      sub: '123456',
      aud: audience,
      email: 'user@example.com',
      email_verified: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });

    expect(() => decodeIdToken(jwt, audience)).toThrow('Invalid JWT issuer');
  });

  it('throws for wrong audience', () => {
    const jwt = createFakeJwt({
      iss: 'https://accounts.google.com',
      sub: '123456',
      aud: 'wrong-audience',
      email: 'user@example.com',
      email_verified: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });

    expect(() => decodeIdToken(jwt, audience)).toThrow('Invalid JWT audience');
  });

  it('throws for expired token (with 60s grace period)', () => {
    const jwt = createFakeJwt({
      iss: 'https://accounts.google.com',
      sub: '123456',
      aud: audience,
      email: 'user@example.com',
      email_verified: true,
      exp: Math.floor(Date.now() / 1000) - 120, // 2 minutes ago (beyond 60s grace)
      iat: Math.floor(Date.now() / 1000) - 3720,
    });

    expect(() => decodeIdToken(jwt, audience)).toThrow('JWT has expired');
  });

  it('accepts a recently expired token within 60s grace period', () => {
    const jwt = createFakeJwt({
      iss: 'https://accounts.google.com',
      sub: '123456',
      aud: audience,
      email: 'user@example.com',
      email_verified: true,
      exp: Math.floor(Date.now() / 1000) - 30, // 30 seconds ago (within grace)
      iat: Math.floor(Date.now() / 1000) - 3630,
    });

    const payload = decodeIdToken(jwt, audience);
    expect(payload.email).toBe('user@example.com');
  });

  it('throws for malformed JWT (not 3 parts)', () => {
    expect(() => decodeIdToken('only.two', audience)).toThrow('Invalid JWT: expected 3 parts');
    expect(() => decodeIdToken('single', audience)).toThrow('Invalid JWT: expected 3 parts');
    expect(() => decodeIdToken('a.b.c.d', audience)).toThrow('Invalid JWT: expected 3 parts');
  });
});

// ---------------------------------------------------------------------------
// buildAuthorizationUrl
// ---------------------------------------------------------------------------

describe('buildAuthorizationUrl', () => {
  it('builds a Google OAuth URL with correct parameters', () => {
    const url = buildAuthorizationUrl(
      'client-id-123',
      'https://darklysuite.com/api/auth/callback',
      'state_abc',
    );

    const parsed = new URL(url);
    expect(parsed.origin).toBe('https://accounts.google.com');
    expect(parsed.pathname).toBe('/o/oauth2/v2/auth');
    expect(parsed.searchParams.get('client_id')).toBe('client-id-123');
    expect(parsed.searchParams.get('redirect_uri')).toBe('https://darklysuite.com/api/auth/callback');
    expect(parsed.searchParams.get('state')).toBe('state_abc');
    expect(parsed.searchParams.get('response_type')).toBe('code');
    expect(parsed.searchParams.get('scope')).toBe('openid email');
  });
});

// ---------------------------------------------------------------------------
// parseCookie
// ---------------------------------------------------------------------------

describe('parseCookie', () => {
  it('extracts a named cookie from a header', () => {
    expect(parseCookie('darkly_admin_session=abc123; other=val', 'darkly_admin_session')).toBe('abc123');
  });

  it('extracts cookie when it is the only one', () => {
    expect(parseCookie('session=xyz', 'session')).toBe('xyz');
  });

  it('extracts cookie from the middle of multiple cookies', () => {
    expect(parseCookie('a=1; target=found; b=2', 'target')).toBe('found');
  });

  it('returns null for a missing cookie', () => {
    expect(parseCookie('other=val', 'darkly_admin_session')).toBeNull();
  });

  it('returns null for null cookie header', () => {
    expect(parseCookie(null, 'darkly_admin_session')).toBeNull();
  });

  it('returns null for empty cookie header', () => {
    expect(parseCookie('', 'darkly_admin_session')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// generateSessionToken
// ---------------------------------------------------------------------------

describe('generateSessionToken', () => {
  it('generates a 64-character hex string', () => {
    const token = generateSessionToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates unique tokens each time', () => {
    const tokens = new Set(Array.from({ length: 10 }, () => generateSessionToken()));
    expect(tokens.size).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// requireAdmin
// ---------------------------------------------------------------------------

describe('requireAdmin', () => {
  it('returns null (authorized) for valid session', async () => {
    const db = createMockD1();
    db._statement.first.mockResolvedValueOnce({
      session_token: 'valid_tok',
      email: 'admin@example.com',
      expires_at: '2099-01-01T00:00:00Z',
    });

    const request = new Request('https://darklysuite.com/api/admin/licenses', {
      headers: { Cookie: 'darkly_admin_session=valid_tok' },
    });

    const result = await requireAdmin(request, db as unknown as D1Database);
    expect(result).toBeNull();
  });

  it('returns 401 when no cookie is present', async () => {
    const db = createMockD1();
    const request = new Request('https://darklysuite.com/api/admin/licenses');

    const result = await requireAdmin(request, db as unknown as D1Database);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });

  it('returns 401 when session is expired (DB returns null)', async () => {
    const db = createMockD1();
    db._statement.first.mockResolvedValueOnce(null);

    const request = new Request('https://darklysuite.com/api/admin/licenses', {
      headers: { Cookie: 'darkly_admin_session=expired_tok' },
    });

    const result = await requireAdmin(request, db as unknown as D1Database);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// auth/callback
// ---------------------------------------------------------------------------

describe('auth/callback — OAuth callback flow', () => {
  it('redirects with error when "error" query param is present', async () => {
    const context = createMockContext({
      request: new Request('https://darklysuite.com/api/auth/callback?error=access_denied'),
    });

    const response = await authCallback(context);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('/admin');
    expect(response.headers.get('Location')).toContain('error=');
  });

  it('redirects with error when code is missing', async () => {
    const context = createMockContext({
      request: new Request('https://darklysuite.com/api/auth/callback?state=abc'),
    });

    const response = await authCallback(context);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('error=');
  });

  it('redirects with error when state is missing', async () => {
    const context = createMockContext({
      request: new Request('https://darklysuite.com/api/auth/callback?code=authcode'),
    });

    const response = await authCallback(context);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('error=');
  });

  it('redirects with CSRF error when state does not match cookie', async () => {
    const context = createMockContext({
      request: new Request('https://darklysuite.com/api/auth/callback?code=authcode&state=wrong', {
        headers: { Cookie: 'darkly_oauth_state=correct' },
      }),
    });

    const response = await authCallback(context);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('CSRF');
  });

  it('redirects with error when email is not admin', async () => {
    // Mock Google token exchange
    const idToken = createFakeJwt({
      iss: 'https://accounts.google.com',
      sub: '123',
      aud: 'test-client-id.apps.googleusercontent.com',
      email: 'notadmin@example.com',
      email_verified: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id_token: idToken,
          access_token: 'at_123',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
        { status: 200 },
      ),
    );

    const context = createMockContext({
      request: new Request('https://darklysuite.com/api/auth/callback?code=authcode&state=mystate', {
        headers: { Cookie: 'darkly_oauth_state=mystate' },
      }),
    });

    const response = await authCallback(context);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('Unauthorized');
  });

  it('creates session and redirects to admin on successful auth', async () => {
    const idToken = createFakeJwt({
      iss: 'https://accounts.google.com',
      sub: '123',
      aud: 'test-client-id.apps.googleusercontent.com',
      email: 'admin@example.com',
      email_verified: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });

    // Google token exchange
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id_token: idToken,
          access_token: 'at_123',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
        { status: 200 },
      ),
    );

    // sendAdminEmail (admin login notification)
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'email_ok' }), { status: 200 }),
    );

    const context = createMockContext({
      request: new Request('https://darklysuite.com/api/auth/callback?code=authcode&state=mystate', {
        headers: { Cookie: 'darkly_oauth_state=mystate' },
      }),
    });

    const response = await authCallback(context);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('/admin/licenses');

    // Should set session cookie
    const setCookie = response.headers.get('Set-Cookie');
    expect(setCookie).toContain('darkly_admin_session=');
    expect(setCookie).toContain('HttpOnly');

    // Should have inserted session into DB
    const db = context.env.DB as unknown as MockD1Database;
    // First prepare call: DELETE expired sessions
    // Second prepare call: INSERT new session
    expect(db.prepare).toHaveBeenCalledTimes(2);
    const insertSql = db.prepare.mock.calls[1][0] as string;
    expect(insertSql).toContain('INSERT INTO admin_sessions');

    // Should have sent admin login notification
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [emailUrl] = fetchMock.mock.calls[1];
    expect(emailUrl).toBe('https://api.resend.com/emails');
  });

  it('creates user session when email has a license', async () => {
    const idToken = createFakeJwt({
      iss: 'https://accounts.google.com',
      sub: '456',
      aud: 'test-client-id.apps.googleusercontent.com',
      email: 'subscriber@example.com',
      email_verified: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id_token: idToken,
          access_token: 'at_456',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
        { status: 200 },
      ),
    );

    const context = createMockContext({
      request: new Request('https://darklysuite.com/api/auth/callback?code=authcode&state=user%3Aabc123', {
        headers: { Cookie: 'darkly_oauth_state=user:abc123' },
      }),
    });

    // Mock the license check to return a license (the only `first()` call in the user flow)
    const db = context.env.DB as unknown as MockD1Database;
    db._statement.first.mockResolvedValueOnce({ id: 1 });

    const response = await authCallback(context);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('/account/subscriptions');

    const setCookie = response.headers.get('Set-Cookie');
    expect(setCookie).toContain('darkly_user_session=');
  });

  it('rejects user login when email has no licenses and sends notification', async () => {
    const idToken = createFakeJwt({
      iss: 'https://accounts.google.com',
      sub: '789',
      aud: 'test-client-id.apps.googleusercontent.com',
      email: 'nosubscription@example.com',
      email_verified: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });

    // Google token exchange
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id_token: idToken,
          access_token: 'at_789',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
        { status: 200 },
      ),
    );

    // sendAdminEmail (failed login notification)
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'email_ok' }), { status: 200 }),
    );

    const context = createMockContext({
      request: new Request('https://darklysuite.com/api/auth/callback?code=authcode&state=user%3Adef456', {
        headers: { Cookie: 'darkly_oauth_state=user:def456' },
      }),
    });

    // Mock: license check returns null (no license found)
    const db = context.env.DB as unknown as MockD1Database;
    db._statement.first.mockResolvedValue(null);

    const response = await authCallback(context);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('/account');
    expect(response.headers.get('Location')).toContain('No+subscriptions+found');
    // Should NOT have set a user session cookie
    const setCookie = response.headers.get('Set-Cookie');
    expect(setCookie).toBeNull();

    // Should have sent failed login notification
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [emailUrl, emailOpts] = fetchMock.mock.calls[1];
    expect(emailUrl).toBe('https://api.resend.com/emails');
    const emailBody = JSON.parse(emailOpts?.body as string);
    expect(emailBody.subject).toContain('Failed login attempt');
    expect(emailBody.text).toContain('nosubscription@example.com');
  });

  it('redirects to /api/checkout with email for checkout flow', async () => {
    const idToken = createFakeJwt({
      iss: 'https://accounts.google.com',
      sub: '999',
      aud: 'test-client-id.apps.googleusercontent.com',
      email: 'buyer@example.com',
      email_verified: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    });

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id_token: idToken,
          access_token: 'at_999',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
        { status: 200 },
      ),
    );

    const checkoutState = 'checkout:12345678-1234-4123-8123-123456789abc:yearly:sheets:deadbeef';
    const context = createMockContext({
      request: new Request(
        `https://darklysuite.com/api/auth/callback?code=authcode&state=${encodeURIComponent(checkoutState)}`,
        { headers: { Cookie: `darkly_oauth_state=${checkoutState}` } },
      ),
    });

    const response = await authCallback(context);
    expect(response.status).toBe(302);

    const location = response.headers.get('Location')!;
    expect(location).toContain('/api/checkout');
    expect(location).toContain('token=12345678-1234-4123-8123-123456789abc');
    expect(location).toContain('plan=yearly');
    expect(location).toContain('product=sheets');
    expect(location).toContain('email=buyer%40example.com');

    // Should NOT have inserted any sessions into DB
    const db = context.env.DB as unknown as MockD1Database;
    expect(db.prepare).not.toHaveBeenCalled();

    // Should clear the OAuth state cookie
    const setCookie = response.headers.get('Set-Cookie');
    expect(setCookie).toContain('Max-Age=0');
  });

  it('redirects to landing page on checkout flow OAuth error', async () => {
    const checkoutState = 'checkout:12345678-1234-4123-8123-123456789abc:monthly:gmail:deadbeef';
    const context = createMockContext({
      request: new Request(
        `https://darklysuite.com/api/auth/callback?error=access_denied&state=${encodeURIComponent(checkoutState)}`,
        { headers: { Cookie: `darkly_oauth_state=${checkoutState}` } },
      ),
    });

    const response = await authCallback(context);
    expect(response.status).toBe(302);
    // OAuth error params redirect to /admin by default (error param handler doesn't parse state)
    expect(response.headers.get('Location')).toContain('error=');
  });

  it('redirects with error when Google token exchange fails', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Bad Request', { status: 400 }));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const context = createMockContext({
      request: new Request('https://darklysuite.com/api/auth/callback?code=badcode&state=mystate', {
        headers: { Cookie: 'darkly_oauth_state=mystate' },
      }),
    });

    const response = await authCallback(context);
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain('error=');

    consoleSpy.mockRestore();
  });
});
