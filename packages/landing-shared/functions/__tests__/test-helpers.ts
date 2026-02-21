/**
 * Test helpers for @darkly/landing-shared backend functions.
 *
 * Provides mock factories for D1Database, Cloudflare PagesFunction context,
 * and a complete Env mock with sensible defaults.
 */

import type { Env, ProductId, Plan, License } from '../api/_shared/types';

// ---------------------------------------------------------------------------
// D1 Mock
// ---------------------------------------------------------------------------

export interface MockD1PreparedStatement {
  bind: jest.Mock;
  first: jest.Mock;
  run: jest.Mock;
  all: jest.Mock;
}

export interface MockD1Database {
  prepare: jest.Mock;
  batch: jest.Mock;
  _statement: MockD1PreparedStatement;
}

/** Create a mock D1Database with chainable prepare().bind().first()/run()/all(). */
export function createMockD1(): MockD1Database {
  const statement: MockD1PreparedStatement = {
    bind: jest.fn(),
    first: jest.fn().mockResolvedValue(null),
    run: jest.fn().mockResolvedValue({ success: true }),
    all: jest.fn().mockResolvedValue({ results: [], success: true }),
  };

  // .bind() returns the statement itself for chaining
  statement.bind.mockReturnValue(statement);

  const db: MockD1Database = {
    prepare: jest.fn().mockReturnValue(statement),
    // batch() executes an array of prepared statements and returns their results.
    // Default: returns success with count=1 for rate limiting reads.
    batch: jest.fn().mockResolvedValue([
      { success: true },          // cleanup
      { success: true },          // upsert
      { results: [{ count: 1 }], success: true }, // read
    ]),
    _statement: statement,
  };

  return db;
}

// ---------------------------------------------------------------------------
// Env Mock
// ---------------------------------------------------------------------------

export function createMockEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: createMockD1() as unknown as D1Database,
    SITE_URL: 'https://darklysuite.com',
    STRIPE_SECRET_KEY: 'sk_test_fake123',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_fake456',
    STRIPE_PRICE_GMAIL_MONTHLY: 'price_gmail_monthly',
    STRIPE_PRICE_GMAIL_YEARLY: 'price_gmail_yearly',
    STRIPE_PRICE_GMAIL_LIFETIME: 'price_gmail_lifetime',
    STRIPE_PRICE_SHEETS_MONTHLY: 'price_sheets_monthly',
    STRIPE_PRICE_SHEETS_YEARLY: 'price_sheets_yearly',
    STRIPE_PRICE_SHEETS_LIFETIME: 'price_sheets_lifetime',
    STRIPE_PRICE_DOCS_MONTHLY: 'price_docs_monthly',
    STRIPE_PRICE_DOCS_YEARLY: 'price_docs_yearly',
    STRIPE_PRICE_DOCS_LIFETIME: 'price_docs_lifetime',
    STRIPE_PRICE_SUITE_MONTHLY: 'price_suite_monthly',
    STRIPE_PRICE_SUITE_YEARLY: 'price_suite_yearly',
    STRIPE_PRICE_SUITE_LIFETIME: 'price_suite_lifetime',
    STRIPE_PRODUCT_GMAIL: 'prod_test_gmail',
    STRIPE_PRODUCT_SHEETS: 'prod_test_sheets',
    STRIPE_PRODUCT_DOCS: 'prod_test_docs',
    STRIPE_PRODUCT_SUITE: 'prod_test_suite',
    GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: 'test-client-secret',
    ADMIN_EMAIL: 'admin@example.com',
    RESEND_API_KEY: 'test_resend_key',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// PagesFunction Context Mock
// ---------------------------------------------------------------------------

export interface MockContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil: jest.Mock;
  passThroughOnException: jest.Mock;
  next: jest.Mock;
  data: Record<string, unknown>;
  functionPath: string;
}

/**
 * Create a mock PagesFunction context.
 * Returns the mock typed as EventContext<Env, string, unknown> for direct
 * use with onRequestGet/onRequestPost handlers without explicit `as any` casts.
 * Access the underlying MockContext via `.mock` for test assertions.
 */
export function createMockContext(options: {
  request?: Request;
  env?: Partial<Env>;
  params?: Record<string, string>;
}): EventContext<Env, string, Record<string, unknown>> & { env: Env } {
  const env = createMockEnv(options.env);

  const ctx: MockContext = {
    request: options.request ?? new Request('https://darklysuite.com/api/test'),
    env,
    params: options.params ?? {},
    waitUntil: jest.fn(),
    passThroughOnException: jest.fn(),
    next: jest.fn(),
    data: {},
    functionPath: '',
  };

  // Cast once here so callers don't need `as any` everywhere
  return ctx as unknown as EventContext<Env, string, Record<string, unknown>> & { env: Env };
}

// ---------------------------------------------------------------------------
// Webhook Signature Helper
// ---------------------------------------------------------------------------

/**
 * Generate a valid Stripe webhook signature header for testing.
 * Uses the Web Crypto API (available in Node 18+).
 */
export async function generateWebhookSignature(
  payload: string,
  secret: string,
  timestampOverride?: number,
): Promise<{ header: string; timestamp: number }> {
  const timestamp = timestampOverride ?? Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return {
    header: `t=${timestamp},v1=${signature}`,
    timestamp,
  };
}

// ---------------------------------------------------------------------------
// License Factory
// ---------------------------------------------------------------------------

export function createMockLicense(overrides: Partial<License> = {}): License {
  return {
    id: 1,
    token: '12345678-1234-4123-8123-123456789abc',
    product: 'gmail' as ProductId,
    email: 'user@example.com',
    plan: 'yearly' as Plan,
    status: 'active',
    stripe_customer_id: 'cus_test123',
    stripe_subscription_id: 'sub_test123',
    discount_code_id: null,
    created_at: '2025-01-01T00:00:00Z',
    expires_at: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// JWT Helper
// ---------------------------------------------------------------------------

/**
 * Create a fake JWT for testing decodeIdToken.
 * header.payload.signature (signature is not verified by decodeIdToken).
 */
export function createFakeJwt(payload: Record<string, unknown>): string {
  const header = { alg: 'RS256', typ: 'JWT' };
  const encode = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  return `${encode(header)}.${encode(payload)}.fake-signature`;
}
