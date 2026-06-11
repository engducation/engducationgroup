CREATE TABLE "enrollment" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revenue_log" (
	"id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"category" varchar(50) DEFAULT 'PREMIUM_SUBSCRIPTION' NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"currency" varchar(10) DEFAULT 'VND' NOT NULL,
	"transaction_count" integer DEFAULT 0 NOT NULL,
	"package_breakdown" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_log" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"transaction_code" varchar(50) NOT NULL,
	"package_type" varchar(20) NOT NULL,
	"amount" integer NOT NULL,
	"payment_method" varchar(50) DEFAULT 'BANK_TRANSFER' NOT NULL,
	"payment_content" text NOT NULL,
	"status" varchar(20) DEFAULT 'COMPLETED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transaction_log_transaction_code_unique" UNIQUE("transaction_code")
);
--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_log" ADD CONSTRAINT "transaction_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "enrollment_user_idx" ON "enrollment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "enrollment_course_idx" ON "enrollment" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "enrollment_unique" ON "enrollment" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "revenue_log_date_category_idx" ON "revenue_log" USING btree ("date","category");--> statement-breakpoint
CREATE INDEX "revenue_log_date_idx" ON "revenue_log" USING btree ("date");--> statement-breakpoint
CREATE INDEX "transaction_log_user_idx" ON "transaction_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transaction_log_code_idx" ON "transaction_log" USING btree ("transaction_code");--> statement-breakpoint
CREATE INDEX "transaction_log_status_idx" ON "transaction_log" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transaction_log_created_idx" ON "transaction_log" USING btree ("created_at");