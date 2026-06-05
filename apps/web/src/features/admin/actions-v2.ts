"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/features/learning-content/types";
import * as adminService from "./services/admin-v2.service";

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

  if (session.user.role !== "admin") {
    throw new Error("Không có quyền thực hiện thao tác này");
  }

  return session.user as AdminUser;
}

export async function adminGetDashboardOverviewAction() {
  await requireAdmin();
  try {
    const data = await adminService.getAdminCourseDashboard();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy dashboard" };
  }
}

export async function adminGetCoursesAction() {
  await requireAdmin();
  try {
    const data = await adminService.getAdminCourses();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy danh sách khóa học" };
  }
}

export async function adminGetCourseContentWorkspaceAction(courseId: string) {
  await requireAdmin();
  try {
    const data = await adminService.getAdminCourseContentWorkspace(courseId);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy workspace nội dung" };
  }
}

export async function adminCreateCourseAction(data: {
  title: string;
  description?: string;
  level: string;
  thumbnailUrl?: string;
  certificateTemplateUrl?: string;
  isFree?: boolean;
  originalPrice?: number;
  sellingPrice?: number;
  accessDurationDays?: number | null;
}): Promise<ActionResult> {
  await requireAdmin();
  try {
    const created = await adminService.createAdminCourse(data);
    revalidatePath("/admin");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/courses");
    return { success: true, data: created };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi tạo khóa học" };
  }
}

export async function adminUpdateCourseAction(data: {
  id: string;
  title?: string;
  description?: string;
  level?: string;
  thumbnailUrl?: string;
  certificateTemplateUrl?: string;
  isFree?: boolean;
  originalPrice?: number;
  sellingPrice?: number;
  accessDurationDays?: number | null;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}): Promise<ActionResult> {
  await requireAdmin();
  try {
    const updated = await adminService.updateAdminCourse(data.id, data);
    revalidatePath("/admin");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/courses");
    revalidatePath(`/admin/courses/${data.id}/content`);
    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi cập nhật khóa học" };
  }
}

export async function adminDeleteCourseAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const deleted = await adminService.deleteAdminCourse(id);
    revalidatePath("/admin");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/courses");
    return { success: true, data: deleted };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Không thể xóa khóa học" };
  }
}

export async function adminPublishCourseAction(courseId: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const data = await adminService.publishAdminCourse(courseId);
    revalidatePath("/admin");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/courses");
    revalidatePath(`/admin/courses/${courseId}/content`);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi publish khóa học" };
  }
}

export async function adminUnpublishCourseAction(courseId: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const data = await adminService.unpublishAdminCourse(courseId);
    revalidatePath("/admin");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/courses");
    revalidatePath(`/admin/courses/${courseId}/content`);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi chuyển khóa học về draft" };
  }
}

export async function adminArchiveCourseAction(courseId: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const data = await adminService.archiveAdminCourse(courseId);
    revalidatePath("/admin");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/courses");
    revalidatePath(`/admin/courses/${courseId}/content`);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi archive khóa học" };
  }
}

export async function adminCreateModuleAction(data: {
  courseId: string;
  title: string;
  description?: string;
}): Promise<ActionResult> {
  await requireAdmin();
  try {
    const created = await adminService.createAdminModule(data);
    revalidatePath("/admin/courses");
    revalidatePath(`/admin/courses/${data.courseId}/content`);
    return { success: true, data: created };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi tạo chương học" };
  }
}

export async function adminUpdateModuleAction(data: {
  id: string;
  title?: string;
  description?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  courseId?: string;
}): Promise<ActionResult> {
  await requireAdmin();
  try {
    const updated = await adminService.updateAdminModule(data.id, data);
    revalidatePath("/admin/courses");
    if (data.courseId) revalidatePath(`/admin/courses/${data.courseId}/content`);
    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi cập nhật chương học" };
  }
}

export async function adminDeleteModuleAction(id: string, courseId?: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const deleted = await adminService.deleteAdminModule(id);
    revalidatePath("/admin/courses");
    if (courseId) revalidatePath(`/admin/courses/${courseId}/content`);
    return { success: true, data: deleted };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi xóa chương học" };
  }
}

export async function adminCreateLessonAction(data: {
  moduleId: string;
  title: string;
  description?: string;
  hasRead?: boolean;
  hasWrite?: boolean;
  hasQuiz?: boolean;
  hasVideo?: boolean;
  hasVocabulary?: boolean;
  isRequired?: boolean;
  courseId?: string;
}): Promise<ActionResult> {
  await requireAdmin();
  try {
    const created = await adminService.createAdminLesson(data);
    revalidatePath("/admin/courses");
    if (data.courseId) revalidatePath(`/admin/courses/${data.courseId}/content`);
    return { success: true, data: created };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi tạo bài học" };
  }
}

export async function adminUpdateLessonAction(data: {
  id: string;
  title?: string;
  description?: string;
  hasRead?: boolean;
  hasWrite?: boolean;
  hasQuiz?: boolean;
  hasVideo?: boolean;
  hasVocabulary?: boolean;
  isRequired?: boolean;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  courseId?: string;
}): Promise<ActionResult> {
  await requireAdmin();
  try {
    const updated = await adminService.updateAdminLesson(data.id, data);
    revalidatePath("/admin/courses");
    if (data.courseId) revalidatePath(`/admin/courses/${data.courseId}/content`);
    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi cập nhật bài học" };
  }
}

export async function adminDeleteLessonAction(id: string, courseId?: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const deleted = await adminService.deleteAdminLesson(id);
    revalidatePath("/admin/courses");
    if (courseId) revalidatePath(`/admin/courses/${courseId}/content`);
    return { success: true, data: deleted };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi xóa bài học" };
  }
}

export async function adminUpsertLessonReadAction(data: {
  lessonId: string;
  title: string;
  content: string;
  keywords?: string;
  learningObjectives?: string;
  courseId?: string;
}): Promise<ActionResult> {
  await requireAdmin();
  try {
    const saved = await adminService.upsertAdminLessonRead(data.lessonId, data);
    revalidatePath("/admin/courses");
    if (data.courseId) revalidatePath(`/admin/courses/${data.courseId}/content`);
    return { success: true, data: saved };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lưu nội dung đọc" };
  }
}

export async function adminUpsertLessonWriteAction(data: {
  lessonId: string;
  prompt: string;
  gradingCriteria?: string;
  wordCountGuidance?: number;
  aiPromptId?: string;
  maxAiRevisions?: number;
  courseId?: string;
}): Promise<ActionResult> {
  await requireAdmin();
  try {
    const saved = await adminService.upsertAdminLessonWrite(data.lessonId, data);
    revalidatePath("/admin/courses");
    if (data.courseId) revalidatePath(`/admin/courses/${data.courseId}/content`);
    return { success: true, data: saved };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lưu bài viết" };
  }
}

export async function adminUpsertLessonVideoAction(data: {
  lessonId: string;
  title: string;
  description?: string;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  durationSeconds?: number;
  courseId?: string;
}): Promise<ActionResult> {
  await requireAdmin();
  try {
    const saved = await adminService.upsertAdminLessonVideo(data.lessonId, data);
    revalidatePath("/admin/courses");
    if (data.courseId) revalidatePath(`/admin/courses/${data.courseId}/content`);
    return { success: true, data: saved };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lưu video bài học" };
  }
}

export async function adminUpsertLessonQuizAction(data: {
  lessonId: string;
  questions: Array<{
    question: string;
    options: string[];
    correctOption: number;
    explanation: string;
  }>;
  courseId?: string;
}): Promise<ActionResult> {
  await requireAdmin();
  try {
    const saved = await adminService.upsertAdminLessonQuiz(data.lessonId, {
      title: undefined,
      passingPercentage: null,
      questions: data.questions,
    });
    revalidatePath("/admin/courses");
    if (data.courseId) revalidatePath(`/admin/courses/${data.courseId}/content`);
    return { success: true, data: saved };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lưu quiz" };
  }
}

export async function adminGetModuleVocabularyAction(moduleId: string) {
  await requireAdmin();
  try {
    const data = await adminService.getAdminModuleVocabulary(moduleId);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy vocabulary theo chương" };
  }
}

export async function adminCreateModuleVocabularyAction(data: {
  moduleId: string;
  word: string;
  partOfSpeech: string;
  meaning: string;
  phonetic?: string;
  example?: string;
  notes?: string;
  courseId?: string;
}): Promise<ActionResult> {
  await requireAdmin();
  try {
    const created = await adminService.createAdminModuleVocabulary(data);
    revalidatePath("/admin/courses");
    if (data.courseId) revalidatePath(`/admin/courses/${data.courseId}/content`);
    return { success: true, data: created };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi tạo vocabulary" };
  }
}

export async function adminUpdateModuleVocabularyAction(data: {
  id: string;
  word?: string;
  partOfSpeech?: string;
  meaning?: string;
  phonetic?: string;
  example?: string;
  notes?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  courseId?: string;
}): Promise<ActionResult> {
  await requireAdmin();
  try {
    const updated = await adminService.updateAdminModuleVocabulary(data.id, data);
    revalidatePath("/admin/courses");
    if (data.courseId) revalidatePath(`/admin/courses/${data.courseId}/content`);
    return { success: true, data: updated };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi cập nhật vocabulary" };
  }
}

export async function adminDeleteModuleVocabularyAction(id: string, courseId?: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const deleted = await adminService.deleteAdminModuleVocabulary(id);
    revalidatePath("/admin/courses");
    if (courseId) revalidatePath(`/admin/courses/${courseId}/content`);
    return { success: true, data: deleted };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi xóa vocabulary" };
  }
}

export async function adminGetOrdersAction() {
  await requireAdmin();
  try {
    const data = await adminService.getAdminOrders();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy danh sách đơn hàng" };
  }
}

export async function adminGetOrderAnalyticsAction() {
  await requireAdmin();
  try {
    const data = await adminService.getAdminOrderAnalytics();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy phân tích đơn hàng" };
  }
}

export async function adminCreateManualOrderAction(
  userId: string,
  courseId: string,
  amount: number,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  try {
    const data = await adminService.createAdminManualOrder(userId, courseId, amount, admin.id);
    revalidatePath("/admin");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/orders");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi tạo đơn hàng thủ công" };
  }
}

export async function adminApproveOrderAction(orderId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  try {
    const data = await adminService.approveAdminOrder(orderId, admin.id);
    revalidatePath("/admin");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/orders");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi phê duyệt đơn hàng" };
  }
}

export async function adminRejectOrderAction(orderId: string, reason: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  try {
    const data = await adminService.rejectAdminOrder(orderId, reason, admin.id);
    revalidatePath("/admin");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/orders");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi từ chối đơn hàng" };
  }
}

export async function adminGetTransactionLogsAction() {
  await requireAdmin();
  try {
    const data = await adminService.getAdminTransactionLogs();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy transaction logs" };
  }
}

export async function adminGetReviewsAction() {
  await requireAdmin();
  try {
    const data = await adminService.getAdminReviews();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy danh sách đánh giá" };
  }
}

export async function adminReplyCourseReviewAction(reviewId: string, reply: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const data = await adminService.replyAdminCourseReview(reviewId, reply);
    revalidatePath("/admin/reviews");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi phản hồi đánh giá" };
  }
}

export async function adminUpdateCourseReviewStatusAction(
  reviewId: string,
  status: "VISIBLE" | "HIDDEN",
): Promise<ActionResult> {
  await requireAdmin();
  try {
    const data = await adminService.updateAdminCourseReviewStatus(reviewId, status);
    revalidatePath("/admin/reviews");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi cập nhật trạng thái đánh giá" };
  }
}

export async function adminGetSystemSettingsAction() {
  await requireAdmin();
  try {
    const data = await adminService.getAdminSystemSettings();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lấy cài đặt hệ thống" };
  }
}

export async function adminUpdateSystemSettingAction(key: string, value: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  try {
    await adminService.updateAdminSystemSetting(key, value, admin.id);
    revalidatePath("/admin/dashboard");
    return { success: true, data: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi cập nhật cài đặt" };
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
