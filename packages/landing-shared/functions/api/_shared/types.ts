export type ProductId = 'gmail' | 'sheets' | 'docs' | 'suite';

export function isValidProduct(product: string): product is ProductId {
  return ['gmail', 'sheets', 'docs', 'suite'].includes(product);
}

export interface Env {
  DB: D1Database;
  SITE_URL: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  // Individual product prices
  STRIPE_PRICE_GMAIL_MONTHLY: string;
  STRIPE_PRICE_GMAIL_YEARLY: string;
  STRIPE_PRICE_GMAIL_LIFETIME: string;
  STRIPE_PRICE_SHEETS_MONTHLY: string;
  STRIPE_PRICE_SHEETS_YEARLY: string;
  STRIPE_PRICE_SHEETS_LIFETIME: string;
  STRIPE_PRICE_DOCS_MONTHLY: string;
  STRIPE_PRICE_DOCS_YEARLY: string;
  STRIPE_PRICE_DOCS_LIFETIME: string;
  // Suite bundle prices
  STRIPE_PRICE_SUITE_MONTHLY: string;
  STRIPE_PRICE_SUITE_YEARLY: string;
  STRIPE_PRICE_SUITE_LIFETIME: string;
  // OAuth
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ADMIN_EMAIL: string;
  // Per-product site URLs (optional) — used for checkout success redirects.
  // When set, Stripe checkout success_url uses this domain instead of SITE_URL.
  SITE_URL_GMAIL?: string;
  SITE_URL_SHEETS?: string;
  SITE_URL_DOCS?: string;
  // CORS — comma-separated list of allowed Chrome extension IDs (stable CWS IDs)
  // When unset, all chrome-extension:// origins are allowed (for local development)
  ALLOWED_EXTENSION_IDS?: string;
}

export interface License {
  id: number;
  token: string;
  product: ProductId;
  email: string | null;
  plan: 'monthly' | 'yearly' | 'lifetime';
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  discount_code_id: number | null;
  created_at: string;
  expires_at: string | null;
}

export type Plan = 'monthly' | 'yearly' | 'lifetime';

export function isValidPlan(plan: string): plan is Plan {
  return ['monthly', 'yearly', 'lifetime'].includes(plan);
}

export function isValidToken(token: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token);
}
