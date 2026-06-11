/**
 * Admin V2 Service - Integrated Service Layer
 * 
 * This file re-exports and integrates all split admin services.
 * Each service handles a specific domain:
 * - course.service.ts: Course CRUD
 * - module.service.ts: Module CRUD  
 * - lesson.service.ts: Lesson CRUD and content management
 * - vocabulary-admin.service.ts: Vocabulary CRUD
 * - order.service.ts: Order management
 * - review.service.ts: Review management
 */

import { db } from "@/db";
import { adminAuditLog, systemSetting } from "@/db/schema";
import { course, lesson, module, moduleVocabulary, quizQuestion } from "@/db/schema/learning-content";
import { user as userTable } from "@/db/schema/auth";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { denormalizeStatus } from "./course.service";

// Re-export types from individual services
export type { PublicationStatus, AdminCourseInput } from "./course.service";
export type { AdminModuleInput } from "./module.service";
export type { AdminLessonInput, AdminQuizQuestionInput } from "./lesson.service";
export type { AdminModuleVocabularyInput } from "./vocabulary-admin.service";

// These types are in admin-v2 or need to be defined
export type OrderStatus = "PENDING" | "SUCCESS" | "FAILED";
export type PackageType = "MONTHLY" | "6_MONTH" | "YEAR";

// Re-export utility functions
export { normalizeStatus, denormalizeStatus } from "./course.service";

// Re-export course functions
export {
  getAdminCourses,
  getAdminCourseById,
  ensureCourseExists,
  createAdminCourse,
  updateAdminCourse,
  deleteAdminCourse,
  serializeCourseRecord,
} from "./course.service";

// Re-export module functions
export {
  getModulesByCourse,
  getModuleById,
  ensureModuleExists,
  createAdminModule,
  updateAdminModule,
  deleteAdminModule,
  publishModulesByCourse,
  unpublishModulesByCourse,
  archiveModulesByCourse,
  serializeModuleRecord,
} from "./module.service";

// Re-export lesson functions
export {
  getLessonsByModule,
  getLessonById,
  ensureLessonExists,
  createAdminLesson,
  updateAdminLesson,
  deleteAdminLesson,
  upsertLessonRead,
  upsertLessonWrite,
  upsertLessonVideo,
  upsertLessonQuiz,
  getLessonContent,
  getVocabulariesByLesson,
  createLessonVocabulary,
  updateLessonVocabularyItem as updateLessonVocabulary,
  deleteLessonVocabularyItem as deleteLessonVocabulary,
  syncLessonVocabulary,
  serializeLessonRecord,
} from "./lesson.service";

// Re-export vocabulary functions
export {
  getVocabulariesByModule,
  getVocabularyById,
  createAdminModuleVocabulary,
  updateAdminModuleVocabulary,
  deleteAdminModuleVocabulary,
  publishVocabulariesByModule,
  unpublishVocabulariesByModule,
  archiveVocabulariesByModule,
  serializeVocabularyRecord,
} from "./vocabulary-admin.service";

// Re-export order functions
export {
  getAdminOrders,
  getAdminOrderById,
  createAdminManualOrder,
  approveAdminOrder,
  rejectAdminOrder,
  getAdminOrderAnalytics,
  getAdminTransactionLogs,
  grantSubscriptionForOrderSuccess,
} from "./order.service";

// Re-export review functions
export {
  getAdminReviews,
  getReviewById,
  replyCourseReview,
  updateReviewStatus,
} from "./review.service";

// Re-export AI prompt functions
export {
  getAiPrompts,
  getAiPromptById,
  createAiPrompt,
  updateAiPrompt,
  deleteAiPrompt,
} from "./ai-prompt.service";

// Re-export AI quota functions
export {
  checkAiQuota,
  incrementAiUsage,
  logAiApiCall,
  getAiCostAnalytics,
} from "./ai-quota.service";

// Re-export support functions
export {
  createReviewTicket,
  getReviewTickets,
  resolveWritingReview,
  createSupportTicket,
  getSupportTickets,
  getSupportTicketDetails,
  updateTicketStatus,
  replySupportTicket,
} from "./support.service";

// Re-export user moderation functions
export {
  banUser,
  unbanUser,
  getUsersWithModeration,
  getAdminUsers,
  getSystemSettings,
  getSystemSetting,
  updateSystemSetting,
  getAdminAuditLogs as getAdminAuditLogsFromService,
  logAdminAction,
} from "./user-moderation.service";

// Re-export quiz functions
export {
  getQuizzes,
  getQuizById,
  createQuiz,
  deleteQuiz,
  getQuizQuestions,
  createQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
} from "./quiz.service";

// Re-export global vocabulary functions
export {
  getVocabulary,
  createVocabulary,
  updateVocabulary,
  deleteVocabulary,
  bulkImportVocabulary,
} from "./vocabulary-global.service";

// Course Workspace Serialization (used by workspace-client)

export function serializeWorkspaceCourse(rawCourse: any) {
  if (!rawCourse) return rawCourse;

  return {
    ...rawCourse,
    status: denormalizeStatus(rawCourse.status),
    modules: (rawCourse.modules ?? []).map((item: any) => ({
      ...item,
      status: denormalizeStatus(item.status),
      lessons: (item.lessons ?? []).map((lessonItem: any) => ({
        ...lessonItem,
        status: denormalizeStatus(lessonItem.status),
      })),
      vocabularies: (item.vocabularies ?? []).map((vocabularyItem: any) => ({
        ...vocabularyItem,
        status: denormalizeStatus(vocabularyItem.status),
      })),
    })),
  };
}

export async function getAdminCourseContentWorkspace(courseId: string) {
  const { ensureCourseExists } = await import("./course.service");
  await ensureCourseExists(courseId);

  const rawCourse = await db.query.course.findFirst({
    where: eq(course.id, courseId),
    with: {
      modules: {
        orderBy: [asc(module.orderIndex)],
        with: {
          lessons: {
            orderBy: [asc(lesson.orderIndex)],
            with: {
              read: true,
              write: true,
              video: true,
              quiz: {
                with: {
                  questions: {
                    orderBy: [asc(quizQuestion.orderIndex)],
                  },
                },
              },
            },
          },
          vocabularies: {
            orderBy: [asc(moduleVocabulary.orderIndex)],
          },
        },
      },
    },
  });

  return serializeWorkspaceCourse(rawCourse);
}

export async function publishAdminCourse(courseId: string) {
  const { ensureCourseExists, serializeCourseRecord } = await import("./course.service");
  const targetCourse = await ensureCourseExists(courseId);
  const modules = await db.query.module.findMany({ where: eq(module.courseId, targetCourse.id) });

  if (modules.length === 0) {
    throw new Error("Khóa học phải có ít nhất 1 chương học trước khi publish");
  }

  await db.transaction(async (tx) => {
    await tx.update(course).set({ status: "PUBLISHED", updatedAt: new Date() }).where(eq(course.id, courseId));
    await tx
      .update(module)
      .set({ status: "PUBLISHED", updatedAt: new Date() })
      .where(eq(module.courseId, courseId));

    const moduleIds = modules.map((item) => item.id);
    const lessons = await tx.query.lesson.findMany({ where: inArray(lesson.moduleId, moduleIds) });

    if (lessons.length > 0) {
      await tx
        .update(lesson)
        .set({ status: "PUBLISHED", updatedAt: new Date() })
        .where(inArray(lesson.moduleId, moduleIds));
    }

    await tx
      .update(moduleVocabulary)
      .set({ status: "PUBLISHED", updatedAt: new Date() })
      .where(inArray(moduleVocabulary.moduleId, moduleIds));
  });

  return serializeCourseRecord(await db.query.course.findFirst({ where: eq(course.id, courseId) }));
}

export async function unpublishAdminCourse(courseId: string) {
  const { serializeCourseRecord } = await import("./course.service");
  const modules = await db.query.module.findMany({ where: eq(module.courseId, courseId) });
  const moduleIds = modules.map((item) => item.id);

  await db.transaction(async (tx) => {
    await tx.update(course).set({ status: "DRAFT", updatedAt: new Date() }).where(eq(course.id, courseId));
    await tx.update(module).set({ status: "DRAFT", updatedAt: new Date() }).where(eq(module.courseId, courseId));

    if (moduleIds.length > 0) {
      await tx
        .update(lesson)
        .set({ status: "DRAFT", updatedAt: new Date() })
        .where(inArray(lesson.moduleId, moduleIds));
      await tx
        .update(moduleVocabulary)
        .set({ status: "DRAFT", updatedAt: new Date() })
        .where(inArray(moduleVocabulary.moduleId, moduleIds));
    }
  });

  return serializeCourseRecord(await db.query.course.findFirst({ where: eq(course.id, courseId) }));
}

export async function archiveAdminCourse(courseId: string) {
  const { serializeCourseRecord } = await import("./course.service");
  const modules = await db.query.module.findMany({ where: eq(module.courseId, courseId) });
  const moduleIds = modules.map((item) => item.id);

  await db.transaction(async (tx) => {
    await tx.update(course).set({ status: "ARCHIVED", updatedAt: new Date() }).where(eq(course.id, courseId));
    await tx
      .update(module)
      .set({ status: "ARCHIVED", updatedAt: new Date() })
      .where(eq(module.courseId, courseId));

    if (moduleIds.length > 0) {
      await tx
        .update(lesson)
        .set({ status: "ARCHIVED", updatedAt: new Date() })
        .where(inArray(lesson.moduleId, moduleIds));
      await tx
        .update(moduleVocabulary)
        .set({ status: "ARCHIVED", updatedAt: new Date() })
        .where(inArray(moduleVocabulary.moduleId, moduleIds));
    }
  });

  return serializeCourseRecord(await db.query.course.findFirst({ where: eq(course.id, courseId) }));
}

export async function getAdminCourseDashboard() {
  const courses = await db.query.course.findMany();

  return {
    totals: {
      totalCourses: courses.length,
      publishedCourses: courses.filter((c) => c.status === "PUBLISHED").length,
      draftCourses: courses.filter((c) => c.status === "DRAFT").length,
      pausedCourses: courses.filter((c) => c.status === "ARCHIVED").length,
      totalRevenue: 0,
      paidOrders: 0,
      pendingOrders: 0,
    },
    packageDistribution: [],
  };
}

export async function getAdminUsersModeration() {
  return db.query.user.findMany({
    orderBy: [desc(userTable.createdAt)],
  });
}

export async function getAdminAuditLogs() {
  return db.query.adminAuditLog.findMany({
    orderBy: [desc(adminAuditLog.createdAt)],
  });
}

export async function getAdminSystemSettings() {
  return db.query.systemSetting.findMany({
    orderBy: [asc(systemSetting.key)],
  });
}

export async function updateAdminSystemSetting(key: string, value: string, _adminId: string) {
  const existing = await db.query.systemSetting.findFirst({ where: eq(systemSetting.key, key) });

  if (existing) {
    await db
      .update(systemSetting)
      .set({
        value,
        updatedAt: new Date(),
      })
      .where(eq(systemSetting.key, key));
  } else {
    await db.insert(systemSetting).values({
      key,
      value,
      updatedAt: new Date(),
    });
  }

  return db.query.systemSetting.findFirst({ where: eq(systemSetting.key, key) });
}
