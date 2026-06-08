-- ============================================================
-- DIAGNOSTIC SCRIPT: Run this first to check DB state
-- ============================================================
-- This script is READ-ONLY (SELECT only) — safe to run anytime.

-- 1. Check if user table has subscription columns
SELECT 'user table columns' AS check_name,
       column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if course table has price columns (should NOT exist after migration)
SELECT 'course table columns' AS check_name,
       column_name, data_type
FROM information_schema.columns
WHERE table_name = 'course'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check which order/subscription tables exist
SELECT 'order-related tables' AS check_name,
       table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name IN ('course_order', 'package_order',
                   'transaction_audit_log', 'subscription_audit_log',
                   'user_courses')
  )
ORDER BY table_name;

-- 4. Check if package_order has the right columns
SELECT 'package_order columns' AS check_name,
       column_name, data_type
FROM information_schema.columns
WHERE table_name = 'package_order'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Check indexes on user.expires_at
SELECT 'user indexes' AS check_name,
       indexname, indexdef
FROM pg_indexes
WHERE tablename = 'user'
  AND schemaname = 'public';
