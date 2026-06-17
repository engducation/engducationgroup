// Test nhanh parser + generator. Chạy: pnpm tsx scripts/test-patterns.ts
import "dotenv/config";
import {
  generateOrderCode,
  parseOrderCodeFromContent,
} from "@/features/payment/services/order-code-pattern.service";

async function test() {
  const tests = [
    "DAY12345678 thanh toan",        // 8 số
    "DAY123456",                       // 6 số (nếu length=6)
    "MONTH12345678 NH Premium",
    "YEAR1234567890",                  // 10 số
    "PROMO DAY12345678",              // P bị block bởi word-boundary
    "INVALID_CODE",
    "DAY12345",                        // 5 số (quá ngắn nếu length=8)
    "DAYABC12345",                     // có chữ → fail
  ];

  console.log("🧪 Test parseOrderCodeFromContent:");
  for (const input of tests) {
    const out = await parseOrderCodeFromContent(input);
    console.log(`  "${input}" → ${out ?? "(no match)"}`);
  }

  console.log("\n🧪 Test generateOrderCode (5 lần):");
  for (let i = 0; i < 5; i++) {
    console.log(`  → ${await generateOrderCode()}`);
  }
}

test()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
