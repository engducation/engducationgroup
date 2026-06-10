import { db } from "@/db";
import { moduleVocabulary, lesson, module } from "@/db/schema/learning-content";
import { eq, asc, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { PublicationStatus } from "./course.service";
import { normalizeStatus, denormalizeStatus } from "./course.service";

export type { PublicationStatus };

export interface AdminModuleVocabularyInput {
  moduleId: string;
  word: string;
  partOfSpeech: string;
  meaning: string;
  phonetic?: string;
  example?: string;
  notes?: string;
  orderIndex?: number;
  status?: PublicationStatus;
}

export function serializeVocabularyRecord<T extends { status?: string | null }>(record: T | null | undefined) {
  if (!record) return record;
  return {
    ...record,
    status: denormalizeStatus(record.status),
  };
}

async function nextModuleVocabularyOrderIndex(moduleId: string) {
  const { sql } = await import("drizzle-orm");
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${moduleVocabulary.orderIndex}), -1)` })
    .from(moduleVocabulary)
    .where(eq(moduleVocabulary.moduleId, moduleId));

  return (row?.max ?? -1) + 1;
}

export async function getVocabulariesByModule(moduleId: string) {
  const vocabularies = await db.query.moduleVocabulary.findMany({
    where: eq(moduleVocabulary.moduleId, moduleId),
    orderBy: [asc(moduleVocabulary.orderIndex)],
  });

  return vocabularies.map((item) => serializeVocabularyRecord(item));
}

export async function getVocabularyById(vocabularyId: string) {
  return db.query.moduleVocabulary.findFirst({ where: eq(moduleVocabulary.id, vocabularyId) });
}

export async function createAdminModuleVocabulary(input: AdminModuleVocabularyInput) {
  const existingModule = await db.query.module.findFirst({ where: eq(module.id, input.moduleId) });
  if (!existingModule) throw new Error("Chương học không tồn tại");

  const id = nanoid();
  await db.insert(moduleVocabulary).values({
    id,
    moduleId: input.moduleId,
    word: input.word,
    phonetic: input.phonetic ?? null,
    partOfSpeech: input.partOfSpeech,
    meaning: input.meaning,
    example: input.example ?? null,
    notes: input.notes ?? null,
    orderIndex: input.orderIndex ?? (await nextModuleVocabularyOrderIndex(input.moduleId)),
    status: normalizeStatus(input.status) ?? "DRAFT",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const relatedLessons = await db.query.lesson.findMany({ where: eq(lesson.moduleId, input.moduleId) });
  if (relatedLessons.length > 0) {
    await db
      .update(lesson)
      .set({ hasVocabulary: true, updatedAt: new Date() })
      .where(
        inArray(
          lesson.id,
          relatedLessons.map((item) => item.id),
        ),
      );
  }

  return serializeVocabularyRecord(await db.query.moduleVocabulary.findFirst({ where: eq(moduleVocabulary.id, id) }));
}

export async function updateAdminModuleVocabulary(vocabularyId: string, input: Partial<AdminModuleVocabularyInput>) {
  const existing = await db.query.moduleVocabulary.findFirst({ where: eq(moduleVocabulary.id, vocabularyId) });
  if (!existing) throw new Error("Từ vựng không tồn tại");

  await db.update(moduleVocabulary).set({
    ...(input.word !== undefined ? { word: input.word } : {}),
    ...(input.phonetic !== undefined ? { phonetic: input.phonetic } : {}),
    ...(input.partOfSpeech !== undefined ? { partOfSpeech: input.partOfSpeech } : {}),
    ...(input.meaning !== undefined ? { meaning: input.meaning } : {}),
    ...(input.example !== undefined ? { example: input.example } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    ...(input.orderIndex !== undefined ? { orderIndex: input.orderIndex } : {}),
    ...(input.status !== undefined ? { status: normalizeStatus(input.status) } : {}),
    updatedAt: new Date(),
  }).where(eq(moduleVocabulary.id, vocabularyId));

  return serializeVocabularyRecord(await db.query.moduleVocabulary.findFirst({ where: eq(moduleVocabulary.id, vocabularyId) }));
}

export async function deleteAdminModuleVocabulary(vocabularyId: string) {
  await db.delete(moduleVocabulary).where(eq(moduleVocabulary.id, vocabularyId));
  return { id: vocabularyId };
}

export async function publishVocabulariesByModule(moduleId: string) {
  await db.update(moduleVocabulary)
    .set({ status: "PUBLISHED", updatedAt: new Date() })
    .where(eq(moduleVocabulary.moduleId, moduleId));
}

export async function unpublishVocabulariesByModule(moduleId: string) {
  await db.update(moduleVocabulary)
    .set({ status: "DRAFT", updatedAt: new Date() })
    .where(eq(moduleVocabulary.moduleId, moduleId));
}

export async function archiveVocabulariesByModule(moduleId: string) {
  await db.update(moduleVocabulary)
    .set({ status: "ARCHIVED", updatedAt: new Date() })
    .where(eq(moduleVocabulary.moduleId, moduleId));
}
