export type ProductId = 'gmail' | 'sheets' | 'docs' | 'suite' | 'browse';

export function isValidProduct(product: string): product is ProductId {
  return ['gmail', 'sheets', 'docs', 'suite', 'browse'].includes(product);
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
  // Browse Darkly prices
  STRIPE_PRICE_BROWSE_MONTHLY: string;
  STRIPE_PRICE_BROWSE_YEARLY: string;
  STRIPE_PRICE_BROWSE_LIFETIME: string;
  // Stripe product IDs (for coupon applies_to restriction)
  STRIPE_PRODUCT_GMAIL: string;
  STRIPE_PRODUCT_SHEETS: string;
  STRIPE_PRODUCT_DOCS: string;
  STRIPE_PRODUCT_SUITE: string;
  STRIPE_PRODUCT_BROWSE: string;
  // OAuth
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ADMIN_EMAIL: string;
  // Per-product site URLs (optional) — used for checkout success redirects.
  // When set, Stripe checkout success_url uses this domain instead of SITE_URL.
  SITE_URL_GMAIL?: string;
  SITE_URL_SHEETS?: string;
  SITE_URL_DOCS?: string;
  SITE_URL_BROWSE?: string;
  // Resend API key for admin email notifications
  RESEND_API_KEY?: string;
  // CORS — comma-separated list of allowed Chrome extension IDs (stable CWS IDs).
  // In production, this MUST be set or all chrome-extension:// origins are rejected.
  // In development (ENVIRONMENT === 'development'), unset means all extensions are allowed.
  ALLOWED_EXTENSION_IDS?: string;
  // Deployment environment marker. When set to "development", relaxed CORS rules
  // permit any chrome-extension:// origin if ALLOWED_EXTENSION_IDS is unset.
  // Any other value (or unset) is treated as production: fail-closed CORS.
  ENVIRONMENT?: string;
}

export interface License {
  id: number;
  token: string;
  product: ProductId;
  email: string | null;
  plan: 'monthly' | 'yearly' | 'lifetime';
  status: 'active' | 'inactive';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_status: string;
  discount_code_id: number | null;
  cancel_at: string | null;
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
