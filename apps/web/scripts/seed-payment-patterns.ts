import "dotenv/config";
import { sql } from "drizzle-orm";
import { paymentCodePatterns } from "@/db/schema";
import { db } from "@/db";
import { asc } from "drizzle-orm";
import { randomInt } from "node:crypto";

/**
 * Seed các payment_code_patterns mặc định.
 *
 * Phải khớp với những gì đã được khai báo trong SePay dashboard
 * (my.sepay.vn → Cài đặt → Mã thanh toán). Mỗi dòng trong dashboard phải
 * có 1 record tương ứng ở đây.
 *
 * Idempotent: chạy nhiều lần OK, không tạo duplicate.
 */

const DEFAULT_PATTERNS = [
  {
    code: "DAY",
    description: "Mã cho gói 1 Tháng (49k) — DAY + 7 số",
    randomLength: 7,
  },
  {
    code: "MONTH",
    description: "Mã cho gói 6 Tháng (249k) — MONTH + 7 số",
    randomLength: 7,
  },
  {
    code: "YEAR",
    description: "Mã cho gói 1 Năm (499k) — YEAR + 7 số",
    randomLength: 7,
  },
];

async function seed() {
  console.log("🌱 Seeding payment_code_patterns...");

  // 1. Đảm bảo bảng đã tồn tại (chạy SQL raw qua drizzle-orm `sql` tag)
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "payment_code_patterns" (
        "code" varchar(10) PRIMARY KEY NOT NULL,
        "description" text,
        "random_length" integer DEFAULT 8 NOT NULL,
        "is_active" integer DEFAULT 1 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "payment_code_patterns_active_idx"
        ON "payment_code_patterns" USING btree ("is_active")
    `);
    console.log("✅ Table ensured");
  } catch (err) {
    console.error("❌ Failed to ensure table:", err);
    process.exit(1);
  }

  // 2. Insert từng pattern (ON CONFLICT DO NOTHING → idempotent)
  let inserted = 0;
  let skipped = 0;
  for (const p of DEFAULT_PATTERNS) {
    try {
      const result = await db
        .insert(paymentCodePatterns)
        .values({
          code: p.code,
          description: p.description,
          randomLength: p.randomLength,
          isActive: 1,
        })
        .onConflictDoNothing()
        .returning();
      if (result.length > 0) {
        inserted++;
        console.log(`  + Inserted: ${p.code}`);
      } else {
        skipped++;
        console.log(`  = Skipped (exists): ${p.code}`);
      }
    } catch (err) {
      console.error(`  ❌ Failed: ${p.code}`, err);
    }
  }

  // 3. Verify
  const all = await db
    .select()
    .from(paymentCodePatterns)
    .orderBy(asc(paymentCodePatterns.code));
  console.log("\n📊 Current patterns in DB:");
  for (const p of all) {
    const status = p.isActive === 1 ? "✅ active" : "❌ inactive";
    console.log(
      `  ${p.code.padEnd(10)} | ${status} | length=${p.randomLength} | ${p.description ?? ""}`,
    );
  }

  console.log(
    `\n✨ Done. Inserted: ${inserted}, Skipped: ${skipped}, Total: ${all.length}`,
  );

  // 4. Test generate
  const active = all.filter((p) => p.isActive === 1);
  if (active.length > 0) {
    const sample = active[Math.floor(Math.random() * active.length)]!;
    const min = 10 ** (sample.randomLength - 1);
    const max = 10 ** sample.randomLength;
    const random = String(randomInt(min, max));
    const code = `${sample.code}${random}`;
    console.log(`\n🧪 Sample orderCode: ${code}`);
  }
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("💥 Fatal error:", err);
    process.exit(1);
  });
