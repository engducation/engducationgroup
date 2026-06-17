import { db } from "@/db";
import { paymentCodePatterns } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { randomInt } from "node:crypto";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PaymentCodePattern {
  code: string;
  description: string | null;
  randomLength: number;
  isActive: boolean;
}

export interface GenerateOrderCodeOptions {
  /**
   * Nếu truyền → chỉ generate theo pattern này.
   * Nếu không truyền → random chọn 1 trong các pattern active.
   */
  preferredCode?: string;
}

// ─── In-memory cache ─────────────────────────────────────────────────────────
// Pattern ít khi thay đổi, polling webhook liên tục → cache ở module scope
// để tránh query DB mỗi lần parse content. TTL 60s là đủ cho admin CRUD.

const CACHE_TTL_MS = 60_000;

let cache: { at: number; items: PaymentCodePattern[] } | null = null;

async function loadActivePatternsFromDb(): Promise<PaymentCodePattern[]> {
  const rows = await db
    .select()
    .from(paymentCodePatterns)
    .where(eq(paymentCodePatterns.isActive, 1))
    .orderBy(asc(paymentCodePatterns.code));

  return rows.map((r) => ({
    code: r.code,
    description: r.description,
    randomLength: r.randomLength,
    isActive: r.isActive === 1,
  }));
}

/**
 * Lấy danh sách pattern active (cached 60s). Pattern này được dùng cho CẢ
 * generate orderCode (phía student UI) VÀ parse orderCode từ content CK
 * (phía webhook SePay) — đảm bảo 2 phía luôn đồng bộ.
 */
export async function getActivePatterns(): Promise<PaymentCodePattern[]> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) {
    return cache.items;
  }
  const items = await loadActivePatternsFromDb();
  cache = { at: now, items };
  return items;
}

/** Invalidate cache — gọi sau khi admin CRUD pattern. */
export function invalidatePatternCache(): void {
  cache = null;
}

// ─── Validation ──────────────────────────────────────────────────────────────

const CODE_REGEX = /^[A-Z0-9]{3,10}$/;

/**
 * Validate format prefix: chỉ chữ in hoa + số, 3-10 ký tự. Phải khớp với
 * những gì SePay dashboard cho phép nhập ở field "Mã thanh toán".
 */
export function isValidPatternCode(code: string): boolean {
  return CODE_REGEX.test(code.toUpperCase());
}

// ─── Generate ────────────────────────────────────────────────────────────────

/**
 * Sinh orderCode mới theo 1 trong các pattern active.
 *
 * Ví dụ: với pattern { code: "ENGPRM", randomLength: 8 } → "ENGPRMAB12CD34".
 *        với pattern { code: "DAY", randomLength: 6 }    → "DAY3K9P2M".
 *
 * Nếu `preferredCode` được truyền → ép buộc dùng pattern đó (còn active).
 * Nếu không có pattern active nào → throw error (DB chưa seed).
 */
export async function generateOrderCode(
  options: GenerateOrderCodeOptions = {},
): Promise<string> {
  const patterns = await getActivePatterns();
  if (patterns.length === 0) {
    throw new Error(
      "No active payment code patterns. Seed at least one row in payment_code_patterns.",
    );
  }

  let pattern: PaymentCodePattern | undefined;
  if (options.preferredCode) {
    const wanted = options.preferredCode.toUpperCase();
    pattern = patterns.find((p) => p.code === wanted);
    if (!pattern) {
      throw new Error(`Pattern "${wanted}" not found or inactive.`);
    }
  } else {
    // Pick ngẫu nhiên để phân tán orderCode (tránh 1 pattern bị spam).
    pattern = patterns[Math.floor(Math.random() * patterns.length)]!;
  }

  return buildOrderCodeFromPattern(pattern);
}

/**
 * Build cụ thể từ 1 pattern (sync, không query DB). Hàm này dùng trong hot path
 * (seed / migration / test) khi đã có sẵn pattern object.
 *
 * Phần random là **số nguyên** dài `randomLength` (6-10 chữ số) — khớp với
 * mã thanh toán đã khai báo trong SePay dashboard. Dùng `crypto.randomInt`
 * để đảm bảo cryptographic randomness, tránh sinh trùng giữa các request
 * đồng thời. Số bắt đầu từ 1 (không có leading zero) để dễ đọc trên
 * biên lai ngân hàng.
 */
export function buildOrderCodeFromPattern(pattern: PaymentCodePattern): string {
  const { code, randomLength } = pattern;
  const min = 10 ** (randomLength - 1); // 10^(n-1) → đảm bảo đủ n chữ số
  const max = 10 ** randomLength;       // 10^n
  const random = String(randomInt(min, max));
  return `${code}${random}`;
}

// ─── Parse (regex theo pattern table) ────────────────────────────────────────

/**
 * Trích xuất orderCode từ nội dung CK, dựa trên các pattern hiện có trong DB.
 *
 * SePay hay gửi content dạng:
 *   "ENGPRMAB12CD34 thanh toan don hang"
 *   "DAY3K9P2M NH"
 *   "MONTH XYZ VIP"
 *
 * → Hàm này tìm pattern active đầu tiên xuất hiện trong content, kèm theo
 *   phần random phía sau. Trả về dạng UPPERCASE đầy đủ.
 *
 * Trả về `null` nếu không match pattern nào (SePay có thể vẫn gửi webhook cho
 * giao dịch không match → caller sẽ log + return "order_not_found").
 */
export async function parseOrderCodeFromContent(
  content: string | null | undefined,
): Promise<string | null> {
  if (!content) return null;
  const patterns = await getActivePatterns();
  if (patterns.length === 0) return null;

  const upper = content.toUpperCase();
  for (const p of patterns) {
    // Tìm prefix, sau đó lấy `randomLength` ký tự tiếp theo (chỉ A-Z0-9).
    const idx = upper.indexOf(p.code);
    if (idx < 0) continue;

    // Phải nằm ở đầu content HOẶC sau 1 ký tự phân cách (space, ký tự đặc biệt)
    // → tránh match nhầm "P" trong "PROMO" khi pattern = "M".
    if (idx > 0 && /[A-Z0-9]/.test(upper.charAt(idx - 1))) {
      continue;
    }

    const tail = upper.slice(idx + p.code.length);
    // Lấy đúng randomLength chữ số (0-9) đầu tiên. KHÔNG chấp nhận chữ cái
    // vì phần random giờ là số nguyên (xem buildOrderCodeFromPattern).
    const randomMatch = tail.match(/^[0-9]+/);
    if (!randomMatch) continue;
    const random = randomMatch[0].slice(0, p.randomLength);
    if (random.length !== p.randomLength) continue;

    return `${p.code}${random}`;
  }
  return null;
}

/**
 * Xây regex dạng string để debug / log. Không dùng cho match runtime vì
 * các pattern cần check word-boundary-style (xem parseOrderCodeFromContent).
 */
export function patternsToRegExpSource(patterns: PaymentCodePattern[]): string {
  return patterns
    .map((p) => `${p.code}[0-9]{${p.randomLength}}`)
    .join("|");
}
