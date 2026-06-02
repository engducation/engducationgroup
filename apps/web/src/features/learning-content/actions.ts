/**
 * Server Actions - Quản lý khóa học, module, lesson (Admin + Student)
 *
 * Tuân thủ Vercel React Best Practices:
 * - Authenticate Server Actions như API Routes (Section 3.1)
 * - Không có async waterfalls
 * - Server Actions coi như public endpoint, luôn xác thực bên trong
 *
 * Auth: Dùng auth.api.getSession() với headers động của better-auth.
 */

"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/features/learning-content/types";
import * as courseService from "./services/course.service";
import * as lessonService from "./services/lesson.service";
import * as quizService from "./services/quiz.service";
import {
  createCourseSchema,
  updateCourseSchema,
  createModuleSchema,
  updateModuleSchema,
  reorderModulesSchema,
  createLessonSchema,
  updateLessonSchema,
  reorderLessonsSchema,
  createReadSchema,
  createWriteSchema,
  createLessonVideoSchema,
} from "./types/schemas";

// ─── Auth Guard ─────────────────────────────────────────────────────────────

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

async function requireAdmin(): Promise<string> {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  // @ts-expect-error - role may be injected via custom better-auth plugin
  if (session.user.role !== "admin") throw new Error("Không có quyền thực hiện thao tác này");
  return session.user.id;
}

async function requireAuth(): Promise<string> {
  const session = await getSession();
  if (!session?.user) redirect("/login");
  return session.user.id;
}

function zodIssues(err: { issues: Array<{ message: string }> }): string[] {
  return err.issues.map((e) => e.message);
}

// ─── Course Actions (Admin) ─────────────────────────────────────────────────

export async function adminCreateCourse(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = createCourseSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", details: zodIssues(parsed.error) };
  }
  const result = await courseService.createCourse(parsed.data);
  revalidatePath("/admin/courses");
  return { success: true, data: result };
}

export async function adminUpdateCourse(courseId: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = updateCourseSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", details: zodIssues(parsed.error) };
  }
  const result = await courseService.updateCourse(courseId, parsed.data);
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
  return result;
}

export async function adminDeleteCourse(courseId: string): Promise<ActionResult> {
  await requireAdmin();
  const result = await courseService.deleteCourse(courseId);
  revalidatePath("/admin/courses");
  return result;
}

export async function adminPublishCourse(courseId: string): Promise<ActionResult> {
  await requireAdmin();
  const result = await courseService.publishCourse(courseId);
  revalidatePath("/admin/courses");
  return result;
}

export async function adminArchiveCourse(courseId: string): Promise<ActionResult> {
  await requireAdmin();
  const result = await courseService.archiveCourse(courseId);
  revalidatePath("/admin/courses");
  return result;
}

export async function adminUnpublishCourse(courseId: string): Promise<ActionResult> {
  await requireAdmin();
  const result = await courseService.unpublishCourse(courseId);
  revalidatePath("/admin/courses");
  return result;
}

// ─── Module Actions (Admin) ─────────────────────────────────────────────────

export async function adminCreateModule(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = createModuleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", details: zodIssues(parsed.error) };
  }
  const result = await courseService.createModule(parsed.data);
  revalidatePath("/admin/courses");
  return result;
}

export async function adminUpdateModule(moduleId: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = updateModuleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", details: zodIssues(parsed.error) };
  }
  const result = await courseService.updateModule(moduleId, parsed.data);
  revalidatePath("/admin/courses");
  return result;
}

export async function adminDeleteModule(moduleId: string): Promise<ActionResult> {
  await requireAdmin();
  const result = await courseService.deleteModule(moduleId);
  revalidatePath("/admin/courses");
  return result;
}

export async function adminReorderModules(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = reorderModulesSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", details: zodIssues(parsed.error) };
  }
  return courseService.reorderModules(parsed.data);
}

// ─── Lesson Actions (Admin) ─────────────────────────────────────────────────

export async function adminCreateLesson(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = createLessonSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", details: zodIssues(parsed.error) };
  }
  const result = await courseService.createLesson(parsed.data);
  revalidatePath("/admin/courses");
  return result;
}

export async function adminUpdateLesson(lessonId: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = updateLessonSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", details: zodIssues(parsed.error) };
  }
  const result = await courseService.updateLesson(lessonId, parsed.data);
  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/lessons/${lessonId}`);
  return result;
}

export async function adminDeleteLesson(lessonId: string): Promise<ActionResult> {
  await requireAdmin();
  const result = await courseService.deleteLesson(lessonId);
  revalidatePath("/admin/courses");
  return result;
}

export async function adminReorderLessons(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = reorderLessonsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", details: zodIssues(parsed.error) };
  }
  return courseService.reorderLessons(parsed.data);
}

// ─── Read Actions (Admin) ───────────────────────────────────────────────────

export async function adminUpsertRead(lessonId: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = createReadSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", details: zodIssues(parsed.error) };
  }
  const result = await courseService.upsertRead(lessonId, parsed.data);
  revalidatePath(`/admin/courses/lessons/${lessonId}`);
  return result;
}

export async function adminDeleteRead(lessonId: string): Promise<ActionResult> {
  await requireAdmin();
  const result = await courseService.deleteRead(lessonId);
  revalidatePath(`/admin/courses/lessons/${lessonId}`);
  return result;
}

// ─── Write Actions (Admin) ─────────────────────────────────────────────────

export async function adminUpsertWrite(lessonId: string, input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = createWriteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", details: zodIssues(parsed.error) };
  }
  const result = await courseService.upsertWrite(lessonId, parsed.data);
  revalidatePath(`/admin/courses/lessons/${lessonId}`);
  return result;
}

export async function adminDeleteWrite(lessonId: string): Promise<ActionResult> {
  await requireAdmin();
  const result = await courseService.deleteWrite(lessonId);
  revalidatePath(`/admin/courses/lessons/${lessonId}`);
  return result;
}

// ─── Quiz Actions (Admin) ──────────────────────────────────────────────────

export async function adminUpsertQuizWithQuestions(
  lessonId: string,
  questions: unknown[],
): Promise<ActionResult> {
  await requireAdmin();
  try {
    const { quizQuestionSchema } = await import("./types/schemas");
    const { upsertQuizWithQuestions } = await import("./services/quiz.service");
    const parsed = questions.map((q) => quizQuestionSchema.parse(q));
    const { quizId } = await upsertQuizWithQuestions(lessonId, parsed);
    revalidatePath(`/admin/courses/lessons/${lessonId}`);
    return { success: true, data: { quizId } };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Lỗi khi lưu Quiz" };
  }
}

// ─── Lesson Video Actions (Admin) ──────────────────────────────────────────

export async function adminUpsertLessonVideo(
  lessonId: string,
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = createLessonVideoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", details: zodIssues(parsed.error) };
  }
  const result = await courseService.upsertLessonVideo(lessonId, parsed.data);
  revalidatePath(`/admin/courses/lessons/${lessonId}`);
  return result;
}

export async function adminDeleteLessonVideo(lessonId: string): Promise<ActionResult> {
  await requireAdmin();
  const result = await courseService.deleteLessonVideo(lessonId);
  revalidatePath(`/admin/courses/lessons/${lessonId}`);
  return result;
}

// ─── Student Actions ────────────────────────────────────────────────────────

export async function getPublishedCourses() {
  await requireAuth();
  const { getPublishedCourses: getPublished } = await import("./services/course.service");
  return getPublished();
}

export async function getLessonForStudent(lessonId: string) {
  await requireAuth();
  const lessonData = await lessonService.getLessonForStudent(lessonId);
  if (!lessonData) return null;
  const isVisible = await courseService.isContentVisibleForUser(lessonData.moduleId);
  if (!isVisible) return null;
  return lessonData;
}

export async function getCourseProgressSummary(courseId: string) {
  const userId = await requireAuth();
  return courseService.getCourseProgressSummary(userId, courseId);
}

export async function submitQuizAction(
  quizId: string,
  answers: Record<string, number>,
) {
  await requireAuth();
  const { submitQuiz } = await import("./services/quiz.service");
  return submitQuiz({ userId: "", quizId, answers });
}

export async function getQuizAttemptsAction(userId: string, quizId: string) {
  await requireAuth();
  const { getQuizAttempts } = await import("./services/quiz.service");
  return getQuizAttempts(userId, quizId);
}

// ─── Progress Actions (Student) ─────────────────────────────────────────────

export async function updateStudentProgress(input: unknown): Promise<ActionResult> {
  const userId = await requireAuth();
  const { updateProgressSchema } = await import("./types/schemas");
  const parsed = updateProgressSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dữ liệu không hợp lệ", details: zodIssues(parsed.error) };
  }

  const { db } = await import("@/db");
  const { studentProgress } = await import("@/db/schema/learning-content");
  const { eq, and } = await import("drizzle-orm");
  const { nanoid } = await import("nanoid");

  const { lessonId } = parsed.data;
  const [existing] = await db
    .select({ id: studentProgress.id })
    .from(studentProgress)
    .where(and(eq(studentProgress.userId, userId), eq(studentProgress.lessonId, lessonId)));

  const now = new Date();

  if (existing) {
    await db
      .update(studentProgress)
      .set({
        readCompleted: parsed.data.readCompleted ?? false,
        writeCompleted: parsed.data.writeCompleted ?? false,
        quizCompleted: parsed.data.quizCompleted ?? false,
        videoCompleted: parsed.data.videoCompleted ?? false,
        vocabularyReviewed: parsed.data.vocabularyReviewed ?? false,
        updatedAt: now,
      })
      .where(eq(studentProgress.id, existing.id));
  } else {
    await db.insert(studentProgress).values({
      id: nanoid(),
      userId,
      lessonId,
      readCompleted: parsed.data.readCompleted ?? false,
      writeCompleted: parsed.data.writeCompleted ?? false,
      quizCompleted: parsed.data.quizCompleted ?? false,
      videoCompleted: parsed.data.videoCompleted ?? false,
      vocabularyReviewed: parsed.data.vocabularyReviewed ?? false,
    });
  }

  revalidatePath("/learn/courses");
  return { success: true, data: { lessonId } };
}
