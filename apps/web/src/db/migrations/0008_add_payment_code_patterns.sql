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
--> statement-breakpoint
-- Seed default patterns. Mapping với packageType trong vietqr.service.ts:
--   MONTHLY → DAY, 6_MONTH → MONTH, YEAR → YEAR
-- Phải khớp với Mã thanh toán đã khai báo trong SePay dashboard.
INSERT INTO "payment_code_patterns" ("code", "description", "random_length", "is_active")
VALUES
	('DAY',   'Mã cho các gói theo ngày (DAY prefix)',  8, 1),
	('MONTH', 'Mã cho các gói theo tháng (MONTH prefix)', 8, 1),
	('YEAR',  'Mã cho các gói theo năm (YEAR prefix)', 8, 1)
ON CONFLICT ("code") DO NOTHING;