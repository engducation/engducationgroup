import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/db";
import { env } from "@/env";
import {
  orders,
  sepayTransactions,
  type OrderStatus,
  type PackageType,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  sepayWebhookPayloadSchema,
  type SepayWebhookPayload,
  type WebhookProcessResult,
} from "../types/schemas";
import { getOrderByCode, isSepayTransactionProcessed } from "./order.service";
import { grantSubscriptionInTx, type DbTx } from "./subscription.service";
import { parseOrderCodeFromContent } from "./vietqr.service";

// ─── HMAC Signature Verification ────────────────────────────────────────────

const SEPAY_SIGNATURE_HEADERS = [
  "x-sepay-signature",
  "x-sepay-webhook-signature",
  "sepay-signature",
] as const;

export function getSignatureFromHeaders(headers: Headers): string | null {
  for (const name of SEPAY_SIGNATURE_HEADERS) {
    const value = headers.get(name);
    if (value) return value.trim();
  }
  return null;
}

export function computeHmacSignature(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

export function verifyHmacSignature(
  rawBody: string,
  providedSignature: string | null,
  secret: string = env.SEPAY_WEBHOOK_SECRET,
): boolean {
  if (!providedSignature) return false;
  const expected = computeHmacSignature(rawBody, secret);

  const provided = providedSignature.startsWith("sha256=")
    ? providedSignature.slice("sha256=".length)
    : providedSignature;

  if (expected.length !== provided.length) return false;

  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(provided, "hex"));
  } catch {
    return false;
  }
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
  signature: string | null;
}

export async function processSepayWebhook(
  input: ProcessSepayWebhookInput,
): Promise<WebhookProcessResult> {
  // Bước 1: HMAC Validation
  if (!verifyHmacSignature(input.rawBody, input.signature)) {
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

  // Resolve orderCode (ưu tiên `code` riêng, fallback parse từ `content`).
  // `parseOrderCodeFromContent` giờ là async (query DB lấy active patterns).
  const fromCode = payload.code?.trim();
  const orderCode = fromCode || (await parseOrderCodeFromContent(payload.content));
  if (!orderCode) {
    return { kind: "order_not_found", orderCode: "" };
  }

  // Bước 3: Tìm & đối soát order
  const order = await getOrderByCode(orderCode);
  if (!order) {
    return { kind: "order_not_found", orderCode };
  }
  if (order.status === ("SUCCESS" as OrderStatus)) {
    return { kind: "order_already_settled", orderId: order.id };
  }
  if (order.status !== ("PENDING" as OrderStatus)) {
    return { kind: "order_already_settled", orderId: order.id };
  }

  // ─── BƯỚC 3.5: Auto-expire fallback (defense-in-depth) ────────────────────
  // Nếu cron job không chạy (Vercel Hobby bị skip, project ít traffic),
  // ta vẫn expire order ngay khi webhook nhận được CK quá hạn.
  // Điều này đảm bảo UX: user không bị "treo" PENDING mãi khi CK muộn.
  const now = new Date();
  if (order.expiresAt < now) {
    await markOrderExpired(order.id);
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

async function parseSepayCodeFromContent(content: string): Promise<string | null> {
  return await parseOrderCodeFromContent(content);
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

/**
 * Mark a PENDING order as EXPIRED.
 *
 * Được dùng làm FALLBACK khi cron job không kịp chạy (Vercel Hobby plan
 * skip cron nếu project không có traffic). Nếu webhook SePay nhận được
 * CK cho order đã quá hạn, ta expire ngay tại đây thay vì settle.
 *
 * Idempotent: nếu order không còn PENDING thì bỏ qua.
 */
export async function markOrderExpired(orderId: string): Promise<void> {
  await db
    .update(orders)
    .set({
      status: "EXPIRED" as OrderStatus,
      updatedAt: new Date(),
    })
    .where(
      and(eq(orders.id, orderId), eq(orders.status, "PENDING" as OrderStatus)),
    );
}
