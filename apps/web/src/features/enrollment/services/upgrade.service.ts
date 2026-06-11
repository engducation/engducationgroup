import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { transactionLog, revenueLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// ─── Package Types (matching admin schema) ──────────────────────────────────────

export const PACKAGE_TYPES = ["MONTHLY", "6_MONTH", "YEAR"] as const;
export type PackageType = (typeof PACKAGE_TYPES)[number];

export const PACKAGE_PRICES: Record<PackageType, number> = {
  MONTHLY: 49000,
  "6_MONTH": 269000,
  YEAR: 499000,
};

export const PACKAGE_DURATIONS: Record<PackageType, number> = {
  MONTHLY: 30,
  "6_MONTH": 180,
  YEAR: 365,
};

export const PACKAGE_LABELS: Record<PackageType, string> = {
  MONTHLY: "Gói 1 Tháng",
  "6_MONTH": "Gói 6 Tháng",
  YEAR: "Gói 1 Năm",
};

export const PACKAGE_DESCRIPTIONS: Record<PackageType, string> = {
  MONTHLY: "Truy cập tất cả khóa học trong 30 ngày",
  "6_MONTH": "Truy cập tất cả khóa học trong 180 ngày với ưu đãi đặc biệt",
  YEAR: "Truy cập tất cả khóa học trong 365 ngày - Tiết kiệm nhất!",
};

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface UpgradeResult {
  success: boolean;
  error?: string;
  transactionId?: string;
  newExpiresAt?: Date;
}

export interface TransactionRecord {
  id: string;
  transactionCode: string;
  packageType: PackageType;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: Date;
}

export interface SimulatedPaymentData {
  userId: string;
  packageType: PackageType;
  paymentMethod: string;
}

// ─── Helper: Generate transaction code ──────────────────────────────────────────

function generateTransactionCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = nanoid(6).toUpperCase();
  return `TXN-${timestamp}-${random}`;
}

// ─── Helper: Get current subscription info ─────────────────────────────────────

export async function getCurrentSubscriptionInfo(userId: string): Promise<{
  subscriptionPlan: string | null;
  expiresAt: Date | null;
  isActive: boolean;
}> {
  const [currentUser] = await db
    .select({
      subscriptionPlan: user.subscriptionPlan,
      expiresAt: user.expiresAt,
    })
    .from(user)
    .where(eq(user.id, userId));

  if (!currentUser) {
    return { subscriptionPlan: null, expiresAt: null, isActive: false };
  }

  const isPremium = Boolean(currentUser.subscriptionPlan) && currentUser.subscriptionPlan !== "FREE";
  const isNotExpired = currentUser.expiresAt ? new Date(currentUser.expiresAt) > new Date() : false;

  return {
    subscriptionPlan: currentUser.subscriptionPlan,
    expiresAt: currentUser.expiresAt ? new Date(currentUser.expiresAt) : null,
    isActive: Boolean(isPremium && isNotExpired),
  };
}

// ─── Main: Simulate Premium Upgrade ───────────────────────────────────────────

export async function simulatePremiumUpgrade(
  userId: string,
  packageType: PackageType = "MONTHLY"
): Promise<UpgradeResult> {
  // Step 1: Verify user exists
  const [currentUser] = await db
    .select({
      id: user.id,
      subscriptionPlan: user.subscriptionPlan,
      expiresAt: user.expiresAt,
    })
    .from(user)
    .where(eq(user.id, userId));

  if (!currentUser) {
    return { success: false, error: "Người dùng không tồn tại" };
  }

  // Step 2: Get package info
  const price = PACKAGE_PRICES[packageType];
  const durationDays = PACKAGE_DURATIONS[packageType];

  if (!price || !durationDays) {
    return { success: false, error: "Gói không hợp lệ" };
  }

  // Step 3: Calculate new expiration date
  const now = new Date();
  let newExpiresAt: Date;

  if (currentUser.expiresAt && new Date(currentUser.expiresAt) > now) {
    // Extend from current expiration
    const currentExpiry = new Date(currentUser.expiresAt);
    newExpiresAt = new Date(currentExpiry.getTime() + durationDays * 24 * 60 * 60 * 1000);
  } else {
    // Start from now
    newExpiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
  }

  // Step 4: Generate transaction ID and code
  const transactionId = nanoid();
  const transactionCode = generateTransactionCode();

  // Step 5: Update user subscription (Action 1)
  await db
    .update(user)
    .set({
      subscriptionPlan: packageType,
      activatedAt: now,
      expiresAt: newExpiresAt,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));

  // Step 6: Create transaction log (Action 2)
  await db.insert(transactionLog).values({
    id: transactionId,
    userId,
    transactionCode,
    packageType,
    amount: price,
    paymentMethod: "SIMULATED_BANK_TRANSFER",
    paymentContent: `Nạp tiền qua ngân hàng - Mô phỏng`,
    status: "COMPLETED",
  });

  // Step 7: Update revenue log (Action 3)
  const today = now.toISOString().split("T")[0];
  const [existingRevenue] = await db
    .select()
    .from(revenueLog)
    .where(eq(revenueLog.date, today as any));

  if (existingRevenue) {
    // Update existing record
    const newBreakdown = { ...existingRevenue.packageBreakdown };
    newBreakdown[packageType] = (newBreakdown[packageType] || 0) + price;

    await db
      .update(revenueLog)
      .set({
        amount: existingRevenue.amount + price,
        transactionCount: existingRevenue.transactionCount + 1,
        packageBreakdown: newBreakdown,
        updatedAt: new Date(),
      })
      .where(eq(revenueLog.id, existingRevenue.id));
  } else {
    // Create new record
    const breakdown: Record<string, number> = {
      MONTHLY: 0,
      "6_MONTH": 0,
      YEAR: 0,
    };
    breakdown[packageType] = price;

    await db.insert(revenueLog).values({
      id: nanoid(),
      date: today as any,
      category: "PREMIUM_SUBSCRIPTION",
      amount: price,
      currency: "VND",
      transactionCount: 1,
      packageBreakdown: breakdown,
    });
  }

  return {
    success: true,
    transactionId,
    newExpiresAt,
  };
}

// ─── Get user transactions ──────────────────────────────────────────────────────

export async function getUserTransactions(userId: string): Promise<TransactionRecord[]> {
  const transactions = await db
    .select({
      id: transactionLog.id,
      transactionCode: transactionLog.transactionCode,
      packageType: transactionLog.packageType,
      amount: transactionLog.amount,
      paymentMethod: transactionLog.paymentMethod,
      status: transactionLog.status,
      createdAt: transactionLog.createdAt,
    })
    .from(transactionLog)
    .where(eq(transactionLog.userId, userId))
    .orderBy(transactionLog.createdAt);

  return transactions as TransactionRecord[];
}
