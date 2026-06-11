-- Migration: Create enrollment, transaction_log, and revenue_log tables
-- Created: 2026-06-11

-- ─── 1. Enrollment Table ─────────────────────────────────────────────────────
-- Lưu trữ thông tin đăng ký khóa học của người dùng

CREATE TABLE IF NOT EXISTS enrollment (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL REFERENCES "course"(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS enrollment_user_idx ON enrollment(user_id);
CREATE INDEX IF NOT EXISTS enrollment_course_idx ON enrollment(course_id);
CREATE UNIQUE INDEX IF NOT EXISTS enrollment_unique ON enrollment(user_id, course_id);

-- ─── 2. Transaction Log Table ────────────────────────────────────────────────
-- Lưu trữ lịch sử giao dịch thanh toán của người dùng

CREATE TABLE IF NOT EXISTS transaction_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  transaction_code TEXT NOT NULL UNIQUE,
  package_type VARCHAR(20) NOT NULL,
  amount INTEGER NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'BANK_TRANSFER',
  payment_content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS transaction_log_user_idx ON transaction_log(user_id);
CREATE INDEX IF NOT EXISTS transaction_log_code_idx ON transaction_log(transaction_code);
CREATE INDEX IF NOT EXISTS transaction_log_status_idx ON transaction_log(status);
CREATE INDEX IF NOT EXISTS transaction_log_created_idx ON transaction_log(created_at);

-- ─── 3. Revenue Log Table ────────────────────────────────────────────────────
-- Lưu trữ doanh thu theo ngày để hiển thị trên Dashboard Admin

CREATE TABLE IF NOT EXISTS revenue_log (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'PREMIUM_SUBSCRIPTION',
  amount INTEGER NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'VND',
  transaction_count INTEGER NOT NULL DEFAULT 0,
  package_breakdown JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS revenue_log_date_category_idx ON revenue_log(date, category);
CREATE INDEX IF NOT EXISTS revenue_log_date_idx ON revenue_log(date);

-- ─── 4. Insert initial revenue record ───────────────────────────────────────
-- Tạo bản ghi khởi tạo cho ngày hôm nay nếu chưa có

INSERT INTO revenue_log (id, date, category, amount, transaction_count, package_breakdown)
VALUES (
  gen_random_uuid()::TEXT,
  CURRENT_DATE,
  'PREMIUM_SUBSCRIPTION',
  0,
  0,
  '{"MONTHLY": 0, "6_MONTH": 0, "YEAR": 0}'::JSONB
)
ON CONFLICT (date, category) DO NOTHING;
