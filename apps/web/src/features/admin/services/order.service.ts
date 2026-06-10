import { db } from "@/db";
import { packageOrder, subscriptionAuditLog, user } from "@/db/schema";
import { eq, desc, count, sum, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { PackageType } from "@/db/schema";
import { PACKAGE_LABELS, PACKAGE_DURATIONS } from "@/db/schema";

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

export async function grantSubscriptionForOrderSuccess(orderId: string, adminId: string) {
  const order = await db.query.packageOrder.findFirst({ where: eq(packageOrder.id, orderId) });
  if (!order) throw new Error("Đơn hàng không tồn tại");
  if (order.status !== "PENDING") throw new Error("Đơn hàng này đã được xử lý rồi");

  const packageDays = PACKAGE_DURATIONS[order.packageType as PackageType] ?? 30;

  await db.transaction(async (tx) => {
    // Update order status
    await tx
      .update(packageOrder)
      .set({
        status: "SUCCESS",
        adminId,
        updatedAt: new Date(),
      })
      .where(eq(packageOrder.id, orderId));

    // Calculate new subscription expiry
    const now = new Date();
    const newActivatedAt = now;
    const packageDurationMs = packageDays * 24 * 60 * 60 * 1000;

    // Get current user subscription
    const [currentUser] = await tx
      .select({ expiresAt: user.expiresAt })
      .from(user)
      .where(eq(user.id, order.userId));

    const currentExpiresAt = currentUser?.expiresAt ? new Date(currentUser.expiresAt) : null;
    const isCurrentlyActive = currentExpiresAt && currentExpiresAt > now;

    // If user has active subscription, extend from current expiry
    // If no active subscription, start from now
    const baseDate = isCurrentlyActive ? currentExpiresAt! : now;
    const newExpiresAt = new Date(baseDate.getTime() + packageDurationMs);

    // Update user subscription dates
    await tx
      .update(user)
      .set({
        activatedAt: newActivatedAt,
        expiresAt: newExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(user.id, order.userId));

    // Create audit log
    await tx.insert(subscriptionAuditLog).values({
      id: nanoid(),
      orderId: order.id,
      userId: order.userId,
      packageType: order.packageType,
      amount: order.amount,
      oldStatus: "PENDING",
      newStatus: "SUCCESS",
      paymentMethod: order.paymentMethod,
      adminId,
      createdAt: new Date(),
    });
  });
}

export async function getAdminOrders() {
  return db.query.packageOrder.findMany({
    orderBy: [desc(packageOrder.createdAt)],
    with: {
      user: true,
      admin: true,
    },
  });
}

export async function getAdminOrderById(orderId: string) {
  return db.query.packageOrder.findFirst({
    where: eq(packageOrder.id, orderId),
    with: {
      user: true,
      admin: true,
    },
  });
}

export async function createAdminManualOrder(
  userId: string,
  packageType: PackageType,
  amount: number,
  adminId: string,
) {
  const orderId = `PKG_${nanoid(10).toUpperCase()}`;

  await db.transaction(async (tx) => {
    await tx.insert(packageOrder).values({
      id: orderId,
      userId,
      packageType,
      amount,
      status: "PENDING",
      paymentMethod: "MANUAL_BANK_TRANSFER",
      adminId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await tx.insert(subscriptionAuditLog).values({
      id: nanoid(),
      orderId,
      userId,
      packageType,
      amount,
      oldStatus: "NONE",
      newStatus: "PENDING",
      paymentMethod: "MANUAL_BANK_TRANSFER",
      adminId,
      createdAt: new Date(),
    });
  });

  return { orderId };
}

export async function approveAdminOrder(orderId: string, adminId: string) {
  await grantSubscriptionForOrderSuccess(orderId, adminId);
  return { orderId };
}

export async function rejectAdminOrder(orderId: string, reason: string, adminId: string) {
  const order = await db.query.packageOrder.findFirst({ where: eq(packageOrder.id, orderId) });
  if (!order) throw new Error("Đơn hàng không tồn tại");
  if (order.status !== "PENDING") throw new Error("Đơn hàng này đã được xử lý rồi");

  await db.transaction(async (tx) => {
    await tx
      .update(packageOrder)
      .set({
        status: "FAILED",
        adminId,
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(packageOrder.id, orderId));

    await tx.insert(subscriptionAuditLog).values({
      id: nanoid(),
      orderId: order.id,
      userId: order.userId,
      packageType: order.packageType,
      amount: order.amount,
      oldStatus: "PENDING",
      newStatus: "FAILED",
      paymentMethod: order.paymentMethod,
      adminId,
      createdAt: new Date(),
    });
  });

  return { orderId };
}

export async function getAdminOrderAnalytics() {
  const [stats] = await db
    .select({
      totalRevenue: sum(packageOrder.amount),
      successOrders: sql<number>`sum(case when ${packageOrder.status} = 'SUCCESS' then 1 else 0 end)`,
      pendingOrders: sql<number>`sum(case when ${packageOrder.status} = 'PENDING' then 1 else 0 end)`,
      failedOrders: sql<number>`sum(case when ${packageOrder.status} = 'FAILED' then 1 else 0 end)`,
    })
    .from(packageOrder);

  // Package distribution for analytics
  const packageDistribution = await db
    .select({
      packageType: packageOrder.packageType,
      count: count(packageOrder.id),
    })
    .from(packageOrder)
    .where(eq(packageOrder.status, "SUCCESS"))
    .groupBy(packageOrder.packageType);

  return {
    totalRevenue: Number(stats?.totalRevenue ?? 0),
    successOrders: Number(stats?.successOrders ?? 0),
    pendingOrders: Number(stats?.pendingOrders ?? 0),
    failedOrders: Number(stats?.failedOrders ?? 0),
    packageDistribution: packageDistribution.map((item) => ({
      packageType: item.packageType,
      label: PACKAGE_LABELS[item.packageType as PackageType] ?? item.packageType,
      count: item.count,
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
