import { db } from "@/db";
import { user, session, adminAuditLog, systemSetting } from "@/db/schema";
import { eq, desc, not, count, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// User Moderation

export interface BanUserInput {
  targetUserId: string;
  reason: string;
  adminId: string;
  adminEmail: string;
  adminRole: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function banUser(input: BanUserInput) {
  const target = await db.query.user.findFirst({
    where: eq(user.id, input.targetUserId),
  });

  if (!target) throw new Error("Người dùng không tồn tại");
  if (target.role === "admin") throw new Error("Không thể khóa tài khoản có quyền Admin");

  await db.transaction(async (tx) => {
    await tx
      .update(user)
      .set({
        status: "BANNED",
        banReason: input.reason,
        updatedAt: new Date(),
      })
      .where(eq(user.id, input.targetUserId));

    await tx.delete(session).where(eq(session.userId, input.targetUserId));

    await tx.insert(adminAuditLog).values({
      id: nanoid(),
      adminId: input.adminId,
      adminEmail: input.adminEmail,
      adminRole: input.adminRole,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      action: "BAN_USER",
      oldPayload: JSON.stringify({ userId: input.targetUserId, status: target.status, banReason: target.banReason }),
      newPayload: JSON.stringify({ userId: input.targetUserId, status: "BANNED", banReason: input.reason }),
      createdAt: new Date(),
    });
  });

  return { success: true };
}

export interface UnbanUserInput {
  targetUserId: string;
  adminId: string;
  adminEmail: string;
  adminRole: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function unbanUser(input: UnbanUserInput) {
  const target = await db.query.user.findFirst({
    where: eq(user.id, input.targetUserId),
  });

  if (!target) throw new Error("Người dùng không tồn tại");

  await db.transaction(async (tx) => {
    await tx
      .update(user)
      .set({
        status: "ACTIVE",
        banReason: null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, input.targetUserId));

    await tx.insert(adminAuditLog).values({
      id: nanoid(),
      adminId: input.adminId,
      adminEmail: input.adminEmail,
      adminRole: input.adminRole,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      action: "UNBAN_USER",
      oldPayload: JSON.stringify({ userId: input.targetUserId, status: target.status, banReason: target.banReason }),
      newPayload: JSON.stringify({ userId: input.targetUserId, status: "ACTIVE", banReason: null }),
      createdAt: new Date(),
    });
  });

  return { success: true };
}

export async function getUsersWithModeration() {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      banReason: user.banReason,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(not(eq(user.role, "admin")))
    .orderBy(desc(user.createdAt));
}

export async function getAdminUsers() {
  return db.query.user.findMany({
    orderBy: [desc(user.createdAt)],
  });
}

// System Settings

export async function getSystemSettings() {
  const settings = await db.query.systemSetting.findMany();
  return settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);
}

export async function getSystemSetting(key: string) {
  return db.query.systemSetting.findFirst({
    where: eq(systemSetting.key, key),
  });
}

export interface UpdateSystemSettingInput {
  key: string;
  value: string;
  adminId: string;
  adminEmail: string;
  adminRole: string;
}

export async function updateSystemSetting(input: UpdateSystemSettingInput) {
  const existing = await db.query.systemSetting.findFirst({
    where: eq(systemSetting.key, input.key),
  });

  await db.transaction(async (tx) => {
    if (existing) {
      await tx
        .update(systemSetting)
        .set({ value: input.value, updatedAt: new Date() })
        .where(eq(systemSetting.key, input.key));
    } else {
      await tx.insert(systemSetting).values({
        key: input.key,
        value: input.value,
        updatedAt: new Date(),
      });
    }

    await tx.insert(adminAuditLog).values({
      id: nanoid(),
      adminId: input.adminId,
      adminEmail: input.adminEmail,
      adminRole: input.adminRole,
      action: "UPDATE_SYSTEM_SETTING",
      oldPayload: existing ? JSON.stringify({ key: input.key, value: existing.value }) : null,
      newPayload: JSON.stringify({ key: input.key, value: input.value }),
      createdAt: new Date(),
    });
  });

  return { success: true };
}

// Audit Logs

export async function getAdminAuditLogs(limit?: number) {
  return db.query.adminAuditLog.findMany({
    orderBy: [desc(adminAuditLog.createdAt)],
    ...(limit ? { limit } : {}),
  });
}

export async function logAdminAction(data: {
  adminId: string;
  adminEmail: string;
  adminRole: string;
  action: string;
  oldPayload?: string | null;
  newPayload?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  await db.insert(adminAuditLog).values({
    id: nanoid(),
    adminId: data.adminId,
    adminEmail: data.adminEmail,
    adminRole: data.adminRole,
    action: data.action,
    oldPayload: data.oldPayload ?? null,
    newPayload: data.newPayload ?? null,
    ipAddress: data.ipAddress ?? null,
    userAgent: data.userAgent ?? null,
    createdAt: new Date(),
  });
  return { success: true };
}
