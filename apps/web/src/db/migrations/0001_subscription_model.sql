-- Migration: 0001_subscription_model
-- Description: Migrate from pay-per-course model to subscription (membership package) model
-- THIS MIGRATION IS IDEMPOTENT — safe to re-run if interrupted or partially applied.
-- Changes:
--   1. Add activated_at and expires_at columns to user table (subscription dates)
--   2. Remove price fields from course table (is_free, original_price, selling_price, access_duration_days)
--   3. Drop user_courses table (replaced by user subscription dates)
--   4. Create package_order table (replaces course_order) if not exists
--   5. Create subscription_audit_log table (replaces transaction_audit_log) if not exists
--   6. Drop old course_order and transaction_audit_log tables if they exist

DO $$
BEGIN
    -- Step 1: Add subscription date columns to user table (idempotent)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'activated_at') THEN
        ALTER TABLE "user" ADD COLUMN "activated_at" timestamp;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'expires_at') THEN
        ALTER TABLE "user" ADD COLUMN "expires_at" timestamp;
    END IF;

    -- Step 2: Remove price fields from course table (idempotent)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course' AND column_name = 'is_free') THEN
        ALTER TABLE "course" DROP COLUMN IF EXISTS "is_free";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course' AND column_name = 'original_price') THEN
        ALTER TABLE "course" DROP COLUMN IF EXISTS "original_price";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course' AND column_name = 'selling_price') THEN
        ALTER TABLE "course" DROP COLUMN IF EXISTS "selling_price";
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course' AND column_name = 'access_duration_days') THEN
        ALTER TABLE "course" DROP COLUMN IF EXISTS "access_duration_days";
    END IF;

    -- Step 3: Drop user_courses table if it exists
    DROP TABLE IF EXISTS "user_courses";

    -- Step 4: Create package_order table if not exists (idempotent)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'package_order') THEN
        CREATE TABLE "package_order" (
            "id" text PRIMARY KEY NOT NULL,
            "user_id" text NOT NULL,
            "package_type" varchar(20) NOT NULL,
            "amount" integer NOT NULL,
            "status" varchar(20) DEFAULT 'PENDING' NOT NULL,
            "payment_method" varchar(50) NOT NULL,
            "rejection_reason" text,
            "admin_id" text,
            "created_at" timestamp DEFAULT now() NOT NULL,
            "updated_at" timestamp DEFAULT now() NOT NULL
        );

        -- Add FK constraints
        ALTER TABLE "package_order" ADD CONSTRAINT "package_order_user_id_user_id_fk"
            FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;

        ALTER TABLE "package_order" ADD CONSTRAINT "package_order_admin_id_user_id_fk"
            FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
    END IF;

    -- Step 5: Create subscription_audit_log table if not exists (idempotent)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_audit_log') THEN
        CREATE TABLE "subscription_audit_log" (
            "id" text PRIMARY KEY NOT NULL,
            "order_id" text NOT NULL,
            "user_id" text NOT NULL,
            "package_type" varchar(20) NOT NULL,
            "amount" integer NOT NULL,
            "old_status" varchar(20) NOT NULL,
            "new_status" varchar(20) NOT NULL,
            "payment_method" varchar(50) NOT NULL,
            "admin_id" text,
            "created_at" timestamp DEFAULT now() NOT NULL
        );
    END IF;

    -- Step 6: Drop old tables if they exist
    DROP TABLE IF EXISTS "course_order";
    DROP TABLE IF EXISTS "transaction_audit_log";

    -- Step 7: Add index on user.expires_at for quick subscription checks
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'user' AND indexname = 'user_expires_at_idx') THEN
        CREATE INDEX "user_expires_at_idx" ON "user" USING btree ("expires_at");
    END IF;

END $$;
