-- Seed default patterns vào bảng đã tạo bởi migration 0008.
-- Nếu DB mới chạy 0008 → data đã có sẵn (ON CONFLICT DO NOTHING).
-- Nếu DB cũ đã chạy 0008 mà chưa seed → sẽ được seed bởi migration này.
-- Mapping với packageType trong vietqr.service.ts:
--   MONTHLY → DAY, 6_MONTH → MONTH, YEAR → YEAR
INSERT INTO "payment_code_patterns" ("code", "description", "random_length", "is_active")
VALUES
	('DAY',   'Mã cho các gói theo ngày (DAY prefix)',   8, 1),
	('MONTH', 'Mã cho các gói theo tháng (MONTH prefix)', 8, 1),
	('YEAR',  'Mã cho các gói theo năm (YEAR prefix)',   8, 1)
ON CONFLICT ("code") DO NOTHING;
