-- ============================================================
-- FIX SCRIPT: Run this BEFORE drizzle-kit push
-- This fixes existing NULL values in subscription_plan column
-- so Drizzle can apply the NOT NULL constraint
-- ============================================================
-- How to run:
--   Option 1: Paste this in Neon SQL Editor (https://neon.tech)
--   Option 2: psql $DATABASE_URL -f fix_subscription_plan.sql
-- ============================================================

-- Fix 1: Set all NULL values to "FREE"
UPDATE "user" SET "subscription_plan" = 'FREE' WHERE "subscription_plan" IS NULL;
RAISE NOTICE 'Updated all NULL subscription_plan values to FREE';

-- Fix 2: Set default and NOT NULL constraint
ALTER TABLE "user" ALTER COLUMN "subscription_plan" SET DEFAULT 'FREE';
ALTER TABLE "user" ALTER COLUMN "subscription_plan" SET NOT NULL;
RAISE NOTICE 'Set subscription_plan to NOT NULL with default FREE';

-- Fix 3: Add CHECK constraint for valid package types (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'user_subscription_plan_check'
    ) THEN
        ALTER TABLE "user" ADD CONSTRAINT "user_subscription_plan_check"
            CHECK ("subscription_plan" IN ('FREE', 'MONTHLY', '6_MONTH', 'YEAR'));
        RAISE NOTICE 'Added subscription_plan CHECK constraint';
    ELSE
        RAISE NOTICE 'subscription_plan CHECK constraint already exists';
    END IF;
END $$;

-- Fix 4: Ensure role has default "user" and is NOT NULL (idempotent)
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user';
ALTER TABLE "user" ALTER COLUMN "role" SET NOT NULL;
RAISE NOTICE 'Set role to NOT NULL with default user';

-- Fix 5: Ensure emailVerified defaults to true for existing rows
UPDATE "user" SET "email_verified" = true WHERE "email_verified" IS NULL;
ALTER TABLE "user" ALTER COLUMN "email_verified" SET DEFAULT true;
ALTER TABLE "user" ALTER COLUMN "email_verified" SET NOT NULL;
RAISE NOTICE 'Set email_verified to NOT NULL with default true';

-- Fix 6: Create index on subscription_plan (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'user' AND indexname = 'user_subscription_plan_idx'
    ) THEN
        CREATE INDEX "user_subscription_plan_idx" ON "user" USING btree ("subscription_plan");
        RAISE NOTICE 'Created user_subscription_plan_idx';
    ELSE
        RAISE NOTICE 'user_subscription_plan_idx already exists';
    END IF;
END $$;

-- Fix 7: Create index on expires_at (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'user' AND indexname = 'user_expires_at_idx'
    ) THEN
        CREATE INDEX "user_expires_at_idx" ON "user" USING btree ("expires_at");
        RAISE NOTICE 'Created user_expires_at_idx';
    ELSE
        RAISE NOTICE 'user_expires_at_idx already exists';
    END IF;
END $$;

RAISE NOTICE 'All subscription_plan fixes applied successfully!';
