import { timingSafeEqual } from "node:crypto";
import { db } from "@/db";
import { env } from "@/env";
import {
  orders,
  sepayTransactions,
  type OrderStatus,
  type PackageType,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  sepayWebhookPayloadSchema,
  type SepayWebhookPayload,
  type WebhookProcessResult,
} from "../types/schemas";
import {
  getOrderByCode,
  getOrderForWebhook,
  isSepayTransactionProcessed,
  markOrderExpiredIfDue,
} from "./order.service";
import { grantSubscriptionInTx, type DbTx } from "./subscription.service";
import { parsePaymentMemo } from "../utils/payment-memo.utils";

// ─── Authentication: IP Whitelist + API Key ──────────────────────────────────
//
// Theo docs SePay chính thức (developer.sepay.vn/vi/dia-chi-ip), SePay khuyến nghị
// kết hợp IP whitelist + API Key để có 2 lớp bảo mật.
//   - IP whitelist: chặn request không phải từ SePay (defense in depth).
//   - API Key: chặn trường hợp SePay đổi IP trong tương lai.
//
// Qua proxy (ngrok, Vercel, Cloudflare, Nginx...), IP thật của SePay chỉ có
// trong header `x-forwarded-for` do proxy thêm vào. Không bao giờ đọc
// `request.ip` trực tiếp vì sẽ trả về IP của proxy edge.

// Danh sách IP chính thức từ SePay docs (developer.sepay.vn/vi/dia-chi-ip).
// Bao gồm cả IPv4 + IPv6. So sánh exact match (Set lookup O(1)).
const SEPAY_IPS: ReadonlySet<string> = new Set([
  // IPv4 — các IP lẻ không thuộc subnet rotate
  "172.236.138.20",
  "172.233.83.68",
  "171.244.35.2",
  "151.158.108.68",
  "151.158.109.79",
  "103.255.238.139",
  // IPv6
  "2400:8905::2000:8cff:fe98:45cd",
  "2600:3c15::2000:8aff:fedd:874b",
]);

// IPv4 CIDR ranges — dải SePay dùng để rotate webhook.
// Logs thật từ production cho thấy 103.255.238.0/24 xuất hiện nhiều IP khác nhau
// (.96, .97, .98... không chỉ .139 như docs công bố). Khi SePay công bố subnet
// mới, append vào đây. Cập nhật tại https://developer.sepay.vn/vi/dia-chi-ip.
const SEPAY_IPV4_CIDRS: readonly string[] = [
  "103.255.238.0/24",
];

/**
 * Convert IPv4 string (vd: "103.255.238.96") thành 32-bit number.
 * Trả về null nếu không phải IPv4 hợp lệ (IPv6 dùng exact match ở Set).
 */
function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let result = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null;
    const n = Number(part);
    if (n < 0 || n > 255) return null;
    result = (result << 8) + n;
  }
  return result >>> 0;
}

/**
 * Check IPv4 có nằm trong CIDR (vd: "103.255.238.0/24") hay không.
 * Hỗ trợ /0 → /32. Không hỗ trợ IPv6 (CIDR khác format).
 */
function ipv4MatchesCidr(ip: string, cidr: string): boolean {
  const [base, prefixStr] = cidr.split("/");
  const prefix = Number(prefixStr);
  if (!base || Number.isNaN(prefix) || prefix < 0 || prefix > 32) return false;
  const ipInt = ipv4ToInt(ip);
  const baseInt = ipv4ToInt(base);
  if (ipInt === null || baseInt === null) return false;
  if (prefix === 0) return true;
  // Mask giữ lại `prefix` bit cao, so sánh phần còn lại phải = 0.
  const mask = (~((1 << (32 - prefix)) - 1)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

/**
 * Lấy IP thật của caller, ưu tiên `x-forwarded-for` (vì qua proxy/CDN/ngrok).
 *
 * Chain:
 *   1. `x-forwarded-for` (phần tử đầu = IP gốc của client, split comma + trim)
 *   2. `x-real-ip` (Nginx style)
 *
 * Lưu ý: nhiều proxy gửi IPv4 dưới dạng IPv6 mapped (`::ffff:172.236.138.20`)
 * — Node/Next.js có thể tự normalize, nhưng qua 2 lớp proxy thì header có thể
 * giữ nguyên prefix. Hàm này strip prefix để so khớp với `SEPAY_IPS`.
 *
 * KHÔNG dùng `request.ip` vì qua proxy sẽ trả IP proxy edge.
 */
export function getClientIpFromHeaders(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");

  if (forwardedFor) {
    // Lấy IP đầu tiên trong chuỗi (IP gốc) và trim khoảng trắng.
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      // Strip IPv6 mapped IPv4 prefix (vd: "::ffff:172.236.138.20" → "172.236.138.20")
      if (firstIp.startsWith("::ffff:")) {
        return firstIp.replace("::ffff:", "");
      }
      return firstIp;
    }
  }

  const realIp = headers.get("x-real-ip");
  return realIp ? realIp.trim() : "";
}

/**
 * Check IP có thuộc whitelist SePay không.
 * - IPv4: exact match Set HOẶC nằm trong bất kỳ CIDR range nào ở `SEPAY_IPV4_CIDRS`.
 * - IPv6: chỉ exact match ở Set (CIDR IPv6 không dùng ở đây).
 */
export function isSepayIp(ip: string): boolean {
  if (!ip) return false;
  if (SEPAY_IPS.has(ip)) return true;
  // CIDR ranges chỉ áp dụng cho IPv4 (chứa dấu `.`, không có `:`).
  if (ip.includes(":")) return false;
  return SEPAY_IPV4_CIDRS.some((cidr) => ipv4MatchesCidr(ip, cidr));
}

// ─── API Key Authentication ───────────────────────────────────────────────
//
// Theo docs developer.sepay.vn/vi/xac-thuc, SePay gửi header `Authorization: Apikey <key>`.

export function getApiKeyFromHeaders(headers: Headers): string | null {
  const auth = headers.get("authorization");
  if (auth) {
    const match = auth.match(/^Apikey\s+(.+)$/i);
    if (match) return match[1]!;
  }
  return null;
}

export function verifyApiKey(providedKey: string | null): boolean {
  if (!providedKey || !env.SEPAY_API_KEY) return false;
  const a = Buffer.from(env.SEPAY_API_KEY);
  const b = Buffer.from(providedKey);
  // timingSafeEqual yêu cầu cùng byte length, nếu khác → fail an toàn (tránh throw).
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// ─── Payload Parsing ────────────────────────────────────────────────────────

export function parseSepayPayload(rawBody: string): {
  ok: true;
  payload: SepayWebhookPayload;
} | {
  ok: false;
  error: string;
} {
  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Invalid JSON" };
  }
  const result = sepayWebhookPayloadSchema.safeParse(json);
  if (!result.success) {
    return { ok: false, error: result.error.message };
  }
  return { ok: true, payload: result.data };
}

function parseTransactionDate(value: string): Date | null {
  const isoLike = value.includes("T") ? value : value.replace(" ", "T");
  const d = new Date(isoLike);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ─── Shared Core: settle order in transaction ────────────────────────────────
//
// Dùng cho cả 2 luồng:
//   - Webhook SePay: processSepayWebhook() gọi hàm này.
//   - Admin manual approve: tạo synthetic payload rồi gọi hàm này.
//
// Tại sao tách riêng: vì business rule "granted sub + insert tx record + update order"
// là GIỐNG NHAU 100% giữa 2 luồng — chỉ khác nguồn payload.

export interface SettleOrderInput {
  orderId: string;
  payload: SepayWebhookPayload;
  /** Dùng cho admin manual approve. Khi set → không còn auto-grant ngầm. */
  adminId?: string | null;
  /** Nếu true (manual approve) → thay đổi Sepay transaction id để không collide webhook. */
  manualSepayId?: string;
}

/**
 * Settlement atomic: grant subscription + update order + insert transaction record.
 * Phải được gọi trong `db.transaction()`.
 */
export async function settleOrderInDb(
  input: SettleOrderInput,
): Promise<{ orderId: string; newExpiresAt: Date }> {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, input.orderId))
    .limit(1);
  if (!order) throw new Error("Order not found");
  if (order.status === ("SUCCESS" as OrderStatus)) {
    throw new Error("Order already settled");
  }
  if (order.status !== ("PENDING" as OrderStatus)) {
    throw new Error(`Order in non-settleable status: ${order.status}`);
  }

  return await db.transaction(async (tx: DbTx) => {
    const grant = await grantSubscriptionInTx(tx, {
      userId: order.userId,
      orderId: order.id,
      packageType: order.packageType as PackageType,
      amount: input.payload.transferAmount,
      paymentMethod: input.adminId ? "ADMIN_MANUAL" : "SEPAY",
      adminId: input.adminId ?? null,
      newExpiresAt: new Date(),
    });

    await tx
      .update(orders)
      .set({
        status: "SUCCESS" as OrderStatus,
        subscriptionExpiresAt: grant.newExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    await tx.insert(sepayTransactions).values({
      id: input.manualSepayId ?? input.payload.id,
      orderId: order.id,
      orderCode: order.orderCode,
      amountReceived: input.payload.transferAmount,
      gateway: input.payload.gateway,
      transactionDate: parseTransactionDate(input.payload.transactionDate),
      transferType: input.payload.transferType,
      accountNumber: input.payload.accountNumber,
      referenceCode: input.payload.referenceCode ?? null,
      description: input.payload.description,
      content: input.payload.content,
      rawPayload: input.payload as unknown as Record<string, unknown>,
    });

    return { orderId: order.id, newExpiresAt: grant.newExpiresAt };
  });
}

// ─── Main: Process Webhook (5 bước theo PAYMENT_SYSTEM.md §4) ───────────────

export interface ProcessSepayWebhookInput {
  rawBody: string;
  apiKey: string | null;
  /**
   * IP thật của caller (đã parse từ x-forwarded-for tại route layer).
   * Dùng để check whitelist SePay. Mặc định "" (route layer luôn truyền).
   */
  clientIp?: string;
  /** Bypass mọi check auth (chỉ dùng khi `?test=true` tại route). */
  bypassAuth?: boolean;
}

export async function processSepayWebhook(
  input: ProcessSepayWebhookInput,
): Promise<WebhookProcessResult> {
  // Lớp 1: IP Whitelist (theo docs developer.sepay.vn/vi/dia-chi-ip).
  // Chặn request không phải từ SePay edge. Qua proxy (ngrok, Vercel...), IP
  // thật của SePay chỉ có trong x-forwarded-for — route layer parse rồi truyền vào.
  if (!input.bypassAuth && !isSepayIp(input.clientIp ?? "")) {
    return { kind: "ip_not_allowed", clientIp: input.clientIp ?? "" };
  }

  // Lớp 2: API Key Authentication (theo docs developer.sepay.vn/vi/xac-thuc).
  // Chặn trường hợp SePay đổi IP — danh sách IP có thể được SePay update.
  if (!input.bypassAuth && !verifyApiKey(input.apiKey)) {
    return { kind: "signature_invalid" };
  }

  // Parse payload
  const parsed = parseSepayPayload(input.rawBody);
  if (!parsed.ok) {
    return { kind: "invalid_payload", error: parsed.error };
  }
  const payload = parsed.payload;

  // Bước 2: Idempotency
  if (await isSepayTransactionProcessed(payload.id)) {
    const [existing] = await db
      .select({ orderId: sepayTransactions.orderId })
      .from(sepayTransactions)
      .where(eq(sepayTransactions.id, payload.id))
      .limit(1);
    if (existing) {
      return { kind: "ok", orderId: existing.orderId, alreadyProcessed: true };
    }
  }

  // Bước 3: Resolve paymentMemo + lookup order
  // Ưu tiên paymentMemo (16 chars, không bị cắt) → dùng để lookup bằng orderId.
  // Fallback orderCode (cũ) để tương thích với orders tạo trước khi có paymentMemo.
  const paymentMemo = parsePaymentMemo(payload.content, payload.code ?? null);
  const orderLookup = await getOrderForWebhook({
    paymentMemo,
    orderCode: payload.code ?? null,
  });

  if (!orderLookup) {
    const raw = paymentMemo ?? payload.code ?? "(empty)";
    console.warn("SePay webhook: order not found", {
      paymentMemo,
      code: payload.code,
      content: payload.content,
    });
    return { kind: "order_not_found", paymentMemo: raw };
  }

  const { order } = orderLookup;
  if (order.status === ("SUCCESS" as OrderStatus)) {
    return { kind: "order_already_settled", orderId: order.id };
  }
  if (order.status !== ("PENDING" as OrderStatus)) {
    return { kind: "order_already_settled", orderId: order.id };
  }

  // ─── LAZY EXPIRY (chốt chặn 2: webhook guard) ───────────────────────────
  // Trong kiến trúc Lazy Expiry, polling API (chốt 1) là nơi expire chính.
  // Webhook này đóng vai trò guard khi học viên đóng trình duyệt rồi CK muộn:
  // SePay bắn tiền về sau >15 phút, polling không chạy nữa → webhook phải
  // tự phát hiện và chặn, không cho settle lên Premium sai quy trình.
  //
  // Hàm `markOrderExpiredIfDue` (từ order.service) là single source of truth:
  // idempotent + safe race (vì điều kiện `status = PENDING` trong WHERE).
  const now = new Date();
  if (order.expiresAt < now) {
    await markOrderExpiredIfDue(order, now);
    return {
      kind: "order_expired",
      orderId: order.id,
      expiredAt: new Date(order.expiresAt).toISOString(),
    };
  }

  if (payload.transferAmount < order.amount) {
    return {
      kind: "amount_mismatch",
      expected: order.amount,
      received: payload.transferAmount,
      orderId: order.id,
    };
  }

  // Bước 4: Settle
  try {
    await settleOrderInDb({ orderId: order.id, payload });
  } catch (err) {
    // Re-throw → route layer trả 500 → SePay retry.
    throw err;
  }

  // Bước 5: Phản hồi
  return { kind: "ok", orderId: order.id, alreadyProcessed: false };
}

// ─── Manual Approve (admin) ─────────────────────────────────────────────────
//
// Dùng khi user chuyển khoản off-platform (gặp sự cố QR, ngoài giờ SePay sandbox...)
// hoặc cần force-approve test. Admin nhập amount + orderId, service tạo synthetic
// SePay payload rồi gọi settleOrderInDb.

export interface ManualApproveSepayOrderInput {
  orderId: string;
  adminId: string;
  amount?: number;          // optional override. Default = order.amount
  gateway?: string;
  note?: string;
}

export interface ManualApproveResult {
  orderId: string;
  newExpiresAt: string;
  manualSepayId: string;
}

export async function manualApproveSepayOrder(
  input: ManualApproveSepayOrderInput,
): Promise<ManualApproveResult> {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, input.orderId))
    .limit(1);

  if (!order) throw new Error("Order not found");
  if (order.status === ("SUCCESS" as OrderStatus)) {
    throw new Error("Order already settled");
  }
  if (order.status !== ("PENDING" as OrderStatus)) {
    throw new Error(`Order in non-approvable status: ${order.status}`);
  }

  const amount = input.amount ?? order.amount;
  if (amount < order.amount) {
    throw new Error(
      `Amount ${amount} is less than order amount ${order.amount}`,
    );
  }

  // Synthetic SePay payload — định danh duy nhất để idempotency nếu admin click 2 lần.
  const manualSepayId = `manual_${nanoid(18)}`;
  const syntheticPayload: SepayWebhookPayload = {
    gateway: input.gateway ?? "MANUAL_APPROVE",
    transactionDate: new Date()
      .toISOString()
      .replace("T", " ")
      .slice(0, 19),
    accountNumber: env.SEPAY_BANK_ACCOUNT,
    subAccount: null,
    code: order.orderCode,
    content: input.note
      ? `MANUAL_APPROVE ${order.orderCode} ${input.note}`
      : `MANUAL_APPROVE ${order.orderCode}`,
    transferType: "in",
    description: `Admin ${input.adminId} manually approved order ${order.orderCode}`,
    transferAmount: amount,
    referenceCode: null,
    accumulated: 0,
    id: manualSepayId,
  };

  const { newExpiresAt } = await settleOrderInDb({
    orderId: order.id,
    payload: syntheticPayload,
    adminId: input.adminId,
    manualSepayId,
  });

  return {
    orderId: order.id,
    newExpiresAt: newExpiresAt.toISOString(),
    manualSepayId,
  };
}

// Re-export DbTx for callers
export type { DbTx };
