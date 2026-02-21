-- Darkly Suite — Unified D1 Schema
-- Supports: gmail, sheets, docs, suite products

CREATE TABLE IF NOT EXISTS licenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL,
  product TEXT NOT NULL DEFAULT 'gmail',
  email TEXT,
  plan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  discount_code_id INTEGER REFERENCES discount_codes(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT,
  UNIQUE(token, product)
);

CREATE INDEX IF NOT EXISTS idx_licenses_token ON licenses(token);
CREATE INDEX IF NOT EXISTS idx_licenses_product ON licenses(product);
CREATE INDEX IF NOT EXISTS idx_licenses_stripe_customer ON licenses(stripe_customer_id);

CREATE TABLE IF NOT EXISTS discount_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value INTEGER NOT NULL,
  product TEXT,
  stripe_coupon_id TEXT,
  stripe_promo_code_id TEXT,
  used_by_email TEXT,
  used_by_license_id INTEGER REFERENCES licenses(id),
  used_at TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);

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
