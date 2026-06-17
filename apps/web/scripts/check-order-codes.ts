// Check orders cũ để xác định random length thực tế.
import "dotenv/config";
import { db } from "@/db";
import { orders } from "@/db/schema/payment";
import { desc, isNotNull } from "drizzle-orm";

async function check() {
  const rows = await db
    .select({
      id: orders.id,
      orderCode: orders.orderCode,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(isNotNull(orders.orderCode))
    .orderBy(desc(orders.createdAt))
    .limit(50);

  console.log(`📊 Tổng ${rows.length} orders gần nhất:\n`);
  const lengthCounts = new Map<number, number>();
  for (const r of rows) {
    // Tách prefix và random
    const match = r.orderCode.match(/^([A-Z]+)(\d+)$/);
    if (match) {
      const prefix = match[1]!;
      const random = match[2]!;
      const len = random.length;
      lengthCounts.set(len, (lengthCounts.get(len) ?? 0) + 1);
      console.log(
        `  ${r.orderCode.padEnd(20)} | prefix=${prefix.padEnd(8)} | random_len=${len} | ${r.status}`,
      );
    } else {
      console.log(`  ${r.orderCode.padEnd(20)} | (mixed) | ${r.status}`);
    }
  }
  console.log("\n📈 Phân bố random length:");
  for (const [len, count] of [...lengthCounts.entries()].sort()) {
    console.log(`  length=${len}: ${count} orders`);
  }
}

check()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
