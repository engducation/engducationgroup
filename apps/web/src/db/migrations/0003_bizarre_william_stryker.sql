ALTER TABLE "user" ALTER COLUMN "email_verified" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user';--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';--> statement-breakpoint
UPDATE "user" SET "subscription_plan" = 'FREE' WHERE "subscription_plan" IS NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_plan" text DEFAULT 'FREE' NOT NULL;