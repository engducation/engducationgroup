/**
 * Vocabulary Service - Nghiệp vụ quản lý từ vựng
 *
 * PRD Section 7.8: Vocabulary có từ gốc, phiên âm, từ loại, nghĩa, ví dụ, cấp độ, chủ đề, âm thanh.
 * PRD Section 10.4: Chấp nhận trùng từ gốc nếu khác từ loại.
 * PRD Section 12: Khi xóa từ vựng khỏi kho tổng, tất cả lượt lưu của User liên quan bị xóa theo.
 */

import { db } from "@/db";
import {
  vocabulary,
  userVocabulary,
  lessonVocabulary,
} from "@/db/schema/learning-content";
import { eq, and, like, or, sql, count, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import type {
  CreateVocabularyInput,
  UpdateVocabularyInput,
  SearchVocabularyInput,
  VocabularyWithMeta,
  UserNotebookEntry,
  Vocabulary,
} from "../types/schemas";
import type { ActionResult } from "@/features/learning-content/types";

// ─── Global Vocabulary CRUD ─────────────────────────────────────────────────

export async function getVocabularyById(vocabId: string): Promise<VocabularyWithMeta | null> {
  const result = await db.query.vocabulary.findFirst({
    where: eq(vocabulary.id, vocabId),
    with: {
      lessonVocabularies: {
        columns: { id: true, lessonId: true, vocabularyId: true, orderIndex: true },
      },
      userVocabularies: {
        columns: { id: true, userId: true, vocabularyId: true, savedAt: true },
      },
    },
  }) as (Vocabulary & { lessonVocabularies: unknown[]; userVocabularies: unknown[] }) | null;
  if (!result) return null;
  return {
    ...result,
    _count: {
      lessonVocabularies: result.lessonVocabularies.length,
      userVocabularies: result.userVocabularies.length,
    },
  };
}

export async function createVocabulary(input: CreateVocabularyInput): Promise<ActionResult> {
  // PRD Section 10.4: Check duplicate word + partOfSpeech
  const existing = await db.query.vocabulary.findFirst({
    where: and(
      eq(sql`LOWER(${vocabulary.word})`, input.word.toLowerCase()),
      eq(sql`LOWER(${vocabulary.partOfSpeech})`, input.partOfSpeech.toLowerCase()),
    ),
  });

  if (existing) {
    return {
      success: false,
      error: `Từ "${input.word}" (${input.partOfSpeech}) đã tồn tại trong kho từ vựng. Vui lòng cập nhật từ hiện có hoặc sử dụng từ loại khác.`,
    };
  }

  const id = nanoid();
  await db.insert(vocabulary).values({ id, ...input });
  return { success: true, data: { id } };
}

export async function updateVocabulary(
  vocabId: string,
  input: UpdateVocabularyInput,
): Promise<ActionResult> {
  const existing = await db.query.vocabulary.findFirst({ where: eq(vocabulary.id, vocabId) });
  if (!existing) return { success: false, error: "Từ vựng không tồn tại" };

  // Check duplicate with other vocab if word or partOfSpeech changed
  if (input.word || input.partOfSpeech) {
    const newWord = input.word ?? existing.word;
    const newPos = input.partOfSpeech ?? existing.partOfSpeech;
    const conflict = await db.query.vocabulary.findFirst({
      where: and(
        eq(sql`LOWER(${vocabulary.word})`, newWord.toLowerCase()),
        eq(sql`LOWER(${vocabulary.partOfSpeech})`, newPos.toLowerCase()),
        sql`${vocabulary.id} != ${vocabId}`,
      ),
    });

    if (conflict) {
      return {
        success: false,
        error: `Từ "${newWord}" (${newPos}) đã tồn tại. Không thể trùng từ gốc và từ loại.`,
      };
    }
  }

  await db.update(vocabulary).set(input).where(eq(vocabulary.id, vocabId));
  return { success: true, data: { id: vocabId, ...input } };
}

export async function deleteVocabulary(vocabId: string): Promise<ActionResult> {
  // PRD Section 12: Cascade delete user vocabulary saves
  // The FK has onDelete: cascade, so DB handles this automatically
  await db.delete(vocabulary).where(eq(vocabulary.id, vocabId));
  return { success: true, data: { id: vocabId } };
}

// ─── Search & Filter ──────────────────────────────────────────────────────

export async function searchVocabulary(
  input: SearchVocabularyInput,
): Promise<{ items: VocabularyWithMeta[]; total: number }> {
  const { query, level, topic, limit, offset } = input;

  const conditions = [];
  if (query) {
    conditions.push(
      or(
        like(vocabulary.word, `%${query}%`),
        like(vocabulary.meaning, `%${query}%`),
      ),
    );
  }
  if (level) conditions.push(eq(vocabulary.level, level));
  if (topic) conditions.push(eq(vocabulary.topic, topic));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(vocabulary)
      .where(whereClause)
      .orderBy(desc(vocabulary.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(vocabulary)
      .where(whereClause),
  ]);

  return { items: rows as VocabularyWithMeta[], total: Number(total) };
}

// ─── Lesson Vocabulary Assignment ─────────────────────────────────────────────

export async function assignVocabularyToLesson(
  lessonId: string,
  vocabularyId: string,
  orderIndex?: number,
): Promise<ActionResult> {
  const existing = await db.query.lessonVocabulary.findFirst({
    where: and(
      eq(lessonVocabulary.lessonId, lessonId),
      eq(lessonVocabulary.vocabularyId, vocabularyId),
    ),
  });

  if (existing) {
    return { success: false, error: "Từ vựng đã được gán vào bài học này" };
  }

  const id = nanoid();
  if (orderIndex === undefined) {
    const [maxRow] = await db
      .select({ maxIdx: sql<number>`COALESCE(MAX(${lessonVocabulary.orderIndex}), -1)` })
      .from(lessonVocabulary)
      .where(eq(lessonVocabulary.lessonId, lessonId));
    orderIndex = (maxRow?.maxIdx ?? -1) + 1;
  }

  await db.insert(lessonVocabulary).values({ id, lessonId, vocabularyId, orderIndex });
  return { success: true, data: { id } };
}

export async function unassignVocabularyFromLesson(
  lessonId: string,
  vocabularyId: string,
): Promise<ActionResult> {
  await db
    .delete(lessonVocabulary)
    .where(
      and(
        eq(lessonVocabulary.lessonId, lessonId),
        eq(lessonVocabulary.vocabularyId, vocabularyId),
      ),
    );
  return { success: true, data: { lessonId, vocabularyId } };
}

export async function getLessonVocabulary(lessonId: string) {
  return db.query.lessonVocabulary.findMany({
    where: eq(lessonVocabulary.lessonId, lessonId),
    with: { vocabulary: true },
    orderBy: [lessonVocabulary.orderIndex],
  });
}

// ─── Personal Notebook (User Vocabulary) ──────────────────────────────────────

export async function getUserNotebook(userId: string): Promise<UserNotebookEntry[]> {
  const entries = await db.query.userVocabulary.findMany({
    where: eq(userVocabulary.userId, userId),
    with: { vocabulary: true },
    orderBy: [desc(userVocabulary.savedAt)],
  });
  return entries as UserNotebookEntry[];
}

export async function saveToNotebook(userId: string, vocabularyId: string): Promise<ActionResult> {
  const existing = await db.query.userVocabulary.findFirst({
    where: and(
      eq(userVocabulary.userId, userId),
      eq(userVocabulary.vocabularyId, vocabularyId),
    ),
  });

  if (existing) {
    return { success: true, data: { id: existing.id, alreadySaved: true } };
  }

  const id = nanoid();
  await db.insert(userVocabulary).values({ id, userId, vocabularyId });
  return { success: true, data: { id } };
}

export async function removeFromNotebook(
  userId: string,
  vocabularyId: string,
): Promise<ActionResult> {
  await db
    .delete(userVocabulary)
    .where(
      and(
        eq(userVocabulary.userId, userId),
        eq(userVocabulary.vocabularyId, vocabularyId),
      ),
    );
  return { success: true, data: { vocabularyId } };
}

export async function isInNotebook(userId: string, vocabularyId: string): Promise<boolean> {
  const entry = await db.query.userVocabulary.findFirst({
    where: and(
      eq(userVocabulary.userId, userId),
      eq(userVocabulary.vocabularyId, vocabularyId),
    ),
  });
  return !!entry;
}

export async function getNotebookCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ cnt: count() })
    .from(userVocabulary)
    .where(eq(userVocabulary.userId, userId));
  return Number(row?.cnt ?? 0);
}

// ─── Excel Bulk Import ────────────────────────────────────────────────────────

export async function bulkImportVocabulary(
  rows: {
    word: string;
    partOfSpeech: string;
    meaning: string;
    examples?: string;
    level?: string;
    topic?: string;
    phonetic?: string;
  }[],
  mode: "INSERT_NEW" | "UPDATE_EXISTING" = "INSERT_NEW",
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      const existing = await db.query.vocabulary.findFirst({
        where: and(
          eq(sql`LOWER(${vocabulary.word})`, row.word.toLowerCase()),
          eq(sql`LOWER(${vocabulary.partOfSpeech})`, row.partOfSpeech.toLowerCase()),
        ),
      });

      if (existing) {
        if (mode === "UPDATE_EXISTING") {
          await db
            .update(vocabulary)
            .set({
              meaning: row.meaning,
              examples: row.examples,
              level: row.level,
              topic: row.topic,
              phonetic: row.phonetic,
            })
            .where(eq(vocabulary.id, existing.id));
          imported++;
        } else {
          skipped++;
        }
      } else {
        await db.insert(vocabulary).values({
          id: nanoid(),
          word: row.word,
          partOfSpeech: row.partOfSpeech,
          meaning: row.meaning,
          examples: row.examples,
          level: row.level,
          topic: row.topic,
          phonetic: row.phonetic,
        });
        imported++;
      }
    } catch (err) {
      errors.push(
        `Dòng ${i + 1}: ${err instanceof Error ? err.message : "Lỗi không xác định"}`,
      );
      skipped++;
    }
  }

  return { imported, skipped, errors };
}
