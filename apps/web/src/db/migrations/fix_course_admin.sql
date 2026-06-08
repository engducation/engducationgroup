-- ============================================================
-- MANUAL FIX SCRIPT: Run this if migration fails or DB is in broken state
-- Run AFTER checking with diagnostic.sql
-- ============================================================

-- ============================================================
-- FIX 1: Add missing subscription columns to user table
-- Run this if activated_at or expires_at are missing from user
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'user' AND column_name = 'activated_at') THEN
        ALTER TABLE "user" ADD COLUMN "activated_at" timestamp;
        RAISE NOTICE 'Added activated_at to user table';
    ELSE
        RAISE NOTICE 'activated_at already exists in user table';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_name = 'user' AND column_name = 'expires_at') THEN
        ALTER TABLE "user" ADD COLUMN "expires_at" timestamp;
        RAISE NOTICE 'Added expires_at to user table';
    ELSE
        RAISE NOTICE 'expires_at already exists in user table';
    END IF;
END $$;

-- ============================================================
-- FIX 2: Create package_order table if missing
-- Run this if package_order table does not exist
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                  WHERE table_name = 'package_order' AND table_schema = 'public') THEN
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
        RAISE NOTICE 'Created package_order table';

        -- Add FK constraints
        ALTER TABLE "package_order" ADD CONSTRAINT "package_order_user_id_user_id_fk"
            FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade;
        ALTER TABLE "package_order" ADD CONSTRAINT "package_order_admin_id_user_id_fk"
            FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE set null;
        RAISE NOTICE 'Added FK constraints to package_order';
    ELSE
        RAISE NOTICE 'package_order already exists';
    END IF;
END $$;

-- ============================================================
-- FIX 3: Create subscription_audit_log table if missing
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                  WHERE table_name = 'subscription_audit_log' AND table_schema = 'public') THEN
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
        RAISE NOTICE 'Created subscription_audit_log table';
    ELSE
        RAISE NOTICE 'subscription_audit_log already exists';
    END IF;
END $$;

-- ============================================================
-- FIX 4: Add index on user.expires_at if missing
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes
                  WHERE tablename = 'user' AND indexname = 'user_expires_at_idx') THEN
        CREATE INDEX "user_expires_at_idx" ON "user" USING btree ("expires_at");
        RAISE NOTICE 'Created user_expires_at_idx';
    ELSE
        RAISE NOTICE 'user_expires_at_idx already exists';
    END IF;
END $$;

-- ============================================================
-- FIX 5: Drop old tables if they exist
-- ============================================================
DO $$
BEGIN
    DROP TABLE IF EXISTS "course_order";
    RAISE NOTICE 'Dropped course_order if it existed';
    DROP TABLE IF EXISTS "transaction_audit_log";
    RAISE NOTICE 'Dropped transaction_audit_log if it existed';
    DROP TABLE IF EXISTS "user_courses";
    RAISE NOTICE 'Dropped user_courses if it existed';
END $$;

-- ============================================================
-- FIX 6: Remove price columns from course if they still exist
-- Run this if course table still has is_free, original_price, selling_price, access_duration_days
-- WARNING: Only run this if you have migrated the code to NOT use these columns
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course' AND column_name = 'is_free') THEN
        ALTER TABLE "course" DROP COLUMN IF EXISTS "is_free";
        RAISE NOTICE 'Dropped is_free from course';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course' AND column_name = 'original_price') THEN
        ALTER TABLE "course" DROP COLUMN IF EXISTS "original_price";
        RAISE NOTICE 'Dropped original_price from course';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course' AND column_name = 'selling_price') THEN
        ALTER TABLE "course" DROP COLUMN IF EXISTS "selling_price";
        RAISE NOTICE 'Dropped selling_price from course';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course' AND column_name = 'access_duration_days') THEN
        ALTER TABLE "course" DROP COLUMN IF EXISTS "access_duration_days";
        RAISE NOTICE 'Dropped access_duration_days from course';
    END IF;
END $$;
