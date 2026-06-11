-- Migration: 0003_add_subscription_plan
-- Description: Add subscription_plan column to user table to track active package type
--   - "FREE" = free account (no course access, default)
--   - "MONTHLY" | "6_MONTH" | "YEAR" = premium (access to all courses)
-- Changes:
--   1. Add subscription_plan column (varchar, default "FREE", NOT NULL)
--   2. Add index on subscription_plan for quick lookups
--   3. Add CHECK constraint for valid package types
--   4. Create index on expires_at if missing
-- THIS MIGRATION IS IDEMPOTENT — safe to re-run if interrupted or partially applied.

DO $$
BEGIN
    -- Step 1: Add subscription_plan column with default "FREE" (idempotent)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user' AND column_name = 'subscription_plan'
    ) THEN
        ALTER TABLE "user" ADD COLUMN "subscription_plan" varchar(20) DEFAULT 'FREE' NOT NULL;
        RAISE NOTICE 'Added subscription_plan column to user table with default FREE';
    ELSE
        RAISE NOTICE 'subscription_plan column already exists in user table';
    END IF;

    -- Step 1b: Set NULL values to "FREE" for existing rows (idempotent)
    UPDATE "user" SET "subscription_plan" = 'FREE' WHERE "subscription_plan" IS NULL;
    ALTER TABLE "user" ALTER COLUMN "subscription_plan" SET DEFAULT 'FREE';
    ALTER TABLE "user" ALTER COLUMN "subscription_plan" SET NOT NULL;

    -- Step 2: Add index on subscription_plan for quick subscription checks (idempotent)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'user' AND indexname = 'user_subscription_plan_idx'
    ) THEN
        CREATE INDEX "user_subscription_plan_idx" ON "user" USING btree ("subscription_plan");
        RAISE NOTICE 'Created user_subscription_plan_idx';
    ELSE
        RAISE NOTICE 'user_subscription_plan_idx already exists';
    END IF;

    -- Step 3: Add CHECK constraint for valid package types (idempotent)
    -- Only allow valid package types: "FREE", "MONTHLY", "6_MONTH", "YEAR"
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

-- Step 4: Create index on expires_at if missing (idempotent)
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
