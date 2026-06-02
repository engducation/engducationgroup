import { db } from "@/db";
import {
  course,
  module,
  lesson,
  read,
  write,
  lessonVideo,
  studentProgress,
} from "@/db/schema/learning-content";
import { eq, and, asc, sql, count } from "drizzle-orm";
import { nanoid } from "nanoid";
import type {
  CourseWithModules,
  ModuleWithLessons,
  LessonWithContent,
  CourseProgressSummary,
  ActionResult,
  CreateCourseInput,
  UpdateCourseInput,
  CreateModuleInput,
  UpdateModuleInput,
  ReorderModulesInput,
  CreateLessonInput,
  UpdateLessonInput,
  ReorderLessonsInput,
  CreateReadInput,
  CreateWriteInput,
  CreateLessonVideoInput,
} from "@/features/learning-content/types";
import { reorderLessonsInDb, reorderModulesInDb } from "./order.service";
import { deleteLessonContent } from "./lesson.service";

// ─── Course Service ──────────────────────────────────────────────────────────

export async function getPublishedCourses(): Promise<CourseWithModules[]> {
  const courses = await db.query.course.findMany({
    where: eq(course.status, "PUBLISHED"),
    orderBy: [asc(course.createdAt)],
    with: {
      modules: {
        orderBy: [asc(module.orderIndex)],
        with: {
          lessons: {
            orderBy: [asc(lesson.orderIndex)],
          },
        },
      },
    },
  });

  return courses as unknown as CourseWithModules[];
}

export async function getCourseById(courseId: string): Promise<CourseWithModules | null> {
  const result = await db.query.course.findFirst({
    where: eq(course.id, courseId),
    with: {
      modules: {
        orderBy: [asc(module.orderIndex)],
        with: {
          lessons: {
            orderBy: [asc(lesson.orderIndex)],
          },
        },
      },
    },
  });

  return result as unknown as CourseWithModules | null;
}

export async function getAllCoursesForAdmin() {
  return db.query.course.findMany({
    orderBy: [asc(course.createdAt)],
    with: {
      modules: {
        orderBy: [asc(module.orderIndex)],
        with: {
          lessons: {
            orderBy: [asc(lesson.orderIndex)],
          },
        },
      },
    },
  });
}

export async function createCourse(input: CreateCourseInput) {
  const id = nanoid();
  await db.insert(course).values({ id, ...input });
  return db.query.course.findFirst({ where: eq(course.id, id) });
}

export async function updateCourse(
  courseId: string,
  input: UpdateCourseInput,
): Promise<ActionResult> {
  const existing = await db.query.course.findFirst({ where: eq(course.id, courseId) });
  if (!existing) return { success: false, error: "Khóa học không tồn tại" };

  await db.update(course).set(input).where(eq(course.id, courseId));
  return { success: true, data: { id: courseId, ...input } };
}

export async function deleteCourse(courseId: string): Promise<ActionResult> {
  const [existing] = await db
    .select({ moduleCount: count() })
    .from(module)
    .where(eq(module.courseId, courseId));

  if (existing && existing.moduleCount > 0) {
    return {
      success: false,
      error: "Không thể xóa khóa học đang có Module. Vui lòng xóa Module trước.",
    };
  }

  const [lessonCount] = await db
    .select({ cnt: count() })
    .from(lesson)
    .innerJoin(module, eq(lesson.moduleId, module.id))
    .where(eq(module.courseId, courseId));

  if (lessonCount && lessonCount.cnt > 0) {
    return {
      success: false,
      error: "Khóa học đang chứa bài học. Không thể xóa.",
    };
  }

  await db.delete(course).where(eq(course.id, courseId));
  return { success: true, data: { id: courseId } };
}

// ─── Module Service ─────────────────────────────────────────────────────────

export async function createModule(input: CreateModuleInput): Promise<ActionResult> {
  const { courseId, title } = input;

  let orderIndex = input.orderIndex;
  if (orderIndex === undefined) {
    const [maxRow] = await db
      .select({ maxIdx: sql<number>`COALESCE(MAX(${module.orderIndex}), -1)` })
      .from(module)
      .where(eq(module.courseId, courseId));
    orderIndex = (maxRow?.maxIdx ?? -1) + 1;
  } else {
    const [conflict] = await db
      .select({ cnt: count() })
      .from(module)
      .where(and(eq(module.courseId, courseId), eq(module.orderIndex, orderIndex)));
    if (conflict && conflict.cnt > 0) {
      await reorderModulesInDb(courseId, orderIndex, "insert");
    }
  }

  const id = nanoid();
  await db.insert(module).values({ id, courseId, title, orderIndex });
  return { success: true, data: { id } };
}

export async function updateModule(
  moduleId: string,
  input: UpdateModuleInput,
): Promise<ActionResult> {
  const existing = await db.query.module.findFirst({ where: eq(module.id, moduleId) });
  if (!existing) return { success: false, error: "Module không tồn tại" };

  if (input.orderIndex !== undefined && input.orderIndex !== existing.orderIndex) {
    await reorderModulesInDb(existing.courseId, existing.orderIndex, "shift");
    await reorderModulesInDb(existing.courseId, input.orderIndex, "insert");
  }

  await db.update(module).set(input).where(eq(module.id, moduleId));
  return { success: true, data: { id: moduleId, ...input } };
}

export async function deleteModule(moduleId: string): Promise<ActionResult> {
  const existing = await db.query.module.findFirst({ where: eq(module.id, moduleId) });
  if (!existing) return { success: false, error: "Module không tồn tại" };

  const [lessonCnt] = await db
    .select({ cnt: count() })
    .from(lesson)
    .where(eq(lesson.moduleId, moduleId));

  if (lessonCnt && lessonCnt.cnt > 0) {
    return {
      success: false,
      error: "Không thể xóa Module đang chứa Lesson. Vui lòng xóa Lesson trước.",
    };
  }

  await db.delete(module).where(eq(module.id, moduleId));
  return { success: true, data: { id: moduleId } };
}

export async function reorderModules(input: ReorderModulesInput): Promise<ActionResult> {
  const { courseId, orderedIds } = input;
  await reorderModulesInDb(courseId, 0, "reorder", orderedIds);
  return { success: true, data: { courseId, orderedIds } };
}

// ─── Lesson Service ─────────────────────────────────────────────────────────

export async function createLesson(input: CreateLessonInput): Promise<ActionResult> {
  const { moduleId, title } = input;

  let orderIndex = input.orderIndex;
  if (orderIndex === undefined) {
    const [maxRow] = await db
      .select({ maxIdx: sql<number>`COALESCE(MAX(${lesson.orderIndex}), -1)` })
      .from(lesson)
      .where(eq(lesson.moduleId, moduleId));
    orderIndex = (maxRow?.maxIdx ?? -1) + 1;
  } else {
    const [conflict] = await db
      .select({ cnt: count() })
      .from(lesson)
      .where(and(eq(lesson.moduleId, moduleId), eq(lesson.orderIndex, orderIndex)));
    if (conflict && conflict.cnt > 0) {
      await reorderLessonsInDb(moduleId, orderIndex, "insert");
    }
  }

  const id = nanoid();
  const { moduleId: mId, title: t, orderIndex: o, ...rest } = input;
  await db.insert(lesson).values({ id, moduleId: mId, title: t, orderIndex, ...rest });
  return { success: true, data: { id } };
}

export async function updateLesson(
  lessonId: string,
  input: UpdateLessonInput,
): Promise<ActionResult> {
  const existing = await db.query.lesson.findFirst({ where: eq(lesson.id, lessonId) });
  if (!existing) return { success: false, error: "Bài học không tồn tại" };

  if (input.orderIndex !== undefined && input.orderIndex !== existing.orderIndex) {
    await reorderLessonsInDb(existing.moduleId, existing.orderIndex, "shift");
    await reorderLessonsInDb(existing.moduleId, input.orderIndex, "insert");
  }

  await db.update(lesson).set(input).where(eq(lesson.id, lessonId));
  return { success: true, data: { id: lessonId, ...input } };
}

export async function deleteLesson(lessonId: string): Promise<ActionResult> {
  const existing = await db.query.lesson.findFirst({ where: eq(lesson.id, lessonId) });
  if (!existing) return { success: false, error: "Bài học không tồn tại" };

  await deleteLessonContent(lessonId);
  await db.delete(lesson).where(eq(lesson.id, lessonId));
  return { success: true, data: { id: lessonId } };
}

export async function reorderLessons(input: ReorderLessonsInput): Promise<ActionResult> {
  const { moduleId, orderedIds } = input;
  await reorderLessonsInDb(moduleId, 0, "reorder", orderedIds);
  return { success: true, data: { moduleId, orderedIds } };
}

// ─── Read Service ────────────────────────────────────────────────────────────

export async function upsertRead(
  lessonId: string,
  input: CreateReadInput,
): Promise<ActionResult> {
  const existing = await db.query.read.findFirst({ where: eq(read.lessonId, lessonId) });
  if (existing) {
    await db.update(read).set(input).where(eq(read.lessonId, lessonId));
    return { success: true, data: { id: existing.id } };
  }
  const id = nanoid();
  const { lessonId: lId, ...rest } = input;
  await db.insert(read).values({ id, lessonId: lId, ...rest });
  return { success: true, data: { id } };
}

export async function deleteRead(lessonId: string): Promise<ActionResult> {
  await db.delete(read).where(eq(read.lessonId, lessonId));
  return { success: true, data: { lessonId } };
}

// ─── Write Service ──────────────────────────────────────────────────────────

export async function upsertWrite(
  lessonId: string,
  input: CreateWriteInput,
): Promise<ActionResult> {
  const existing = await db.query.write.findFirst({ where: eq(write.lessonId, lessonId) });
  if (existing) {
    await db.update(write).set(input).where(eq(write.lessonId, lessonId));
    return { success: true, data: { id: existing.id } };
  }
  const id = nanoid();
  const { lessonId: lId, ...rest } = input;
  await db.insert(write).values({ id, lessonId: lId, ...rest });
  return { success: true, data: { id } };
}

export async function deleteWrite(lessonId: string): Promise<ActionResult> {
  await db.delete(write).where(eq(write.lessonId, lessonId));
  return { success: true, data: { lessonId } };
}

// ─── Lesson Video Service ───────────────────────────────────────────────────

export async function upsertLessonVideo(
  lessonId: string,
  input: CreateLessonVideoInput,
): Promise<ActionResult> {
  const existing = await db.query.lessonVideo.findFirst({
    where: eq(lessonVideo.lessonId, lessonId),
  });
  if (existing) {
    await db.update(lessonVideo).set(input).where(eq(lessonVideo.lessonId, lessonId));
    return { success: true, data: { id: existing.id } };
  }
  const id = nanoid();
  const { lessonId: lId, ...rest } = input;
  await db.insert(lessonVideo).values({ id, lessonId: lId, ...rest });
  return { success: true, data: { id } };
}

export async function deleteLessonVideo(lessonId: string): Promise<ActionResult> {
  await db.delete(lessonVideo).where(eq(lessonVideo.lessonId, lessonId));
  return { success: true, data: { lessonId } };
}

// ─── Course Publication ─────────────────────────────────────────────────────

export async function publishCourse(courseId: string): Promise<ActionResult> {
  const [existing] = await db
    .select({ modules: sql<string>`COUNT(*)` })
    .from(module)
    .where(eq(module.courseId, courseId));

  if (!existing || Number(existing.modules) === 0) {
    return {
      success: false,
      error: "Khóa học phải có ít nhất 1 Module trước khi xuất bản.",
    };
  }

  await db.update(course).set({ status: "PUBLISHED" }).where(eq(course.id, courseId));
  return { success: true, data: { id: courseId, status: "PUBLISHED" } };
}

export async function archiveCourse(courseId: string): Promise<ActionResult> {
  await db.update(course).set({ status: "ARCHIVED" }).where(eq(course.id, courseId));
  return { success: true, data: { id: courseId, status: "ARCHIVED" } };
}

export async function unpublishCourse(courseId: string): Promise<ActionResult> {
  await db.update(course).set({ status: "DRAFT" }).where(eq(course.id, courseId));
  return { success: true, data: { id: courseId, status: "DRAFT" } };
}

// ─── Progress Summary ───────────────────────────────────────────────────────

export async function getCourseProgressSummary(
  userId: string,
  courseId: string,
): Promise<CourseProgressSummary> {
  const [totalRow] = await db
    .select({ cnt: count() })
    .from(lesson)
    .innerJoin(module, eq(lesson.moduleId, module.id))
    .where(eq(module.courseId, courseId));

  const totalLessons = Number(totalRow?.cnt ?? 0);

  const completedRows = await db
    .select({ cnt: count() })
    .from(studentProgress)
    .innerJoin(lesson, eq(studentProgress.lessonId, lesson.id))
    .innerJoin(module, eq(lesson.moduleId, module.id))
    .where(
      and(
        eq(studentProgress.userId, userId),
        eq(module.courseId, courseId),
        sql`${studentProgress.completedAt} IS NOT NULL`,
      ),
    );

  const completedLessons = Number(completedRows[0]?.cnt ?? 0);
  const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const [lastActivity] = await db
    .select({ lastAt: studentProgress.updatedAt })
    .from(studentProgress)
    .innerJoin(lesson, eq(studentProgress.lessonId, lesson.id))
    .innerJoin(module, eq(lesson.moduleId, module.id))
    .where(and(eq(module.courseId, courseId), eq(studentProgress.userId, userId)))
    .orderBy(sql`${studentProgress.updatedAt} DESC`)
    .limit(1);

  return {
    courseId,
    totalLessons,
    completedLessons,
    percentage,
    lastActivityAt: lastActivity?.lastAt ?? null,
  };
}

// ─── Visibility Guard ────────────────────────────────────────────────────────

export async function isContentVisibleForUser(courseId: string): Promise<boolean> {
  const [row] = await db.select({ status: course.status }).from(course).where(eq(course.id, courseId));
  return row?.status === "PUBLISHED";
}
