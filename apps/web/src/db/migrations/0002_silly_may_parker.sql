ALTER TABLE "user_courses" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "user_courses" CASCADE;--> statement-breakpoint
ALTER TABLE "course_order" RENAME TO "package_order";--> statement-breakpoint
ALTER TABLE "transaction_audit_log" RENAME TO "subscription_audit_log";--> statement-breakpoint
ALTER TABLE "package_order" RENAME COLUMN "course_id" TO "package_type";--> statement-breakpoint
ALTER TABLE "subscription_audit_log" RENAME COLUMN "course_id" TO "package_type";--> statement-breakpoint
ALTER TABLE "package_order" DROP CONSTRAINT "course_order_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "package_order" DROP CONSTRAINT "course_order_admin_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "activated_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "package_order" ADD CONSTRAINT "package_order_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_order" ADD CONSTRAINT "package_order_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course" DROP COLUMN "is_free";--> statement-breakpoint
ALTER TABLE "course" DROP COLUMN "original_price";--> statement-breakpoint
ALTER TABLE "course" DROP COLUMN "selling_price";--> statement-breakpoint
ALTER TABLE "course" DROP COLUMN "access_duration_days";