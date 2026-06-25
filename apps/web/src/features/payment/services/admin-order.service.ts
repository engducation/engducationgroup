import { db } from "@/db";
import {
  orders,
  sepayTransactions,
  user,
  type OrderStatus,
  type PackageType,
} from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  PACKAGE_LABELS,
  PACKAGE_PRICES,
  buildOrderQrUrl,
} from "./vietqr.service";
import { env } from "@/env";
import type { OrderSummary } from "../types/schemas";

// ─── Constants ──────────────────────────────────────────────────────────────

const MS_PER_MINUTE = 60 * 1000;

// ─── Public DTO for admin list ──────────────────────────────────────────────

export interface SepayOrderAdminRow {
  id: string;
  orderCode: string;
  paymentMemo: string | null;   // Có thể null với orders cũ (trước migration)
  userId: string;
  userName: string | null;
  userEmail: string | null;
  packageType: string;
  packageLabel: string;
  amount: number;
  status: OrderStatus;
  paymentMethod: string;
  expiresAt: string;
  createdAt: string;
  subscriptionExpiresAt: string | null;
  transactionCount: number;
  lastTransactionAt: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function expiresAtFromNow(): Date {
  return new Date(Date.now() + env.ORDER_EXPIRY_MINUTES * MS_PER_MINUTE);
}

function toOrderSummary(row: {
  id: string;
  orderCode: string;
  paymentMemo: string | null;
  packageType: string;
  amount: number;
  status: string;
  expiresAt: Date;
  createdAt: Date;
}): OrderSummary {
  const packageType = row.packageType as PackageType;
  return {
    id: row.id,
    orderCode: row.orderCode,
    paymentMemo: row.paymentMemo ?? "",
    packageType,
    packageLabel: PACKAGE_LABELS[packageType] ?? packageType,
    amount: row.amount,
    status: row.status as OrderStatus,
    expiresAt: new Date(row.expiresAt).toISOString(),
    createdAt: new Date(row.createdAt).toISOString(),
    qrUrl: buildOrderQrUrl({
      paymentMemo: row.paymentMemo ?? "",
      amount: row.amount,
    }),
    bank: {
      accountNumber: env.SEPAY_BANK_ACCOUNT,
      bankCode: env.SEPAY_BANK_CODE,
      accountName: env.SEPAY_ACCOUNT_NAME,
    },
  };
}

// ─── Public helpers reused by webhook & student flow ────────────────────────

export async function getOrderByCode(orderCode: string) {
  const [row] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderCode, orderCode))
    .limit(1);
  return row ?? null;
}

export async function isSepayTransactionProcessed(sepayId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: sepayTransactions.id })
    .from(sepayTransactions)
    .where(eq(sepayTransactions.id, sepayId))
    .limit(1);
  return Boolean(row);
}

// ─── Admin: list SePay orders ───────────────────────────────────────────────

export interface ListSepayOrdersFilters {
  status?: OrderStatus | "ALL";
  search?: string; // match orderCode | userName | userEmail
  limit?: number;
  offset?: number;
}

export async function listSepayOrdersForAdmin(
  filters: ListSepayOrdersFilters = {},
): Promise<{ rows: SepayOrderAdminRow[]; total: number }> {
  const { status = "ALL", search, limit = 50, offset = 0 } = filters;

  // Subquery: tx count + last received_at cho mỗi order
  const txCountSub = db
    .select({
      orderId: sepayTransactions.orderId,
      count: sql<number>`count(*)::int`.as("count"),
      lastReceivedAt: sql<Date | null>`max(${sepayTransactions.receivedAt})`.as(
        "last_received_at",
      ),
    })
    .from(sepayTransactions)
    .groupBy(sepayTransactions.orderId)
    .as("tx_count");

  const conditions = [];
  if (status !== "ALL") {
    conditions.push(eq(orders.status, status));
  }
  if (search) {
    const like = `%${search.toLowerCase()}%`;
    conditions.push(sql<boolean>`
      (
        lower(${orders.orderCode}) like ${like}
        or lower(coalesce(${orders.paymentMemo}, '')) like ${like}
        or lower(coalesce(${user.name}, '')) like ${like}
        or lower(coalesce(${user.email}, '')) like ${like}
      )
    `);
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const baseQuery = db
    .select({
      id: orders.id,
      orderCode: orders.orderCode,
      paymentMemo: orders.paymentMemo,
      userId: orders.userId,
      userName: user.name,
      userEmail: user.email,
      packageType: orders.packageType,
      amount: orders.amount,
      status: orders.status,
      paymentMethod: orders.paymentMethod,
      expiresAt: orders.expiresAt,
      createdAt: orders.createdAt,
      subscriptionExpiresAt: orders.subscriptionExpiresAt,
      transactionCount: sql<number>`coalesce(${txCountSub.count}, 0)`.as(
        "transaction_count",
      ),
      lastTransactionAt: txCountSub.lastReceivedAt,
    })
    .from(orders)
    .leftJoin(user, eq(orders.userId, user.id))
    .leftJoin(txCountSub, eq(txCountSub.orderId, orders.id));

  const rows = await (where ? baseQuery.where(where) : baseQuery)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  const totalRows = await (where
    ? db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .leftJoin(user, eq(orders.userId, user.id))
        .where(where)
    : db.select({ count: sql<number>`count(*)::int` }).from(orders));

  return {
    rows: rows.map((row) => ({
      ...row,
      packageLabel:
        PACKAGE_LABELS[row.packageType as PackageType] ?? row.packageType,
      expiresAt: new Date(row.expiresAt).toISOString(),
      createdAt: new Date(row.createdAt).toISOString(),
      subscriptionExpiresAt: row.subscriptionExpiresAt
        ? new Date(row.subscriptionExpiresAt).toISOString()
        : null,
      lastTransactionAt: row.lastTransactionAt
        ? new Date(row.lastTransactionAt).toISOString()
        : null,
    })),
    total: totalRows[0]?.count ?? 0,
  };
}

// ─── Admin: get detail ──────────────────────────────────────────────────────

export interface SepayOrderDetail extends SepayOrderAdminRow {
  transactions: Array<{
    id: string;
    gateway: string | null;
    amountReceived: number;
    transactionDate: string | null;
    transferType: string | null;
    accountNumber: string | null;
    referenceCode: string | null;
    description: string | null;
    content: string | null;
    receivedAt: string;
  }>;
}

export async function getSepayOrderDetailForAdmin(
  orderId: string,
): Promise<SepayOrderDetail | null> {
  const [row] = await db
    .select({
      id: orders.id,
      orderCode: orders.orderCode,
      paymentMemo: orders.paymentMemo,
      userId: orders.userId,
      userName: user.name,
      userEmail: user.email,
      packageType: orders.packageType,
      amount: orders.amount,
      status: orders.status,
      paymentMethod: orders.paymentMethod,
      expiresAt: orders.expiresAt,
      createdAt: orders.createdAt,
      subscriptionExpiresAt: orders.subscriptionExpiresAt,
    })
    .from(orders)
    .leftJoin(user, eq(orders.userId, user.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!row) return null;

  const transactions = await db
    .select({
      id: sepayTransactions.id,
      gateway: sepayTransactions.gateway,
      amountReceived: sepayTransactions.amountReceived,
      transactionDate: sepayTransactions.transactionDate,
      transferType: sepayTransactions.transferType,
      accountNumber: sepayTransactions.accountNumber,
      referenceCode: sepayTransactions.referenceCode,
      description: sepayTransactions.description,
      content: sepayTransactions.content,
      receivedAt: sepayTransactions.receivedAt,
    })
    .from(sepayTransactions)
    .where(eq(sepayTransactions.orderId, orderId))
    .orderBy(desc(sepayTransactions.receivedAt));

  return {
    ...row,
    packageLabel: PACKAGE_LABELS[row.packageType as PackageType] ?? row.packageType,
    transactionCount: transactions.length,
    lastTransactionAt: transactions[0]?.receivedAt
      ? new Date(transactions[0].receivedAt).toISOString()
      : null,
    expiresAt: new Date(row.expiresAt).toISOString(),
    createdAt: new Date(row.createdAt).toISOString(),
    subscriptionExpiresAt: row.subscriptionExpiresAt
      ? new Date(row.subscriptionExpiresAt).toISOString()
      : null,
    transactions: transactions.map((t) => ({
      ...t,
      transactionDate: t.transactionDate
        ? new Date(t.transactionDate).toISOString()
        : null,
      receivedAt: new Date(t.receivedAt).toISOString(),
    })),
  };
}

// ─── Admin: analytics for SePay flow ─────────────────────────────────────────

export interface SepayAdminAnalytics {
  totalRevenue: number;
  successCount: number;
  pendingCount: number;
  failedCount: number;
  expiredCount: number;
  todayRevenue: number;
  thisMonthRevenue: number;
}

export async function getSepayAdminAnalytics(): Promise<SepayAdminAnalytics> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [agg] = await db
    .select({
      totalRevenue: sql<number>`
        coalesce(sum(case when ${orders.status} = 'SUCCESS' then ${orders.amount} else 0 end), 0)::int
      `.as("total_revenue"),
      successCount: sql<number>`
        count(case when ${orders.status} = 'SUCCESS' then 1 end)::int
      `.as("success_count"),
      pendingCount: sql<number>`
        count(case when ${orders.status} = 'PENDING' then 1 end)::int
      `.as("pending_count"),
      failedCount: sql<number>`
        count(case when ${orders.status} = 'FAILED' then 1 end)::int
      `.as("failed_count"),
      expiredCount: sql<number>`
        count(case when ${orders.status} = 'EXPIRED' then 1 end)::int
      `.as("expired_count"),
      todayRevenue: sql<number>`
        coalesce(sum(case when ${orders.status} = 'SUCCESS' and ${orders.createdAt} >= ${startOfDay} then ${orders.amount} else 0 end), 0)::int
      `.as("today_revenue"),
      thisMonthRevenue: sql<number>`
        coalesce(sum(case when ${orders.status} = 'SUCCESS' and ${orders.createdAt} >= ${startOfMonth} then ${orders.amount} else 0 end), 0)::int
      `.as("this_month_revenue"),
    })
    .from(orders);

  return {
    totalRevenue: agg?.totalRevenue ?? 0,
    successCount: agg?.successCount ?? 0,
    pendingCount: agg?.pendingCount ?? 0,
    failedCount: agg?.failedCount ?? 0,
    expiredCount: agg?.expiredCount ?? 0,
    todayRevenue: agg?.todayRevenue ?? 0,
    thisMonthRevenue: agg?.thisMonthRevenue ?? 0,
  };
}

// ─── Re-exports for caller convenience ──────────────────────────────────────

export {
  expiresAtFromNow,
  toOrderSummary,
};
// giữ cho code phụ thuộc cũ vẫn dùng được
export const __preserveTypes = {
  PACKAGE_PRICES,
  nanoid,
};
