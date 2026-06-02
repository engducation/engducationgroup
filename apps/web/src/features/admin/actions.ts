"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import type { ActionResult } from "@/features/learning-content/types";
import * as adminService from "./services/admin.service";

// ─── AUTH GUARD ─────────────────────────────────────────────────────────────

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role?: string | null;
}

async function requireAdmin(): Promise<AdminUser> {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  
  // @ts-expect-error - role is dynamically added to user session
  if (session.user.role !== "admin") {
    throw new Error("Không có quyền thực hiện thao tác này");
  }
  
  return session.user as AdminUser;
}

async function getClientContext() {
  const h = await headers();
  const ipAddress = h.get("x-forwarded-for") || h.get("x-real-ip") || "127.0.0.1";
  const userAgent = h.get("user-agent") || "Unknown";
  return { ipAddress, userAgent };
}

// ─── 1. AI PROMPT ACTIONS ──────────────────────────────────────────────────

export async function adminGetPromptsAction() {
  await requireAdmin();
  try {
    const data = await adminService.getPrompts();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi không xác định" };
  }
}

export async function adminUpsertPromptAction(input: {
  id: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  temperature: number;
  maxTokens: number;
}): Promise<ActionResult> {
  await requireAdmin();
  try {
    const existing = await adminService.getPrompts();
    const isUpdate = existing.some((p) => p.id === input.id);

    if (isUpdate) {
      await adminService.updatePrompt(input.id, {
        name: input.name,
        systemPrompt: input.systemPrompt,
        userPromptTemplate: input.userPromptTemplate,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
      });
    } else {
      await adminService.createPrompt(input);
    }

    revalidatePath("/admin/dashboard");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lưu Prompt" };
  }
}

export async function adminDeletePromptAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminService.deletePrompt(id);
    revalidatePath("/admin/dashboard");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi xóa Prompt" };
  }
}

// ─── 2. SYSTEM SETTING ACTIONS ─────────────────────────────────────────────

export async function adminUpdateGlobalLimitAction(limit: number): Promise<ActionResult> {
  const admin = await requireAdmin();
  try {
    await adminService.updateSystemSetting(
      "global_daily_limit",
      limit.toString(),
      admin.id,
      admin.email,
      admin.role || "admin",
    );
    revalidatePath("/admin/dashboard");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi cập nhật giới hạn" };
  }
}

export async function adminGetSystemSettingsAction() {
  await requireAdmin();
  try {
    const data = await adminService.getSystemSettings();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy cài đặt" };
  }
}

export async function adminGetAiCostAnalyticsAction() {
  await requireAdmin();
  try {
    const data = await adminService.getAiCostAnalytics();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy dữ liệu phân tích" };
  }
}

// ─── 3. ORDER ACTIONS ───────────────────────────────────────────────────────

export async function adminCreateManualOrderAction(
  userId: string,
  courseId: string,
  amount: number,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  try {
    const orderId = await adminService.createManualOrder(userId, courseId, amount, admin.id);
    revalidatePath("/admin/orders");
    return { success: true, data: { orderId } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi tạo đơn hàng thủ công" };
  }
}

export async function adminApproveOrderAction(orderId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  try {
    await adminService.approveOrder(orderId, admin.id);
    revalidatePath("/admin/orders");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi phê duyệt đơn hàng" };
  }
}

export async function adminRejectOrderAction(orderId: string, reason: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  try {
    await adminService.rejectOrder(orderId, reason, admin.id);
    revalidatePath("/admin/orders");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi từ chối đơn hàng" };
  }
}

export async function adminGetOrdersAction() {
  await requireAdmin();
  try {
    const data = await adminService.getOrders();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy danh sách đơn hàng" };
  }
}

export async function adminGetTransactionLogsAction() {
  await requireAdmin();
  try {
    const data = await adminService.getTransactionAuditLogs();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy log đối soát" };
  }
}

// ─── 4. SUPPORT & MODERATION ACTIONS ────────────────────────────────────────

export async function adminGetReviewTicketsAction() {
  await requireAdmin();
  try {
    const data = await adminService.getReviewTickets();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy phiếu khiếu nại" };
  }
}

export async function adminResolveWritingReviewAction(
  ticketId: string,
  score: number,
  feedback: string,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  try {
    await adminService.resolveWritingReview(ticketId, score, feedback, admin.id);
    revalidatePath("/admin/moderation");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi chấm điểm khiếu nại" };
  }
}

export async function adminGetSupportTicketsAction() {
  await requireAdmin();
  try {
    const data = await adminService.getSupportTickets();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy support tickets" };
  }
}

export async function adminGetSupportTicketDetailsAction(ticketId: string) {
  await requireAdmin();
  try {
    const data = await adminService.getSupportTicketDetails(ticketId);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy chi tiết support ticket" };
  }
}

export async function adminUpdateTicketStatusAction(
  ticketId: string,
  status: string,
  assigneeId?: string,
): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminService.updateTicketStatus(ticketId, status, assigneeId);
    revalidatePath("/admin/moderation");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi cập nhật trạng thái" };
  }
}

export async function adminReplyTicketAction(ticketId: string, message: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  try {
    await adminService.replySupportTicket(ticketId, admin.id, message);
    revalidatePath(`/admin/moderation`);
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi gửi phản hồi" };
  }
}

// ─── 5. USER SECURITY ACTIONS ───────────────────────────────────────────────

export async function adminBanUserAction(targetUserId: string, reason: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const { ipAddress, userAgent } = await getClientContext();
  try {
    await adminService.banUser(
      targetUserId,
      reason,
      admin.id,
      admin.email,
      admin.role || "admin",
      ipAddress,
      userAgent,
    );
    revalidatePath("/admin/users");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi khóa tài khoản" };
  }
}

export async function adminUnbanUserAction(targetUserId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  const { ipAddress, userAgent } = await getClientContext();
  try {
    await adminService.unbanUser(
      targetUserId,
      admin.id,
      admin.email,
      admin.role || "admin",
      ipAddress,
      userAgent,
    );
    revalidatePath("/admin/users");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi mở khóa tài khoản" };
  }
}

export async function adminGetUsersModerationAction() {
  await requireAdmin();
  try {
    const data = await adminService.getUsersWithModeration();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy danh sách người dùng" };
  }
}

export async function adminGetAuditLogsAction() {
  await requireAdmin();
  try {
    const data = await adminService.getAdminAuditLogs();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy audit logs" };
  }
}

export async function adminGetCoursesAction() {
  await requireAdmin();
  try {
    const { db } = await import("@/db");
    const { course } = await import("@/db/schema/learning-content");
    const data = await db.select().from(course).orderBy(desc(course.createdAt));
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy danh sách khóa học" };
  }
}

// ─── COURSE / MODULE / LESSON CRUD ─────────────────────────────────────────────

export async function adminCreateCourseAction(data: {
  title: string;
  description?: string;
  level: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminService.createCourse(data);
    revalidatePath("/admin/courses");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi tạo khóa học" };
  }
}

export async function adminUpdateCourseAction(data: {
  id: string;
  title?: string;
  description?: string;
  level?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminService.updateCourse(data.id, data);
    revalidatePath("/admin/courses");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi cập nhật khóa học" };
  }
}

export async function adminDeleteCourseAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminService.deleteCourse(id);
    revalidatePath("/admin/courses");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Không thể xóa khóa học có Module/Bài học" };
  }
}

export async function adminGetModulesAction(courseId: string) {
  await requireAdmin();
  try {
    const data = await adminService.getModules(courseId);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy danh sách Module" };
  }
}

export async function adminCreateModuleAction(data: {
  courseId: string;
  title: string;
  description?: string;
}): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminService.createModule(data);
    revalidatePath("/admin/courses");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi tạo Module" };
  }
}

export async function adminUpdateModuleAction(data: {
  id: string;
  title?: string;
  description?: string;
}): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminService.updateModule(data.id, data);
    revalidatePath("/admin/courses");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi cập nhật Module" };
  }
}

export async function adminDeleteModuleAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminService.deleteModule(id);
    revalidatePath("/admin/courses");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi xóa Module" };
  }
}

export async function adminGetLessonsAction(moduleId: string) {
  await requireAdmin();
  try {
    const data = await adminService.getLessons(moduleId);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy danh sách Bài học" };
  }
}

export async function adminCreateLessonAction(data: {
  moduleId: string;
  title: string;
  hasRead?: boolean;
  hasWrite?: boolean;
  hasVideo?: boolean;
  videoUrl?: string;
}): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminService.createLesson(data);
    revalidatePath("/admin/courses");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi tạo Bài học" };
  }
}

export async function adminUpdateLessonAction(data: {
  id: string;
  title?: string;
  hasRead?: boolean;
  hasWrite?: boolean;
  hasVideo?: boolean;
  videoUrl?: string;
}): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminService.updateLesson(data.id, data);
    revalidatePath("/admin/courses");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi cập nhật Bài học" };
  }
}

export async function adminDeleteLessonAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminService.deleteLesson(id);
    revalidatePath("/admin/courses");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi xóa Bài học" };
  }
}

// ─── VOCABULARY CRUD ─────────────────────────────────────────────────────────────

export async function adminGetVocabularyAction() {
  await requireAdmin();
  try {
    const data = await adminService.getVocabulary();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy danh sách từ vựng" };
  }
}

export async function adminCreateVocabularyAction(data: {
  word: string;
  partOfSpeech: string;
  phonetic?: string;
  meaning?: string;
  examples?: string;
  overwrite?: boolean;
}): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminService.createVocabulary(data as any);
    revalidatePath("/admin/vocabulary");
    return { success: true, data: null };
  } catch (err: any) {
    if (err?.code === "23505") {
      return { success: false, error: "Từ này đã tồn tại với cùng từ loại" };
    }
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi tạo từ vựng" };
  }
}

export async function adminUpdateVocabularyAction(data: {
  id: string;
  word?: string;
  partOfSpeech?: string;
  phonetic?: string;
  meaning?: string;
  examples?: string;
}): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminService.updateVocabulary(data.id, data);
    revalidatePath("/admin/vocabulary");
    return { success: true, data: null };
  } catch (err: any) {
    if (err?.code === "23505") {
      return { success: false, error: "Từ này đã tồn tại với cùng từ loại" };
    }
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi cập nhật từ vựng" };
  }
}

export async function adminDeleteVocabularyAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await adminService.deleteVocabulary(id);
    revalidatePath("/admin/vocabulary");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi xóa từ vựng" };
  }
}

export async function adminBulkImportVocabularyAction(
  records: Array<{
    word: string;
    partOfSpeech: string;
    phonetic?: string;
    meaning: string;
    examples?: string;
  }>
) {
  await requireAdmin();
  try {
    const result = await adminService.bulkImportVocabulary(records);
    revalidatePath("/admin/vocabulary");
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi nhập dữ liệu hàng loạt" };
  }
}

// ─── QUIZ CRUD ───────────────────────────────────────────────────────────────

export async function adminGetQuizzesAction(lessonId: string) {
  await requireAdmin();
  try {
    const data = await adminService.getQuizzes(lessonId);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy danh sách quiz" };
  }
}

export async function adminCreateQuizAction(lessonId: string) {
  await requireAdmin();
  try {
    const id = await adminService.createQuiz(lessonId);
    revalidatePath("/admin/quizzes");
    return { success: true, data: { id } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi tạo quiz" };
  }
}

export async function adminDeleteQuizAction(id: string) {
  await requireAdmin();
  try {
    await adminService.deleteQuiz(id);
    revalidatePath("/admin/quizzes");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi xóa quiz" };
  }
}

export async function adminGetQuizQuestionsAction(quizId: string) {
  await requireAdmin();
  try {
    const data = await adminService.getQuizQuestions(quizId);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy câu hỏi" };
  }
}

export async function adminCreateQuizQuestionAction(data: {
  quizId: string;
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
}) {
  await requireAdmin();
  try {
    const id = await adminService.createQuizQuestion(data);
    revalidatePath("/admin/quizzes");
    return { success: true, data: { id } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi tạo câu hỏi" };
  }
}

export async function adminUpdateQuizQuestionAction(
  id: string,
  data: {
    question?: string;
    options?: string[];
    correctOption?: number;
    explanation?: string;
  }
) {
  await requireAdmin();
  try {
    await adminService.updateQuizQuestion(id, data);
    revalidatePath("/admin/quizzes");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi cập nhật câu hỏi" };
  }
}

export async function adminDeleteQuizQuestionAction(id: string) {
  await requireAdmin();
  try {
    await adminService.deleteQuizQuestion(id);
    revalidatePath("/admin/quizzes");
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi xóa câu hỏi" };
  }
}

export async function adminGetAllCoursesForQuizAction() {
  await requireAdmin();
  try {
    const { db } = await import("@/db");
    const { course } = await import("@/db/schema/learning-content");
    const { desc } = await import("drizzle-orm");
    const data = await db.select().from(course).orderBy(desc(course.createdAt));
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy khóa học" };
  }
}
