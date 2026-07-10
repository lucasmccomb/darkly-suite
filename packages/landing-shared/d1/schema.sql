-- Darkly Suite — Unified D1 Schema (CANONICAL)
-- Supports: gmail, sheets, docs, suite, browse products
--
-- This is the single authoritative schema. The Cloudflare Pages Functions in
-- packages/landing-shared/functions/** run against this database, and every
-- landing-suite function route re-exports from @darkly/landing-shared, so this
-- file is what production D1 must match. The former divergent copy at
-- packages/landing-suite/d1/schema.sql is retired (it now points here).
--
-- Reconciliation (#679, 2026-07-10): folded the two drifted copies into one
-- superset. From the shared copy: licenses.stripe_status, idx_licenses_email,
-- user_sessions, webhook_events. From the suite copy: the discount_code_usages
-- table (queried by functions/api/admin/licenses.ts) and the discount_codes
-- active/max_uses/use_count columns (these mirror the Stripe promotion-code
-- fields the admin discount-codes route manages; retained for superset
-- fidelity even though no D1 query reads them directly).

-- Migration (run once on production D1):
-- UPDATE licenses SET status = 'inactive' WHERE status IN ('cancelled', 'expired', 'past_due');

CREATE TABLE IF NOT EXISTS licenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL,
  product TEXT NOT NULL DEFAULT 'gmail',
  email TEXT,
  plan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_status TEXT NOT NULL DEFAULT 'active',
  discount_code_id INTEGER REFERENCES discount_codes(id),
  cancel_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT,
  UNIQUE(token, product)
);

CREATE INDEX IF NOT EXISTS idx_licenses_token ON licenses(token);
CREATE INDEX IF NOT EXISTS idx_licenses_product ON licenses(product);
CREATE INDEX IF NOT EXISTS idx_licenses_stripe_customer ON licenses(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_licenses_email ON licenses(email);

CREATE TABLE IF NOT EXISTS discount_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value INTEGER NOT NULL,
  product TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  max_uses INTEGER,
  use_count INTEGER NOT NULL DEFAULT 0,
  stripe_coupon_id TEXT,
  stripe_promo_code_id TEXT,
  used_by_email TEXT,
  used_by_license_id INTEGER REFERENCES licenses(id),
  used_at TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);

CREATE TABLE IF NOT EXISTS discount_code_usages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discount_code_id INTEGER NOT NULL REFERENCES discount_codes(id),
  email TEXT,
  license_id INTEGER REFERENCES licenses(id),
  used_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dcu_code_id ON discount_code_usages(discount_code_id);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);

CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

CREATE TABLE IF NOT EXISTS rate_limits (
  ip TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY(ip, endpoint, window_start)
);

-- Webhook idempotency: Stripe redelivers events; the webhook handler claims
-- each event.id here before processing so redeliveries run side effects once.
-- Claims older than 1 hour are reclaimable (orphaned-claim recovery) and rows
-- older than 30 days are pruned opportunistically by the handler.
-- Migration (run once on production D1 BEFORE deploying the dedup guard):
-- CREATE TABLE IF NOT EXISTS webhook_events (id TEXT PRIMARY KEY, received_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);
