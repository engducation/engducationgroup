// Disable các pattern cũ (ngoài DAY/MONTH/YEAR) — soft-delete.
// Chạy 1 lần sau khi đơn giản hóa danh sách pattern.
import "dotenv/config";
import { db } from "@/db";
import { paymentCodePatterns } from "@/db/schema";
import { and, eq, notInArray } from "drizzle-orm";
import { invalidatePatternCache } from "@/features/payment/services/order-code-pattern.service";

async function cleanup() {
  const KEEP = ["DAY", "MONTH", "YEAR"] as const;

  console.log("🧹 Soft-delete các pattern ngoài:", KEEP.join(", "));

  const result = await db
    .update(paymentCodePatterns)
    .set({ isActive: 0 })
    .where(notInArray(paymentCodePatterns.code, KEEP as unknown as string[]))
    .returning({ code: paymentCodePatterns.code });

  if (result.length === 0) {
    console.log("  Không có pattern nào cần dọn.");
  } else {
    for (const r of result) {
      console.log(`  - Deactivated: ${r.code}`);
    }
  }

  invalidatePatternCache();

  // List còn lại
  const remaining = await db
    .select()
    .from(paymentCodePatterns)
    .where(eq(paymentCodePatterns.isActive, 1));
  console.log("\n✅ Active patterns còn lại:");
  for (const r of remaining) {
    console.log(`  ${r.code} (length=${r.randomLength})`);
  }
}

cleanup()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
