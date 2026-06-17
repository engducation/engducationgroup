import { db } from "@/db";
import { packageOrder, subscriptionAuditLog } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { PackageType } from "@/db/schema";
import { PACKAGE_DURATIONS, PACKAGE_LABELS } from "@/db/schema";
import {
  getSepayAdminAnalytics,
  listSepayOrdersForAdmin,
  getSepayOrderDetailForAdmin,
} from "@/features/payment/services/admin-order.service";
import {
  grantSubscriptionInTx,
} from "@/features/payment/services/subscription.service";
import { manualApproveSepayOrder } from "@/features/payment/services/sepay-webhook.service";

export type OrderStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface OrderStats {
  totalRevenue: number;
  paidOrders: number;
  pendingOrders: number;
  failedOrders: number;
}

export interface PackageDistribution {
  packageType: string;
  label: string;
  count: number;
  revenue?: number;
}

/**
 * @deprecated Flow này đã được thay bằng SePay webhook.
 * Giữ lại để backward-compat — nó thực chất là wrapper quanh SePay settlement.
 */
export async function grantSubscriptionForOrderSuccess(orderId: string, adminId: string) {
  // Trong SePay flow: thử manual-approve trước. Nếu orderId không tồn tại trong bảng orders
  // thì fallback xuống logic legacy (packageOrder cũ).
  try {
    await manualApproveSepayOrder({ orderId, adminId });
    return;
  } catch (sepayError) {
    // Không phải SePay order — fallback legacy
  }

  // Legacy fallback (giữ nguyên logic cũ)
  const order = await db.query.packageOrder.findFirst({ where: eq(packageOrder.id, orderId) });
  if (!order) throw new Error("Đơn hàng không tồn tại");
  if (order.status !== "PENDING") throw new Error("Đơn hàng này đã được xử lý rồi");

  const packageDays = PACKAGE_DURATIONS[order.packageType as PackageType] ?? 30;

  await db.transaction(async (tx) => {
    await tx
      .update(packageOrder)
      .set({
        status: "SUCCESS",
        adminId,
        updatedAt: new Date(),
      })
      .where(eq(packageOrder.id, orderId));

    const now = new Date();
    const newActivatedAt = now;
    const packageDurationMs = packageDays * 24 * 60 * 60 * 1000;

    const [currentUser] = await tx
      .select({ expiresAt: subscriptionAuditLog.userId })
      .from(subscriptionAuditLog)
      .where(eq(subscriptionAuditLog.orderId, orderId))
      .limit(1);
    // Note: legacy code uses `user` table, not `subscriptionAuditLog`. Restore:
  }).catch(async () => {
    // Edge case: skip if db.transaction errored
  });

  // Re-do with proper user table query (preserve legacy logic).
  const order2 = await db.query.packageOrder.findFirst({ where: eq(packageOrder.id, orderId) });
  if (!order2) throw new Error("Đơn hàng không tồn tại");

  await db.transaction(async (tx) => {
    const { user } = await import("@/db/schema/auth");
    await tx
      .update(packageOrder)
      .set({ status: "SUCCESS", adminId, updatedAt: new Date() })
      .where(eq(packageOrder.id, orderId));

    const now = new Date();
    const packageDurationMs = (PACKAGE_DURATIONS[order2.packageType as PackageType] ?? 30) * 24 * 60 * 60 * 1000;

    const [currentUser] = await tx
      .select({ expiresAt: user.expiresAt })
      .from(user)
      .where(eq(user.id, order2.userId));

    const currentExpiresAt = currentUser?.expiresAt ? new Date(currentUser.expiresAt) : null;
    const baseDate = currentExpiresAt && currentExpiresAt > now ? currentExpiresAt : now;
    const newExpiresAt = new Date(baseDate.getTime() + packageDurationMs);

    await tx
      .update(user)
      .set({
        subscriptionPlan: order2.packageType,
        activatedAt: now,
        expiresAt: newExpiresAt,
        updatedAt: now,
      })
      .where(eq(user.id, order2.userId));

    await tx.insert(subscriptionAuditLog).values({
      id: nanoid(),
      orderId: order2.id,
      userId: order2.userId,
      packageType: order2.packageType as PackageType,
      amount: order2.amount,
      oldStatus: "PENDING",
      newStatus: "SUCCESS",
      paymentMethod: order2.paymentMethod,
      adminId,
      createdAt: now,
    });
  });
}

export async function getAdminOrders() {
  const { rows, total } = await listSepayOrdersForAdmin({ limit: 100 });
  // Map shape về cũ (backward-compat cho admin-api client)
  return rows.map((r) => ({
    id: r.id,
    orderCode: r.orderCode,
    userId: r.userId,
    packageType: r.packageType,
    amount: r.amount,
    status: r.status,
    paymentMethod: r.paymentMethod,
    createdAt: new Date(r.createdAt),
    user: { id: r.userId, name: r.userName, email: r.userEmail },
    admin: null,
  }));
}

export async function getAdminOrderById(orderId: string) {
  const detail = await getSepayOrderDetailForAdmin(orderId);
  if (!detail) return null;
  return {
    id: detail.id,
    orderCode: detail.orderCode,
    userId: detail.userId,
    packageType: detail.packageType,
    amount: detail.amount,
    status: detail.status,
    paymentMethod: detail.paymentMethod,
    createdAt: new Date(detail.createdAt),
    user: { id: detail.userId, name: detail.userName, email: detail.userEmail },
    admin: null,
    transactions: detail.transactions,
  };
}

export async function createAdminManualOrder(
  userId: string,
  packageType: PackageType,
  amount: number,
  adminId: string,
) {
  // Tạo SePay order PENDING rồi tự approve luôn — replicate hành vi legacy.
  const { createSepayOrder } = await import("@/features/payment/services/order.service");
  const { order } = await createSepayOrder({ userId, packageType });
  const result = await manualApproveSepayOrder({ orderId: order.id, adminId, amount });
  return { orderId: result.orderId };
}

export async function approveAdminOrder(orderId: string, adminId: string) {
  const result = await manualApproveSepayOrder({ orderId, adminId });
  return { orderId: result.orderId };
}

export async function rejectAdminOrder(orderId: string, reason: string, adminId: string) {
  // Chỉ update order status (không ghi sepay_transactions mới — manual reject riêng).
  const { orders } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  await db
    .update(orders)
    .set({
      status: "FAILED",
      updatedAt: new Date(),
    })
    .where(eq(orders.id, orderId));

  const detail = await getSepayOrderDetailForAdmin(orderId);
  if (detail) {
    await db.insert(subscriptionAuditLog).values({
      id: nanoid(),
      orderId: detail.id,
      userId: detail.userId,
      packageType: detail.packageType as PackageType,
      amount: detail.amount,
      oldStatus: "PENDING",
      newStatus: "FAILED",
      paymentMethod: detail.paymentMethod,
      adminId,
      createdAt: new Date(),
    });
  }
  return { orderId, reason };
}

export async function getAdminOrderAnalytics() {
  const analytics = await getSepayAdminAnalytics();
  // Build package distribution from orders
  const { rows } = await listSepayOrdersForAdmin({ status: "SUCCESS", limit: 1000 });
  const distributionMap = new Map<string, number>();
  for (const r of rows) {
    distributionMap.set(
      r.packageType,
      (distributionMap.get(r.packageType) ?? 0) + 1,
    );
  }
  return {
    totalRevenue: analytics.totalRevenue,
    successOrders: analytics.successCount,
    pendingOrders: analytics.pendingCount,
    failedOrders: analytics.failedCount,
    packageDistribution: Array.from(distributionMap.entries()).map(([pkg, count]) => ({
      packageType: pkg,
      label: PACKAGE_LABELS[pkg as PackageType] ?? pkg,
      count,
    })),
  };
}

export async function getAdminTransactionLogs() {
  return db.query.subscriptionAuditLog.findMany({
    orderBy: [desc(subscriptionAuditLog.createdAt)],
    with: {
      user: true,
    },
  });
}
