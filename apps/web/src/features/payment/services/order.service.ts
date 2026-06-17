import { db } from "@/db";
import { env } from "@/env";
import { orders, type OrderStatus } from "@/db/schema";
import { and, desc, eq, lt } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  buildOrderQrUrl,
  generateOrderCode,
  PACKAGE_LABELS,
  PACKAGE_PRICES,
} from "./vietqr.service";
import type { OrderSummary, PackageType } from "../types/schemas";

// ─── Constants ──────────────────────────────────────────────────────────────

const MS_PER_MINUTE = 60 * 1000;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CreateSepayOrderInput {
  userId: string;
  packageType: PackageType;
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
  packageType: string;
  amount: number;
  status: string;
  expiresAt: Date;
  createdAt: Date;
}): OrderSummary {
  const packageType = order.packageType as PackageType;
  return {
    id: order.id,
    orderCode: order.orderCode,
    packageType,
    packageLabel: PACKAGE_LABELS[packageType] ?? packageType,
    amount: order.amount,
    status: order.status as OrderSummary["status"],
    expiresAt: new Date(order.expiresAt).toISOString(),
    createdAt: new Date(order.createdAt).toISOString(),
    qrUrl: buildOrderQrUrl({ orderCode: order.orderCode, amount: order.amount }),
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
  const amount = PACKAGE_PRICES[input.packageType];
  if (!amount) {
    // Zod đã validate ở route layer, nhưng defensive check vẫn an toàn.
    throw new Error(`Invalid package type: ${input.packageType}`);
  }

  const id = `ord_${nanoid(14)}`;
  const orderCode = await generateOrderCode();
  const expiresAt = expiresAtFromNow();

  const [inserted] = await db
    .insert(orders)
    .values({
      id,
      userId: input.userId,
      orderCode,
      packageType: input.packageType,
      amount,
      status: "PENDING",
      paymentMethod: "SEPAY",
      expiresAt,
    })
    .returning();

  return { order: toOrderSummary(inserted) };
}

// ─── Get Order (with ownership check) ───────────────────────────────────────

export async function getOrderById(
  orderId: string,
  userId: string,
): Promise<OrderSummary | null> {
  const [row] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);

  return row ? toOrderSummary(row) : null;
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

// ─── Lookup Order by orderCode (dùng cho webhook) ──────────────────────────

export async function getOrderByCode(orderCode: string) {
  const [row] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderCode, orderCode))
    .limit(1);
  return row ?? null;
}

// ─── Expire Pending Orders (Cron) ───────────────────────────────────────────
// Set status = EXPIRED cho các order PENDING quá thời hạn. Trả về số lượng.

export async function expirePendingOrders(now: Date = new Date()): Promise<number> {
  const result = await db
    .update(orders)
    .set({ status: "EXPIRED", updatedAt: now })
    .where(and(eq(orders.status, "PENDING"), lt(orders.expiresAt, now)))
    .returning({ id: orders.id });

  return result.length;
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
