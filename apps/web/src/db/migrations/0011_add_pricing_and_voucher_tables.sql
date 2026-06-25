-- Migration: Add pricing and voucher tables for dynamic pricing management
-- Problem: Admin needs to customize package prices and create discount vouchers
-- Solution: Add package_pricing, voucher, and voucher_usage tables

-- =====================================================
-- 1. Package Pricing Table
-- =====================================================
-- Allows admin to override default prices for packages

CREATE TABLE package_pricing (
  package_type VARCHAR(20) PRIMARY KEY,
  current_price INTEGER NOT NULL,
  base_price INTEGER NOT NULL,
  discount_percent INTEGER DEFAULT 0 NOT NULL,
  custom_label VARCHAR(100),
  custom_description TEXT,
  is_enabled INTEGER DEFAULT 1 NOT NULL,
  discount_starts_at TIMESTAMP,
  discount_ends_at TIMESTAMP,
  admin_note TEXT,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS package_pricing_enabled_idx ON package_pricing(is_enabled);

COMMENT ON TABLE package_pricing IS 'Admin-configurable pricing overrides for subscription packages';
COMMENT ON COLUMN package_pricing.discount_percent IS 'Percentage discount (0-100), applied to base_price to calculate current_price';
COMMENT ON COLUMN package_pricing.is_enabled IS '1 = package visible, 0 = hidden from UI';

-- =====================================================
-- 2. Voucher Table
-- =====================================================
-- Stores discount codes that users can apply at checkout

CREATE TABLE voucher (
  id TEXT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('PERCENTAGE', 'FIXED')),
  value INTEGER NOT NULL,
  max_discount INTEGER,
  max_usage INTEGER,
  used_count INTEGER DEFAULT 0 NOT NULL,
  min_order_amount INTEGER DEFAULT 0 NOT NULL,
  applicable_packages TEXT,
  is_active INTEGER DEFAULT 1 NOT NULL,
  starts_at TIMESTAMP,
  expires_at TIMESTAMP,
  description TEXT,
  admin_note TEXT,
  created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS voucher_code_idx ON voucher(code);
CREATE INDEX IF NOT EXISTS voucher_active_idx ON voucher(is_active);
CREATE INDEX IF NOT EXISTS voucher_expires_idx ON voucher(expires_at);

COMMENT ON TABLE voucher IS 'Discount codes that users can apply during checkout';
COMMENT ON COLUMN voucher.code IS 'Unique voucher code (auto-uppercased), e.g. SUMMER2025';
COMMENT ON COLUMN voucher.type IS 'PERCENTAGE = percentage off, FIXED = fixed amount off (VND)';
COMMENT ON COLUMN voucher.value IS 'Discount value: percentage (1-100) or fixed amount in VND';
COMMENT ON COLUMN voucher.max_discount IS 'Maximum discount amount for PERCENTAGE type vouchers';
COMMENT ON COLUMN voucher.applicable_packages IS 'JSON array of package types this voucher applies to, null = all packages';

-- =====================================================
-- 3. Voucher Usage Log Table
-- =====================================================
-- Tracks voucher usage for auditing and preventing reuse

CREATE TABLE voucher_usage (
  id TEXT PRIMARY KEY,
  voucher_id TEXT NOT NULL REFERENCES voucher(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  order_id TEXT,
  discount_amount INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS voucher_usage_voucher_idx ON voucher_usage(voucher_id);
CREATE INDEX IF NOT EXISTS voucher_usage_user_idx ON voucher_usage(user_id);
CREATE INDEX IF NOT EXISTS voucher_usage_order_idx ON voucher_usage(order_id);

COMMENT ON TABLE voucher_usage IS 'Audit log of voucher redemptions';
COMMENT ON COLUMN voucher_usage.discount_amount IS 'Actual amount discounted at time of use';
