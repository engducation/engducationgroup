import { db } from "@/db";
import { subscriptionAuditLog, user } from "@/db/schema";
import { PACKAGE_DURATIONS } from "@/features/payment/services/vietqr.service";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { PackageType } from "@/db/schema";

// ─── Constants ──────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * Transaction client type — suy ra từ `db.transaction()` callback param.
 * Tương thích với cả `NeonHttpDatabase` và `PgTransaction` (lồng nhau).
 */
export type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface GrantSubscriptionInput {
  userId: string;
  orderId: string;
  packageType: PackageType;
  amount: number;
  paymentMethod: string;          // "SEPAY" | "MANUAL_BANK_TRANSFER" | ...
  adminId?: string | null;        // null khi grant tự động qua webhook
  newExpiresAt: Date;             // computed bởi caller (hoặc helper bên dưới)
}

export interface ComputeNewExpiresAtInput {
  currentExpiresAt: Date | null;
  packageType: PackageType;
  now?: Date;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Tính ngày hết hạn Premium mới theo logic cộng dồn (PAYMENT_SYSTEM.md §2.2):
 *   - Nếu user đang còn Premium hạn → cộng dồn từ ngày hết hạn hiện tại.
 *   - Nếu không (đã hết hạn hoặc chưa từng) → bắt đầu từ `now`.
 */
export function computeNewExpiresAt(input: ComputeNewExpiresAtInput): Date {
  const days = PACKAGE_DURATIONS[input.packageType];
  if (!days) {
    throw new Error(`Invalid package type: ${input.packageType}`);
  }
  const now = input.now ?? new Date();
  const current = input.currentExpiresAt ? new Date(input.currentExpiresAt) : null;
  const baseDate = current && current > now ? current : now;
  return new Date(baseDate.getTime() + days * DAY_MS);
}

// ─── Main: Grant Subscription ───────────────────────────────────────────────
//
// Hàm này chỉ cập nhật `user.subscriptionPlan` + `expiresAt` + ghi audit log.
// KHÔNG cập nhật `orders` ở đây — caller phải xử lý trong cùng transaction.

export async function grantSubscriptionInTx(
  tx: DbTx,
  input: GrantSubscriptionInput,
): Promise<{ activatedAt: Date; newExpiresAt: Date }> {
  const now = new Date();

  // Lấy user hiện tại trong transaction để tránh race condition.
  const [currentUser] = await tx
    .select({ expiresAt: user.expiresAt })
    .from(user)
    .where(eq(user.id, input.userId));

  if (!currentUser) {
    throw new Error("Người dùng không tồn tại");
  }

  const newExpiresAt = computeNewExpiresAt({
    currentExpiresAt: currentUser.expiresAt,
    packageType: input.packageType,
    now: input.newExpiresAt ? new Date() : now,
  });

  // Update user
  await tx
    .update(user)
    .set({
      subscriptionPlan: input.packageType,
      activatedAt: now,
      expiresAt: newExpiresAt,
      updatedAt: now,
    })
    .where(eq(user.id, input.userId));

  // Audit log (append-only)
  await tx.insert(subscriptionAuditLog).values({
    id: nanoid(),
    orderId: input.orderId,
    userId: input.userId,
    packageType: input.packageType,
    amount: input.amount,
    oldStatus: "NONE",
    newStatus: "SUCCESS",
    paymentMethod: input.paymentMethod,
    adminId: input.adminId ?? null,
    createdAt: now,
  });

  return { activatedAt: now, newExpiresAt };
}
