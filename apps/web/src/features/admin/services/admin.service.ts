import { db } from "@/db";
import {
  aiPrompt,
  userCourse,
  courseOrder,
  transactionAuditLog,
  systemSetting,
  userAiUsage,
  aiApiLog,
  writingReviewTicket,
  supportTicket,
  supportTicketMessage,
  adminAuditLog,
  user,
  session,
} from "@/db/schema";
import {
  course,
  write,
  writingSubmission,
  lesson,
  module,
  vocabulary,
  lessonVideo,
  quiz,
  quizQuestion,
} from "@/db/schema/learning-content";
import { eq, and, desc, gte, sql, count, sum, not } from "drizzle-orm";
import { nanoid } from "nanoid";

// ─── UTILS ─────────────────────────────────────────────────────────────────

function getTodayStringGmt7(): string {
  // Trả về YYYY-MM-DD theo GMT+7
  const date = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
  return date.toISOString().split("T")[0];
}

// ─── 1. AI PROMPT MANAGEMENT ───────────────────────────────────────────────

export async function getPrompts() {
  return db.query.aiPrompt.findMany({
    orderBy: [desc(aiPrompt.createdAt)],
  });
}

export async function createPrompt(data: {
  id: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  temperature: number;
  maxTokens: number;
}) {
  await db.insert(aiPrompt).values({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return { success: true };
}

export async function updatePrompt(
  id: string,
  data: {
    name?: string;
    systemPrompt?: string;
    userPromptTemplate?: string;
    temperature?: number;
    maxTokens?: number;
  },
) {
  await db
    .update(aiPrompt)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(aiPrompt.id, id));
  return { success: true };
}

export async function deletePrompt(id: string) {
  await db.delete(aiPrompt).where(eq(aiPrompt.id, id));
  return { success: true };
}

// ─── 2. AI QUOTA & USAGE CONTROL ───────────────────────────────────────────

export async function checkAiQuota(
  userId: string,
  writeId: string,
): Promise<{ allowed: boolean; reason?: string }> {
  // 1. Kiểm tra tài khoản có bị Ban không
  const student = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });
  if (student?.status === "BANNED") {
    return { allowed: false, reason: "Tài khoản của bạn đã bị khóa do vi phạm chính sách hệ thống." };
  }

  // 2. Kiểm tra Global Daily Limit
  const globalSetting = await db.query.systemSetting.findFirst({
    where: eq(systemSetting.key, "global_daily_limit"),
  });
  const globalDailyLimit = globalSetting ? parseInt(globalSetting.value, 10) : 20;

  const today = getTodayStringGmt7();
  const usageRecord = await db.query.userAiUsage.findFirst({
    where: and(eq(userAiUsage.userId, userId), eq(userAiUsage.usageDate, today)),
  });
  const currentDailyCount = usageRecord ? usageRecord.count : 0;

  if (currentDailyCount >= globalDailyLimit) {
    return {
      allowed: false,
      reason: "Bạn đã hết lượt chấm bài bằng AI trong ngày hôm nay. Vui lòng quay lại vào ngày mai.",
    };
  }

  // 3. Kiểm tra Per-Exercise Quota (Lượt nộp của riêng Bài viết này)
  const exercise = await db.query.write.findFirst({
    where: eq(write.id, writeId),
  });
  if (!exercise) {
    return { allowed: false, reason: "Bài tập không tồn tại." };
  }

  // Tìm submission hiện tại của học viên cho bài này
  const submission = await db.query.writingSubmission.findFirst({
    where: and(eq(writingSubmission.userId, userId), eq(writingSubmission.writeId, writeId)),
  });

  const revisionsUsed = submission ? submission.aiRevisionsUsed : 0;
  if (revisionsUsed >= exercise.maxAiRevisions) {
    return {
      allowed: false,
      reason: "Bạn đã vượt quá số lần AI hỗ trợ chấm bài cho bài tập này.",
    };
  }

  return { allowed: true };
}

export async function incrementAiUsage(userId: string, writeId: string) {
  const today = getTodayStringGmt7();

  await db.transaction(async (tx) => {
    // 1. Increment bộ đếm Daily
    const existingUsage = await tx.query.userAiUsage.findFirst({
      where: and(eq(userAiUsage.userId, userId), eq(userAiUsage.usageDate, today)),
    });

    if (existingUsage) {
      await tx
        .update(userAiUsage)
        .set({ count: existingUsage.count + 1, updatedAt: new Date() })
        .where(eq(userAiUsage.id, existingUsage.id));
    } else {
      await tx.insert(userAiUsage).values({
        id: nanoid(),
        userId,
        usageDate: today,
        count: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 2. Increment số lượt Revision đã dùng của bài tập
    const submission = await tx.query.writingSubmission.findFirst({
      where: and(eq(writingSubmission.userId, userId), eq(writingSubmission.writeId, writeId)),
    });

    if (submission) {
      await tx
        .update(writingSubmission)
        .set({
          aiRevisionsUsed: submission.aiRevisionsUsed + 1,
          updatedAt: new Date(),
        })
        .where(eq(writingSubmission.id, submission.id));
    }
  });
}

export async function logAiApiCall(data: {
  userId: string;
  writeId?: string;
  promptId?: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: number;
  isError: boolean;
  errorMessage?: string;
}) {
  await db.insert(aiApiLog).values({
    id: nanoid(),
    ...data,
    createdAt: new Date(),
  });
}

// ─── 3. AI COST & ERROR MONITORING ─────────────────────────────────────────

export async function getAiCostAnalytics() {
  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  // 1. Thống kê lỗi trong 10 phút qua
  const last10MinCalls = await db
    .select({
      total: count(),
      errors: sql<number>`sum(case when ${aiApiLog.isError} = true then 1 else 0 end)`,
    })
    .from(aiApiLog)
    .where(gte(aiApiLog.createdAt, tenMinutesAgo));

  const totalCalls = last10MinCalls[0]?.total ?? 0;
  const errorCalls = Number(last10MinCalls[0]?.errors ?? 0);
  const errorRatePercent = totalCalls > 0 ? (errorCalls / totalCalls) * 100 : 0;

  // 2. Thống kê chi phí theo Khóa học
  // Lấy danh sách các bài viết thuộc khóa học để map chi phí
  const courseCosts = await db
    .select({
      courseId: course.id,
      courseTitle: course.title,
      totalTokens: sum(aiApiLog.totalTokens),
      totalCostUsd: sum(aiApiLog.costUsd),
      callsCount: count(aiApiLog.id),
    })
    .from(aiApiLog)
    .innerJoin(write, eq(aiApiLog.writeId, write.id))
    .innerJoin(lesson, eq(write.lessonId, lesson.id))
    .innerJoin(module, eq(lesson.moduleId, module.id))
    .innerJoin(course, eq(module.courseId, course.id))
    .groupBy(course.id, course.title);

  // 3. Thống kê Top bài tập tốn chi phí nhất
  const exerciseCosts = await db
    .select({
      writeId: write.id,
      promptText: write.prompt,
      totalTokens: sum(aiApiLog.totalTokens),
      totalCostUsd: sum(aiApiLog.costUsd),
      callsCount: count(aiApiLog.id),
    })
    .from(aiApiLog)
    .innerJoin(write, eq(aiApiLog.writeId, write.id))
    .groupBy(write.id)
    .orderBy(desc(sql`sum(${aiApiLog.costUsd})`))
    .limit(10);

  return {
    errorRatePercent,
    totalCalls10m: totalCalls,
    errorCalls10m: errorCalls,
    courseCosts: courseCosts.map((c) => ({
      courseId: c.courseId,
      courseTitle: c.courseTitle,
      totalTokens: Number(c.totalTokens ?? 0),
      totalCostUsd: Number(c.totalCostUsd ?? 0),
      callsCount: c.callsCount,
    })),
    exerciseCosts: exerciseCosts.map((e) => ({
      writeId: e.writeId,
      promptText: e.promptText.substring(0, 80) + (e.promptText.length > 80 ? "..." : ""),
      totalTokens: Number(e.totalTokens ?? 0),
      totalCostUsd: Number(e.totalCostUsd ?? 0),
      callsCount: e.callsCount,
    })),
  };
}

// ─── 4. SUBSCRIPTION & ORDER ACTIVATION ────────────────────────────────────

export async function createManualOrder(
  userId: string,
  courseId: string,
  amount: number,
  adminId: string,
) {
  const orderId = "MAN_" + nanoid(10).toUpperCase();

  await db.transaction(async (tx) => {
    // Tạo Order dạng PENDING
    await tx.insert(courseOrder).values({
      id: orderId,
      userId,
      courseId,
      amount,
      status: "PENDING",
      paymentMethod: "MANUAL_BANK_TRANSFER",
      adminId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Tạo bản ghi log đối soát đầu tiên
    await tx.insert(transactionAuditLog).values({
      id: nanoid(),
      orderId,
      userId,
      courseId,
      amount,
      oldStatus: "NONE",
      newStatus: "PENDING",
      paymentMethod: "MANUAL_BANK_TRANSFER",
      adminId,
      createdAt: new Date(),
    });
  });

  return orderId;
}

export async function approveOrder(orderId: string, adminId: string) {
  const order = await db.query.courseOrder.findFirst({
    where: eq(courseOrder.id, orderId),
  });

  if (!order) throw new Error("Đơn hàng không tồn tại");
  if (order.status !== "PENDING") throw new Error("Đơn hàng này đã được xử lý rồi");

  // Tìm khóa học để xem accessDurationDays
  const targetCourse = await db.query.course.findFirst({
    where: eq(course.id, order.courseId),
  });

  if (!targetCourse) throw new Error("Khóa học không tồn tại");

  await db.transaction(async (tx) => {
    // 1. Cập nhật Order -> SUCCESS
    await tx
      .update(courseOrder)
      .set({
        status: "SUCCESS",
        adminId,
        updatedAt: new Date(),
      })
      .where(eq(courseOrder.id, orderId));

    // 2. Tính toán ngày hết hạn quyền truy cập khóa học
    const activatedAt = new Date();
    let expiresAt: Date | null = null;

    if (targetCourse.accessDurationDays && targetCourse.accessDurationDays > 0) {
      expiresAt = new Date(activatedAt.getTime() + targetCourse.accessDurationDays * 24 * 60 * 60 * 1000);
    }

    // 3. Khởi tạo quyền truy cập khóa học (userCourse)
    await tx.insert(userCourse).values({
      id: nanoid(),
      userId: order.userId,
      courseId: order.courseId,
      activatedAt,
      expiresAt,
      createdAt: new Date(),
    });

    // 4. Ghi Audit Log Giao dịch bất biến
    await tx.insert(transactionAuditLog).values({
      id: nanoid(),
      orderId,
      userId: order.userId,
      courseId: order.courseId,
      amount: order.amount,
      oldStatus: "PENDING",
      newStatus: "SUCCESS",
      paymentMethod: order.paymentMethod,
      adminId,
      createdAt: new Date(),
    });
  });

  return { success: true };
}

export async function rejectOrder(orderId: string, reason: string, adminId: string) {
  const order = await db.query.courseOrder.findFirst({
    where: eq(courseOrder.id, orderId),
  });

  if (!order) throw new Error("Đơn hàng không tồn tại");
  if (order.status !== "PENDING") throw new Error("Đơn hàng này đã được xử lý rồi");

  await db.transaction(async (tx) => {
    // 1. Cập nhật Order -> FAILED
    await tx
      .update(courseOrder)
      .set({
        status: "FAILED",
        rejectionReason: reason,
        adminId,
        updatedAt: new Date(),
      })
      .where(eq(courseOrder.id, orderId));

    // 2. Ghi Audit Log Giao dịch bất biến
    await tx.insert(transactionAuditLog).values({
      id: nanoid(),
      orderId,
      userId: order.userId,
      courseId: order.courseId,
      amount: order.amount,
      oldStatus: "PENDING",
      newStatus: "FAILED",
      paymentMethod: order.paymentMethod,
      adminId,
      createdAt: new Date(),
    });
  });

  return { success: true };
}

export async function getOrders() {
  return db
    .select({
      id: courseOrder.id,
      amount: courseOrder.amount,
      status: courseOrder.status,
      paymentMethod: courseOrder.paymentMethod,
      rejectionReason: courseOrder.rejectionReason,
      createdAt: courseOrder.createdAt,
      userName: user.name,
      userEmail: user.email,
      courseTitle: course.title,
    })
    .from(courseOrder)
    .innerJoin(user, eq(courseOrder.userId, user.id))
    .innerJoin(course, eq(courseOrder.courseId, course.id))
    .orderBy(desc(courseOrder.createdAt));
}

export async function getTransactionAuditLogs() {
  return db
    .select({
      id: transactionAuditLog.id,
      orderId: transactionAuditLog.orderId,
      amount: transactionAuditLog.amount,
      oldStatus: transactionAuditLog.oldStatus,
      newStatus: transactionAuditLog.newStatus,
      paymentMethod: transactionAuditLog.paymentMethod,
      createdAt: transactionAuditLog.createdAt,
      adminName: user.name,
    })
    .from(transactionAuditLog)
    .leftJoin(user, eq(transactionAuditLog.adminId, user.id))
    .orderBy(desc(transactionAuditLog.createdAt));
}

// ─── 5. HELPDECK & HUMAN-IN-THE-LOOP ───────────────────────────────────────

export async function createReviewTicket(submissionId: string, userId: string, message: string) {
  const id = nanoid();
  await db.insert(writingReviewTicket).values({
    id,
    submissionId,
    userId,
    userMessage: message,
    status: "PENDING",
    createdAt: new Date(),
  });
  return id;
}

export async function getReviewTickets() {
  return db
    .select({
      id: writingReviewTicket.id,
      submissionId: writingReviewTicket.submissionId,
      userMessage: writingReviewTicket.userMessage,
      status: writingReviewTicket.status,
      teacherScore: writingReviewTicket.teacherScore,
      teacherFeedback: writingReviewTicket.teacherFeedback,
      createdAt: writingReviewTicket.createdAt,
      studentName: user.name,
      studentEmail: user.email,
      originalText: writingSubmission.content,
      aiFeedback: writingSubmission.aiFeedback,
      aiScore: writingSubmission.aiScore,
    })
    .from(writingReviewTicket)
    .innerJoin(user, eq(writingReviewTicket.userId, user.id))
    .innerJoin(writingSubmission, eq(writingReviewTicket.submissionId, writingSubmission.id))
    .orderBy(desc(writingReviewTicket.createdAt));
}

export async function resolveWritingReview(
  ticketId: string,
  score: number,
  feedback: string,
  teacherId: string,
) {
  const ticket = await db.query.writingReviewTicket.findFirst({
    where: eq(writingReviewTicket.id, ticketId),
  });

  if (!ticket) throw new Error("Yêu cầu khiếu nại không tồn tại");

  await db.transaction(async (tx) => {
    // 1. Cập nhật Ticket -> RESOLVED
    await tx
      .update(writingReviewTicket)
      .set({
        status: "RESOLVED",
        teacherScore: score,
        teacherFeedback: feedback,
        assignedTeacherId: teacherId,
        resolvedAt: new Date(),
      })
      .where(eq(writingReviewTicket.id, ticketId));

    // 2. Ghi đè kết quả Giáo viên vào Bài viết của Học sinh (writingSubmission)
    await tx
      .update(writingSubmission)
      .set({
        teacherScore: score,
        teacherFeedback: feedback,
        status: "RESOLVED",
        updatedAt: new Date(),
      })
      .where(eq(writingSubmission.id, ticket.submissionId));
  });

  return { success: true };
}

// Helpdesk ticket management
export async function createSupportTicket(userId: string, data: {
  title: string;
  category: "ACCOUNT" | "VIDEO" | "QUIZ" | "SYSTEM_ERROR";
  description: string;
}) {
  const id = nanoid();
  await db.insert(supportTicket).values({
    id,
    userId,
    ...data,
    status: "OPEN",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}

export async function getSupportTickets() {
  return db
    .select({
      id: supportTicket.id,
      title: supportTicket.title,
      category: supportTicket.category,
      description: supportTicket.description,
      status: supportTicket.status,
      createdAt: supportTicket.createdAt,
      updatedAt: supportTicket.updatedAt,
      studentName: user.name,
      studentEmail: user.email,
      assigneeName: sql<string>`(select name from "user" where id = ${supportTicket.assigneeId})`,
    })
    .from(supportTicket)
    .innerJoin(user, eq(supportTicket.userId, user.id))
    .orderBy(desc(supportTicket.updatedAt));
}

export async function getSupportTicketDetails(ticketId: string) {
  const ticket = await db
    .select({
      id: supportTicket.id,
      title: supportTicket.title,
      category: supportTicket.category,
      description: supportTicket.description,
      status: supportTicket.status,
      userId: supportTicket.userId,
      assigneeId: supportTicket.assigneeId,
      createdAt: supportTicket.createdAt,
      studentName: user.name,
      studentEmail: user.email,
    })
    .from(supportTicket)
    .innerJoin(user, eq(supportTicket.userId, user.id))
    .where(eq(supportTicket.id, ticketId));

  if (!ticket[0]) return null;

  const messages = await db
    .select({
      id: supportTicketMessage.id,
      message: supportTicketMessage.message,
      createdAt: supportTicketMessage.createdAt,
      senderName: user.name,
      senderRole: user.role,
    })
    .from(supportTicketMessage)
    .innerJoin(user, eq(supportTicketMessage.senderId, user.id))
    .where(eq(supportTicketMessage.ticketId, ticketId))
    .orderBy(supportTicketMessage.createdAt);

  return {
    ...ticket[0],
    messages,
  };
}

export async function updateTicketStatus(ticketId: string, status: string, assigneeId?: string) {
  await db
    .update(supportTicket)
    .set({
      status: status as any,
      ...(assigneeId !== undefined ? { assigneeId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(supportTicket.id, ticketId));
  return { success: true };
}

export async function replySupportTicket(ticketId: string, senderId: string, textMessage: string) {
  const id = nanoid();
  await db.transaction(async (tx) => {
    // 1. Thêm tin nhắn luồng chat
    await tx.insert(supportTicketMessage).values({
      id,
      ticketId,
      senderId,
      message: textMessage,
      createdAt: new Date(),
    });

    // 2. Chuyển ticket sang IN_PROGRESS nếu đang OPEN và người gửi là Admin/Teacher
    const sender = await tx.query.user.findFirst({
      where: eq(user.id, senderId),
    });

    const ticket = await tx.query.supportTicket.findFirst({
      where: eq(supportTicket.id, ticketId),
    });

    if (ticket && ticket.status === "OPEN" && sender && sender.role === "admin") {
      await tx
        .update(supportTicket)
        .set({
          status: "IN_PROGRESS",
          updatedAt: new Date(),
        })
        .where(eq(supportTicket.id, ticketId));
    }
  });

  return { success: true };
}

// ─── 6. AUDIT & BAN SECURITY CONTROL ───────────────────────────────────────

export async function banUser(
  targetUserId: string,
  reason: string,
  adminId: string,
  adminEmail: string,
  adminRole: string,
  ipAddress?: string,
  userAgent?: string,
) {
  const target = await db.query.user.findFirst({
    where: eq(user.id, targetUserId),
  });

  if (!target) throw new Error("Người dùng không tồn tại");
  if (target.role === "admin") throw new Error("Không thể khóa tài khoản có quyền Admin");

  await db.transaction(async (tx) => {
    // 1. Khóa tài khoản
    await tx
      .update(user)
      .set({
        status: "BANNED",
        banReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(user.id, targetUserId));

    // 2. Thu hồi toàn bộ Session hoạt động tức thời
    await tx.delete(session).where(eq(session.userId, targetUserId));

    // 3. Ghi chép Admin Audit Log
    await tx.insert(adminAuditLog).values({
      id: nanoid(),
      adminId,
      adminEmail,
      adminRole,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      action: "BAN_USER",
      oldPayload: JSON.stringify({ userId: targetUserId, status: target.status, banReason: target.banReason }),
      newPayload: JSON.stringify({ userId: targetUserId, status: "BANNED", banReason: reason }),
      createdAt: new Date(),
    });
  });

  return { success: true };
}

export async function unbanUser(
  targetUserId: string,
  adminId: string,
  adminEmail: string,
  adminRole: string,
  ipAddress?: string,
  userAgent?: string,
) {
  const target = await db.query.user.findFirst({
    where: eq(user.id, targetUserId),
  });

  if (!target) throw new Error("Người dùng không tồn tại");

  await db.transaction(async (tx) => {
    // 1. Mở khóa tài khoản
    await tx
      .update(user)
      .set({
        status: "ACTIVE",
        banReason: null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, targetUserId));

    // 2. Ghi chép Admin Audit Log
    await tx.insert(adminAuditLog).values({
      id: nanoid(),
      adminId,
      adminEmail,
      adminRole,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      action: "UNBAN_USER",
      oldPayload: JSON.stringify({ userId: targetUserId, status: target.status, banReason: target.banReason }),
      newPayload: JSON.stringify({ userId: targetUserId, status: "ACTIVE", banReason: null }),
      createdAt: new Date(),
    });
  });

  return { success: true };
}

export async function getSystemSettings() {
  const settings = await db.query.systemSetting.findMany();
  return settings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);
}

export async function updateSystemSetting(
  key: string,
  value: string,
  adminId: string,
  adminEmail: string,
  adminRole: string,
) {
  const existing = await db.query.systemSetting.findFirst({
    where: eq(systemSetting.key, key),
  });

  await db.transaction(async (tx) => {
    if (existing) {
      await tx
        .update(systemSetting)
        .set({ value, updatedAt: new Date() })
        .where(eq(systemSetting.key, key));
    } else {
      await tx.insert(systemSetting).values({
        key,
        value,
        updatedAt: new Date(),
      });
    }

    await tx.insert(adminAuditLog).values({
      id: nanoid(),
      adminId,
      adminEmail,
      adminRole,
      action: "UPDATE_SYSTEM_SETTING",
      oldPayload: existing ? JSON.stringify({ key, value: existing.value }) : null,
      newPayload: JSON.stringify({ key, value }),
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

export async function getAdminAuditLogs() {
  return db.query.adminAuditLog.findMany({
    orderBy: [desc(adminAuditLog.createdAt)],
    limit: 100,
  });
}

// ─── 7. COURSE / MODULE / LESSON CRUD ──────────────────────────────────────

export async function createCourse(data: {
  title: string;
  description?: string;
  level: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}) {
  const id = nanoid();
  await db.insert(course).values({
    id,
    title: data.title,
    description: data.description ?? null,
    level: data.level,
    status: data.status,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}

export async function updateCourse(
  id: string,
  data: {
    title?: string;
    description?: string;
    level?: string;
    status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  }
) {
  await db
    .update(course)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(course.id, id));
  return { success: true };
}

export async function deleteCourse(id: string) {
  // Check if course has modules/lessons
  const modulesInCourse = await db
    .select()
    .from(module)
    .where(eq(module.courseId, id));
  if (modulesInCourse.length > 0) {
    throw new Error("Không thể xóa khóa học đã có Chương hoặc Bài học bên trong");
  }
  await db.delete(course).where(eq(course.id, id));
  return { success: true };
}

export async function getModules(courseId: string) {
  return db
    .select()
    .from(module)
    .where(eq(module.courseId, courseId))
    .orderBy(module.orderIndex);
}

export async function createModule(data: {
  courseId: string;
  title: string;
  description?: string;
}) {
  // Get current max orderIndex
  const existing = await db
    .select({ maxOrder: sql<number>`max(${module.orderIndex})` })
    .from(module)
    .where(eq(module.courseId, data.courseId));
  const maxOrder = existing[0]?.maxOrder ?? -1;

  const id = nanoid();
  await db.insert(module).values({
    id,
    courseId: data.courseId,
    title: data.title,
    orderIndex: maxOrder + 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}

export async function updateModule(
  id: string,
  data: { title?: string; description?: string }
) {
  await db
    .update(module)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(module.id, id));
  return { success: true };
}

export async function deleteModule(id: string) {
  await db.delete(module).where(eq(module.id, id));
  return { success: true };
}

export async function getLessons(moduleId: string) {
  const lessons = await db
    .select()
    .from(lesson)
    .where(eq(lesson.moduleId, moduleId))
    .orderBy(lesson.orderIndex);

  if (lessons.length === 0) return lessons;

  // Fetch all lessonVideo records for these lessons
  const allVideos = await db.select().from(lessonVideo);
  const videoByLessonId: Record<string, (typeof allVideos)[0]> = {};
  for (const v of allVideos) {
    if (lessons.some((l) => l.id === v.lessonId)) {
      videoByLessonId[v.lessonId] = v;
    }
  }

  // Merge video data into lessons
  return lessons.map((l) => ({
    ...l,
    videoUrl: videoByLessonId[l.id]?.cloudinaryUrl ?? null,
    videoPublicId: videoByLessonId[l.id]?.cloudinaryPublicId ?? null,
  }));
}

export async function createLesson(data: {
  moduleId: string;
  title: string;
  hasRead?: boolean;
  hasWrite?: boolean;
  hasVideo?: boolean;
  videoUrl?: string;
}) {
  const existing = await db
    .select({ maxOrder: sql<number>`max(${lesson.orderIndex})` })
    .from(lesson)
    .where(eq(lesson.moduleId, data.moduleId));
  const maxOrder = existing[0]?.maxOrder ?? -1;

  const id = nanoid();
  await db.insert(lesson).values({
    id,
    moduleId: data.moduleId,
    title: data.title,
    orderIndex: maxOrder + 1,
    hasRead: data.hasRead ?? false,
    hasWrite: data.hasWrite ?? false,
    hasVideo: data.hasVideo ?? false,
    hasQuiz: false,
    hasVocabulary: false,
    isRequired: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // If hasVideo, also create a lessonVideo entry
  if (data.hasVideo && data.videoUrl) {
    await db.insert(lessonVideo).values({
      id: nanoid(),
      lessonId: id,
      title: data.title,
      cloudinaryUrl: data.videoUrl,
      cloudinaryPublicId: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return id;
}

export async function updateLesson(
  id: string,
  data: {
    title?: string;
    hasRead?: boolean;
    hasWrite?: boolean;
    hasVideo?: boolean;
    videoUrl?: string;
  }
) {
  await db
    .update(lesson)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(lesson.id, id));

  // Update or create lessonVideo
  if (data.hasVideo !== undefined) {
    const existingVideo = await db
      .select()
      .from(lessonVideo)
      .where(eq(lessonVideo.lessonId, id));

    if (data.hasVideo && data.videoUrl) {
      if (existingVideo.length > 0) {
        await db
          .update(lessonVideo)
          .set({
            cloudinaryUrl: data.videoUrl,
            updatedAt: new Date(),
          })
          .where(eq(lessonVideo.lessonId, id));
      } else {
        const lessonData = await db
          .select()
          .from(lesson)
          .where(eq(lesson.id, id));
        await db.insert(lessonVideo).values({
          id: nanoid(),
          lessonId: id,
          title: lessonData[0]?.title ?? "",
          cloudinaryUrl: data.videoUrl,
          cloudinaryPublicId: "",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } else if (!data.hasVideo && existingVideo.length > 0) {
      await db.delete(lessonVideo).where(eq(lessonVideo.lessonId, id));
    }
  }

  return { success: true };
}

export async function deleteLesson(id: string) {
  await db.delete(lesson).where(eq(lesson.id, id));
  return { success: true };
}

// ─── 8. VOCABULARY CRUD ─────────────────────────────────────────────────────

export async function getVocabulary() {
  return db
    .select()
    .from(vocabulary)
    .orderBy(desc(vocabulary.createdAt));
}

export async function createVocabulary(data: {
  word: string;
  partOfSpeech: string;
  phonetic?: string;
  meaning: string;
  examples?: string;
  overwrite?: boolean;
}) {
  if (data.overwrite) {
    // Find existing by word + partOfSpeech
    const existing = await db
      .select({ id: vocabulary.id })
      .from(vocabulary)
      .where(
        and(
          eq(vocabulary.word, data.word),
          eq(vocabulary.partOfSpeech, data.partOfSpeech)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(vocabulary)
        .set({
          phonetic: data.phonetic ?? null,
          meaning: data.meaning,
          examples: data.examples ?? null,
          updatedAt: new Date(),
        })
        .where(eq(vocabulary.id, existing[0].id));
      return existing[0].id;
    }
  }

  const id = nanoid();
  await db.insert(vocabulary).values({
    id,
    word: data.word,
    partOfSpeech: data.partOfSpeech,
    phonetic: data.phonetic ?? null,
    meaning: data.meaning,
    examples: data.examples ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}

export async function updateVocabulary(
  id: string,
  data: {
    word?: string;
    partOfSpeech?: string;
    phonetic?: string;
    meaning?: string;
    examples?: string;
  }
) {
  await db
    .update(vocabulary)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(vocabulary.id, id));
  return { success: true };
}

export async function deleteVocabulary(id: string) {
  await db.delete(vocabulary).where(eq(vocabulary.id, id));
  return { success: true };
}

export async function bulkImportVocabulary(
  records: Array<{
    word: string;
    partOfSpeech: string;
    phonetic?: string;
    meaning: string;
    examples?: string;
  }>
) {
  const errors: Array<{ row: number; reason: string }> = [];
  let successCount = 0;

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    try {
      if (!rec.word || !rec.partOfSpeech || !rec.meaning) {
        errors.push({
          row: i + 2,
          reason: "Thiếu trường bắt buộc: word, partOfSpeech, hoặc meaning",
        });
        continue;
      }
      await db.insert(vocabulary).values({
        id: nanoid(),
        word: rec.word,
        partOfSpeech: rec.partOfSpeech,
        phonetic: rec.phonetic ?? null,
        meaning: rec.meaning,
        examples: rec.examples ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      successCount++;
    } catch (err: any) {
      if (err?.code === "23505") {
        errors.push({ row: i + 2, reason: "Trùng từ gốc + từ loại đã tồn tại" });
      } else {
        errors.push({
          row: i + 2,
          reason: err?.message ?? "Lỗi không xác định",
        });
      }
    }
  }

  return {
    success: successCount,
    failed: errors.length,
    errors,
  };
}

// ─── QUIZ CRUD ──────────────────────────────────────────────────────────────

export async function getQuizzes(lessonId: string) {
  return db
    .select()
    .from(quiz)
    .where(eq(quiz.lessonId, lessonId));
}

export async function createQuiz(lessonId: string) {
  const id = nanoid();
  await db.insert(quiz).values({
    id,
    lessonId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}

export async function deleteQuiz(id: string) {
  await db.delete(quiz).where(eq(quiz.id, id));
  return { success: true };
}

export async function getQuizQuestions(quizId: string) {
  return db
    .select()
    .from(quizQuestion)
    .where(eq(quizQuestion.quizId, quizId))
    .orderBy(quizQuestion.orderIndex);
}

export async function createQuizQuestion(data: {
  quizId: string;
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
}) {
  // Get max order
  const existing = await db
    .select({ maxOrder: sql<number>`max(${quizQuestion.orderIndex})` })
    .from(quizQuestion)
    .where(eq(quizQuestion.quizId, data.quizId));
  const maxOrder = existing[0]?.maxOrder ?? -1;

  const id = nanoid();
  await db.insert(quizQuestion).values({
    id,
    quizId: data.quizId,
    question: data.question,
    options: JSON.stringify(data.options),
    correctOption: data.correctOption,
    explanation: data.explanation,
    orderIndex: maxOrder + 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}

export async function updateQuizQuestion(
  id: string,
  data: {
    question?: string;
    options?: string[];
    correctOption?: number;
    explanation?: string;
  }
) {
  const { options: optionsArr, ...rest } = data;
  await db
    .update(quizQuestion)
    .set({
      ...rest,
      ...(optionsArr !== undefined ? { options: JSON.stringify(optionsArr) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(quizQuestion.id, id));
  return { success: true };
}

export async function deleteQuizQuestion(id: string) {
  await db.delete(quizQuestion).where(eq(quizQuestion.id, id));
  return { success: true };
}
