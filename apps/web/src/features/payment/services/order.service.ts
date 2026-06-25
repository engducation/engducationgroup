import { db } from "@/db";
import { env } from "@/env";
import { orders, type OrderStatus } from "@/db/schema";
import { and, desc, eq, lt } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  buildOrderQrUrl,
  generateOrderCode,
  PACKAGE_LABELS,
} from "./vietqr.service";
import { generatePaymentMemo } from "../utils/payment-memo.utils";
import { getPackagePriceInfo, type CalculatedPrice } from "./pricing.service";
import type { OrderSummary, PackageType } from "../types/schemas";

// ─── Constants ──────────────────────────────────────────────────────────────

const MS_PER_MINUTE = 60 * 1000;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CreateSepayOrderInput {
  userId: string;
  packageType: PackageType;
  voucherCode?: string;
}

export interface CreateSepayOrderResult {
  order: OrderSummary;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function expiresAtFromNow(): Date {
  return new Date(Date.now() + env.ORDER_EXPIRY_MINUTES * MS_PER_MINUTE);
}

function toOrderSummary(order: {
  id: string;
  orderCode: string;
  paymentMemo: string;
  packageType: string;
  amount: number;
  status: string;
  expiresAt: Date;
  subscriptionExpiresAt: Date | null;
  createdAt: Date;
}): OrderSummary {
  const packageType = order.packageType as PackageType;
  return {
    id: order.id,
    orderCode: order.orderCode,
    paymentMemo: order.paymentMemo,
    packageType,
    packageLabel: PACKAGE_LABELS[packageType] ?? packageType,
    amount: order.amount,
    status: order.status as OrderSummary["status"],
    expiresAt: new Date(order.expiresAt).toISOString(),
    subscriptionExpiresAt: order.subscriptionExpiresAt
      ? new Date(order.subscriptionExpiresAt).toISOString()
      : null,
    createdAt: new Date(order.createdAt).toISOString(),
    qrUrl: buildOrderQrUrl({ paymentMemo: order.paymentMemo, amount: order.amount }),
    bank: {
      accountNumber: env.SEPAY_BANK_ACCOUNT,
      bankCode: env.SEPAY_BANK_CODE,
      accountName: env.SEPAY_ACCOUNT_NAME,
    },
  };
}

// ─── Create Order ───────────────────────────────────────────────────────────

export async function createSepayOrder(
  input: CreateSepayOrderInput,
): Promise<CreateSepayOrderResult> {
  // Lấy giá từ pricing.service.ts (dynamic pricing từ DB)
  const pkgInfo = await getPackagePriceInfo(input.packageType);
  const amount = pkgInfo.currentPrice;

  const id = `ord_${nanoid(14)}`;
  const orderCode = await generateOrderCode(input.packageType);
  const paymentMemo = generatePaymentMemo();
  const expiresAt = expiresAtFromNow();

  const [inserted] = await db
    .insert(orders)
    .values({
      id,
      userId: input.userId,
      orderCode,
      paymentMemo,
      packageType: input.packageType,
      amount,
      status: "PENDING",
      paymentMethod: "SEPAY",
      expiresAt,
    })
    .returning();

  return { order: toOrderSummary(inserted) };
}

// ─── Get Order (with ownership check + lazy expiry) ─────────────────────────
//
// Lazy Expiry: nếu order vẫn PENDING mà đã quá `expiresAt` so với hiện tại
// → update sang EXPIRED ngay trong request này (Just-in-Time). Trả về
// OrderSummary mới nhất cho client, UI sẽ tự hiển thị màn hình hết hạn.
//
// Lợi ích so với cron job cũ:
//   - Không phụ thuộc vào Vercel Cron (Hobby plan skip khi ít traffic).
//   - Học viên ngồi xem countdown → polling API tự expire đúng giây phút 15:00.
//   - Hai nguồn expire (polling + webhook) đều dùng chung `markOrderExpiredIfDue`
//     → tránh double-write và race condition (vì điều kiện `status = PENDING`).
export async function getOrderById(
  orderId: string,
  userId: string,
): Promise<OrderSummary | null> {
  const [row] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);

  if (!row) return null;

  // Lazy check: nếu PENDING mà quá hạn → expire ngay. Hàm helper chỉ mutate
  // `status` (cùng id, expiresAt không đổi), nên ta mutate local `row.status`
  // thay vì SELECT lại — tiết kiệm 1 round-trip.
  const fresh = await markOrderExpiredIfDue(row, new Date());
  if (fresh) {
    row.status = fresh.status as OrderStatus;
  }
  return toOrderSummary(row);
}

// ─── Get Order (admin - no ownership check) ─────────────────────────────────

export async function getOrderByIdAdmin(orderId: string) {
  const [row] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  return row ?? null;
}

// ─── List User Orders ───────────────────────────────────────────────────────

export async function listUserOrders(userId: string, limit = 20) {
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  return rows.map(toOrderSummary);
}

// ─── List Pending Orders (admin) ────────────────────────────────────────────
// Dùng cho admin dashboard khi muốn thấy đơn SePay đang chờ thanh toán.

export async function listPendingOrders(limit = 50) {
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.status, "PENDING"))
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  return rows;
}

// ─── Lookup Order by paymentMemo (dùng cho webhook) ──────────────────────────
// paymentMemo là chuỗi ngắn 16 ký tự (EP_<12 chars>) được embed trong VietQR content.
// SePay echo lại nguyên văn trong webhook → dùng để lookup orderId (PK) trong DB.

export async function getOrderByMemo(paymentMemo: string) {
  const [row] = await db
    .select()
    .from(orders)
    .where(eq(orders.paymentMemo, paymentMemo))
    .limit(1);
  return row ?? null;
}

// ─── Lookup Order for webhook processing ─────────────────────────────────────
// Ưu tiên paymentMemo (16 chars, đáng tin cậy), fallback orderCode (cũ).

export async function getOrderForWebhook(params: {
  paymentMemo?: string | null;
  orderCode?: string | null;
}) {
  if (params.paymentMemo) {
    const order = await getOrderByMemo(params.paymentMemo);
    if (order) return { order, lookupMethod: "paymentMemo" as const };
  }
  if (params.orderCode) {
    const order = await getOrderByCode(params.orderCode);
    if (order) return { order, lookupMethod: "orderCode" as const };
  }
  return null;
}

// ─── Lookup Order by orderCode (dùng cho webhook) ──────────────────────────

export async function getOrderByCode(orderCode: string) {
  const [row] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderCode, orderCode))
    .limit(1);
  return row ?? null;
}

// ─── Lazy Expiry helper (dùng chung cho polling + webhook) ──────────────────
//
// Nếu `order` đang PENDING và `expiresAt` đã qua so với `now` → set EXPIRED
// ngay trong DB và trả về bản ghi mới. Ngược lại trả về `null` (không cần
// update). Hàm này idempotent nhờ điều kiện `status = PENDING` trong WHERE.
//
// Đây là single source of truth cho cơ chế Lazy Expiry — cả polling API
// lẫn webhook SePay đều gọi nó, không cần cron job chạy nền nữa.
//
// Lưu ý: hàm này KHÔNG ném lỗi nếu order đã ở trạng thái khác PENDING
// → an toàn khi gọi nhiều lần cùng lúc (race giữa polling và webhook).
export async function markOrderExpiredIfDue(
  order: { id: string; status: string; expiresAt: Date },
  now: Date = new Date(),
): Promise<{ id: string; status: string; expiresAt: Date } | null> {
  if (order.status !== "PENDING") return null;
  if (order.expiresAt >= now) return null;

  const [updated] = await db
    .update(orders)
    .set({ status: "EXPIRED" as OrderStatus, updatedAt: now })
    .where(
      and(
        eq(orders.id, order.id),
        eq(orders.status, "PENDING" as OrderStatus),
        lt(orders.expiresAt, now),
      ),
    )
    .returning({ id: orders.id, status: orders.status, expiresAt: orders.expiresAt });

  return updated ?? null;
}

// ─── Cancel Order (user-initiated) ───────────────────────────────────────────
//
// Student tự hủy đơn PENDING từ UI. Hành vi giống `markOrderExpiredIfDue`
// (set EXPIRED + idempotent nhờ `status = PENDING` trong WHERE) nhưng:
//   - KHÔNG check `expiresAt` (cho phép hủy sớm, không phải đợi hết 15 phút)
//   - Có ownership check ở route layer; ở đây chỉ enforce status transition
//
// Trả về bản ghi mới nếu cancel thành công, `null` nếu order không còn
// PENDING (đã SUCCESS / EXPIRED / FAILED — không cần làm gì).
export async function cancelOrder(
  orderId: string,
): Promise<{ id: string; status: string } | null> {
  const [updated] = await db
    .update(orders)
    .set({ status: "EXPIRED" as OrderStatus, updatedAt: new Date() })
    .where(
      and(eq(orders.id, orderId), eq(orders.status, "PENDING" as OrderStatus)),
    )
    .returning({ id: orders.id, status: orders.status });

  return updated ?? null;
}

// ─── Idempotency check helper cho webhook ───────────────────────────────────
// Dùng trong webhook handler để check SePay transaction id đã xử lý chưa.

export async function isSepayTransactionProcessed(sepayId: string): Promise<boolean> {
  // Trực tiếp query bảng sepay_transactions — không cần join orders.
  // (Drizzle relational query không có sẵn relation ở file này.)
  const { sepayTransactions } = await import("@/db/schema/payment");
  const [row] = await db
    .select({ id: sepayTransactions.id })
    .from(sepayTransactions)
    .where(eq(sepayTransactions.id, sepayId))
    .limit(1);
  return Boolean(row);
}
