-- Migration: Add paymentMemo column for reliable webhook identification
-- Problem: orderCode gets truncated by bank (max 25 chars limit in VietQR content).
-- Solution: Use a short unique paymentMemo (16 chars) embedded in QR content.
-- Lookup happens via orderId (PK), not orderCode.

-- Step 1: Add the column (nullable first for safety)
ALTER TABLE orders
ADD COLUMN payment_memo VARCHAR(20) UNIQUE;

-- Step 2: Backfill existing orders with generated paymentMemo
-- Format: EP_ + 12 random alphanumeric chars
UPDATE orders
SET payment_memo = 'EP_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)
WHERE payment_memo IS NULL;

-- Step 3: Set NOT NULL constraint after all rows have values
ALTER TABLE orders
ALTER COLUMN payment_memo SET NOT NULL;

-- Step 4: Add index for fast webhook lookup
CREATE INDEX IF NOT EXISTS orders_payment_memo_idx ON orders(payment_memo);

-- Step 5: Add orderId index to sepay_transactions for fast joins
CREATE INDEX IF NOT EXISTS sepay_tx_order_id_idx ON sepay_transactions(order_id);
