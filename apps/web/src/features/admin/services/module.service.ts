import { db } from "@/db";
import { module, lesson, moduleVocabulary } from "@/db/schema/learning-content";
import { eq, asc, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { PublicationStatus } from "./course.service";
import {
  normalizeStatus,
  denormalizeStatus,
  serializeCourseRecord,
  ensureCourseExists,
} from "./course.service";

export type { PublicationStatus };

export interface AdminModuleInput {
  courseId: string;
  title: string;
  description?: string;
  status?: PublicationStatus;
  orderIndex?: number;
}

export function serializeModuleRecord<T extends { status?: string | null }>(record: T | null | undefined) {
  if (!record) return record;
  return {
    ...record,
    status: denormalizeStatus(record.status),
  };
}

function normalizeModulePayload(input: Partial<AdminModuleInput>) {
  return {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.status !== undefined ? { status: normalizeStatus(input.status) } : {}),
    ...(input.orderIndex !== undefined ? { orderIndex: input.orderIndex } : {}),
  };
}

export async function getModulesByCourse(courseId: string) {
  const modules = await db.query.module.findMany({
    where: eq(module.courseId, courseId),
    orderBy: [asc(module.orderIndex)],
  });
  return modules.map(serializeModuleRecord);
}

export async function getModuleById(moduleId: string) {
  return db.query.module.findFirst({ where: eq(module.id, moduleId) });
}

export async function ensureModuleExists(moduleId: string) {
  const existing = await db.query.module.findFirst({ where: eq(module.id, moduleId) });
  if (!existing) throw new Error("Chương học không tồn tại");
  return existing;
}

export async function createAdminModule(input: AdminModuleInput) {
  await ensureCourseExists(input.courseId);

  const existingModules = await db.query.module.findMany({
    where: eq(module.courseId, input.courseId),
    orderBy: [asc(module.orderIndex)],
  });

  const orderIndex = input.orderIndex ?? existingModules.length;

  const id = nanoid();
  const persistedStatus = normalizeStatus(input.status) ?? "DRAFT";

  await db.insert(module).values({
    id,
    courseId: input.courseId,
    title: input.title,
    description: input.description ?? null,
    status: persistedStatus,
    orderIndex,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return serializeModuleRecord(await db.query.module.findFirst({ where: eq(module.id, id) }));
}

export async function updateAdminModule(moduleId: string, input: Partial<AdminModuleInput>) {
  await db.update(module).set({
    ...normalizeModulePayload(input),
    updatedAt: new Date(),
  }).where(eq(module.id, moduleId));

  return serializeModuleRecord(await db.query.module.findFirst({ where: eq(module.id, moduleId) }));
}

export async function deleteAdminModule(moduleId: string) {
  const existingLessons = await db.query.lesson.findFirst({
    where: eq(lesson.moduleId, moduleId),
  });
  if (existingLessons) {
    throw new Error("Không thể xóa chương học đã có bài học bên trong");
  }

  await db.delete(module).where(eq(module.id, moduleId));
  return { id: moduleId };
}

export async function publishModulesByCourse(courseId: string) {
  await db.update(module)
    .set({ status: "PUBLISHED", updatedAt: new Date() })
    .where(eq(module.courseId, courseId));
}

export async function unpublishModulesByCourse(courseId: string) {
  await db.update(module)
    .set({ status: "DRAFT", updatedAt: new Date() })
    .where(eq(module.courseId, courseId));
}

export async function archiveModulesByCourse(courseId: string) {
  await db.update(module)
    .set({ status: "ARCHIVED", updatedAt: new Date() })
    .where(eq(module.courseId, courseId));
}
