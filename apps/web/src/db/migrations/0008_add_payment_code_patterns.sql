CREATE TABLE "payment_code_patterns" (
	"code" varchar(10) PRIMARY KEY NOT NULL,
	"description" text,
	"random_length" integer DEFAULT 8 NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "payment_code_patterns_active_idx" ON "payment_code_patterns" USING btree ("is_active");