import { db } from "@/db";
import { course, module } from "@/db/schema/learning-content";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { PACKAGE_LABELS, PACKAGE_DURATIONS } from "@/db/schema";

export type PublicationStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "PAUSED";

export interface AdminCourseInput {
  title: string;
  description?: string;
  detailedDescription?: string;
  learningObjectives?: string;
  targetAudience?: string;
  level: string;
  language?: string;
  thumbnailUrl?: string;
  certificateTemplateUrl?: string;
  policyNotes?: string;
  status?: PublicationStatus;
}

export interface CourseStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  pausedCourses: number;
}

export function normalizeStatus(status?: PublicationStatus) {
  if (!status) return undefined;
  return status === "PAUSED" ? "ARCHIVED" : status;
}

export function denormalizeStatus(status?: string | null): PublicationStatus | null {
  if (!status) return null;
  return status === "ARCHIVED" ? "PAUSED" : (status as PublicationStatus);
}

export function serializeCourseRecord<T extends { status?: string | null }>(record: T | null | undefined) {
  if (!record) return record;
  return {
    ...record,
    status: denormalizeStatus(record.status),
  };
}

function normalizeCoursePayload(input: Partial<AdminCourseInput>) {
  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.detailedDescription !== undefined
      ? { certificateTemplateUrl: input.detailedDescription }
      : {}),
    ...(input.learningObjectives !== undefined
      ? { learningObjectives: input.learningObjectives }
      : {}),
    ...(input.targetAudience !== undefined ? { targetAudience: input.targetAudience } : {}),
    ...(input.level !== undefined ? { level: input.level } : {}),
    ...(input.language !== undefined ? { description: input.language } : {}),
    ...(input.thumbnailUrl !== undefined ? { thumbnailUrl: input.thumbnailUrl } : {}),
    ...(input.certificateTemplateUrl !== undefined
      ? { certificateTemplateUrl: input.certificateTemplateUrl }
      : {}),
    ...(input.status !== undefined ? { status: normalizeStatus(input.status) } : {}),
  };
}

export async function getCourseStats(): Promise<CourseStats> {
  const courses = await db.query.course.findMany();

  return {
    totalCourses: courses.length,
    publishedCourses: courses.filter((c) => c.status === "PUBLISHED").length,
    draftCourses: courses.filter((c) => c.status === "DRAFT").length,
    pausedCourses: courses.filter((c) => c.status === "ARCHIVED").length,
  };
}

export async function getAdminCourses() {
  return db.query.course.findMany({
    orderBy: [desc(course.createdAt)],
  });
}

export async function getAdminCourseById(courseId: string) {
  return db.query.course.findFirst({ where: eq(course.id, courseId) });
}

export async function ensureCourseExists(courseId: string) {
  const existing = await db.query.course.findFirst({ where: eq(course.id, courseId) });
  if (!existing) throw new Error("Khóa học không tồn tại");
  return existing;
}

export async function createAdminCourse(input: AdminCourseInput) {
  const id = nanoid();
  const persistedStatus = normalizeStatus(input.status) ?? "DRAFT";

  await db.insert(course).values({
    id,
    title: input.title,
    description: input.description ?? null,
    level: input.level,
    thumbnailUrl: input.thumbnailUrl ?? null,
    certificateTemplateUrl: input.certificateTemplateUrl ?? null,
    status: persistedStatus,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return serializeCourseRecord(await db.query.course.findFirst({ where: eq(course.id, id) }));
}

export async function updateAdminCourse(courseId: string, input: Partial<AdminCourseInput>) {
  await ensureCourseExists(courseId);

  await db
    .update(course)
    .set({
      ...normalizeCoursePayload(input),
      updatedAt: new Date(),
    })
    .where(eq(course.id, courseId));

  return serializeCourseRecord(await db.query.course.findFirst({ where: eq(course.id, courseId) }));
}

export async function deleteAdminCourse(courseId: string) {
  const existing = await db.query.module.findFirst({ where: eq(module.courseId, courseId) });
  if (existing) {
    throw new Error("Không thể xóa khóa học đã có chương học hoặc bài học bên trong");
  }

  await db.delete(course).where(eq(course.id, courseId));
  return { id: courseId };
}

export async function publishCourse(courseId: string) {
  const modules = await db.query.module.findMany({ where: eq(module.courseId, courseId) });

  if (modules.length === 0) {
    throw new Error("Khóa học phải có ít nhất 1 chương học trước khi publish");
  }

  await db.transaction(async (tx) => {
    await tx.update(course).set({ status: "PUBLISHED", updatedAt: new Date() }).where(eq(course.id, courseId));
  });

  return serializeCourseRecord(await db.query.course.findFirst({ where: eq(course.id, courseId) }));
}

export async function unpublishCourse(courseId: string) {
  await db.update(course).set({ status: "DRAFT", updatedAt: new Date() }).where(eq(course.id, courseId));

  return serializeCourseRecord(await db.query.course.findFirst({ where: eq(course.id, courseId) }));
}

export async function archiveCourse(courseId: string) {
  await db.update(course).set({ status: "ARCHIVED", updatedAt: new Date() }).where(eq(course.id, courseId));

  return serializeCourseRecord(await db.query.course.findFirst({ where: eq(course.id, courseId) }));
}
