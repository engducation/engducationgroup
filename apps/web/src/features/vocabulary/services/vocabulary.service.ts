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
  lessonVocabularyItem,
  vocabularyReview,
  vocabularyCollection,
  userVocabularyCollection,
} from "@/db/schema/learning-content";
import { eq, and, like, or, sql, count, desc, asc, lte, inArray, isNotNull, isNull, ne } from "drizzle-orm";
import { nanoid } from "nanoid";
import type {
  CreateVocabularyInput,
  UpdateVocabularyInput,
  SearchVocabularyInput,
  VocabularyWithMeta,
  UserNotebookEntry,
  Vocabulary,
  CreateCollectionInput,
  UpdateCollectionInput,
  ReviewGrade,
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

/**
 * Ensure that an inline `lessonVocabularyItem` is mirrored into the global
 * `vocabulary` table so it can be referenced from `userVocabulary`.
 *
 * Idempotent: if a `vocabulary` row already exists with the same (word,
 * partOfSpeech) pair, that row is returned instead of creating a duplicate.
 *
 * The lesson-vocabulary-item table holds inline lesson vocabularies that are
 * authored per-lesson; the personal notebook only stores `vocabularyId`
 * references, so we materialize the link by ensuring a global row exists.
 */
export async function ensureLessonVocabToGlobalVocabulary(
  lessonItemId: string,
): Promise<ActionResult<{ vocabularyId: string }>> {
  const item = await db.query.lessonVocabularyItem.findFirst({
    where: eq(lessonVocabularyItem.id, lessonItemId),
  });

  if (!item) {
    return { success: false, error: "Không tìm thấy từ vựng trong bài học" };
  }

  const normalizedWord = item.word.trim();
  const normalizedPos = item.partOfSpeech.trim();

  const existing = await db.query.vocabulary.findFirst({
    where: and(
      eq(sql`LOWER(${vocabulary.word})`, normalizedWord.toLowerCase()),
      eq(sql`LOWER(${vocabulary.partOfSpeech})`, normalizedPos.toLowerCase()),
    ),
  });

  if (existing) {
    return { success: true, data: { vocabularyId: existing.id } };
  }

  const id = nanoid();
  await db.insert(vocabulary).values({
    id,
    word: normalizedWord,
    phonetic: item.phonetic ?? undefined,
    partOfSpeech: normalizedPos,
    meaning: item.meaning,
    examples: item.example ?? undefined,
  });

  return { success: true, data: { vocabularyId: id } };
}

export async function getUserNotebook(userId: string): Promise<UserNotebookEntry[]> {
  // 1) Load entries with vocabulary joined.
  const entries = await db.query.userVocabulary.findMany({
    where: eq(userVocabulary.userId, userId),
    with: { vocabulary: true },
    orderBy: [desc(userVocabulary.savedAt)],
  });

  if (entries.length === 0) return entries as UserNotebookEntry[];

  const entryIds = entries.map((e) => e.id);
  const vocabularyIds = entries.map((e) => e.vocabularyId);

  // 2) Load collection links in a single query.
  const links = await db
    .select({
      userVocabularyId: userVocabularyCollection.userVocabularyId,
      collectionId: userVocabularyCollection.collectionId,
    })
    .from(userVocabularyCollection)
    .where(inArray(userVocabularyCollection.userVocabularyId, entryIds));

  const collectionsByEntry = new Map<string, string[]>();
  for (const link of links) {
    const arr = collectionsByEntry.get(link.userVocabularyId) ?? [];
    arr.push(link.collectionId);
    collectionsByEntry.set(link.userVocabularyId, arr);
  }

  // 3) Load SRS review rows (lazy-init not triggered here, only reads).
  const reviews = await db
    .select()
    .from(vocabularyReview)
    .where(
      and(
        eq(vocabularyReview.userId, userId),
        inArray(vocabularyReview.vocabularyId, vocabularyIds),
      ),
    );

  const reviewByVocabId = new Map<string, (typeof reviews)[number]>();
  for (const r of reviews) reviewByVocabId.set(r.vocabularyId, r);

  return entries.map((entry) => {
    const review = reviewByVocabId.get(entry.vocabularyId);
    return {
      ...entry,
      collections: collectionsByEntry.get(entry.id) ?? [],
      review: review
        ? {
            id: review.id,
            easeFactor: review.easeFactor,
            intervalDays: review.intervalDays,
            repetition: review.repetition,
            lapses: review.lapses,
            dueAt: review.dueAt,
            lastReviewedAt: review.lastReviewedAt,
          }
        : null,
    };
  }) as UserNotebookEntry[];
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

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2 — SRS / Collections / Tags / Note / Mastered / Bulk / Share
// ═══════════════════════════════════════════════════════════════════════════

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Ensures a user has a row in `user_vocabulary` for the given vocabulary. */
async function ensureUserVocab(
  userId: string,
  vocabularyId: string,
): Promise<{ id: string } | null> {
  const existing = await db.query.userVocabulary.findFirst({
    where: and(
      eq(userVocabulary.userId, userId),
      eq(userVocabulary.vocabularyId, vocabularyId),
    ),
  });
  if (existing) return { id: existing.id };
  const id = nanoid();
  await db.insert(userVocabulary).values({ id, userId, vocabularyId });
  return { id };
}

/** Sanitizes raw tag list: trim, lowercase, dedupe, max 10 tags, max 30 chars each. */
function sanitizeTags(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of raw) {
    if (typeof t !== "string") continue;
    const cleaned = t.toLowerCase().trim().slice(0, 30);
    if (!cleaned) continue;
    if (seen.has(cleaned)) continue;
    seen.add(cleaned);
    out.push(cleaned);
    if (out.length >= 10) break;
  }
  return out;
}

function generateShareSlug(): string {
  // 8-12 char url-safe alphabet; collision is extremely rare with 8 chars (62^8).
  return nanoid(10).replace(/[-_]/g, "x");
}

// ─── SRS (Spaced Repetition System) ───────────────────────────────────────

/** Lazy-initialise a review row for the given user+vocabulary. */
export async function getOrInitReview(
  userId: string,
  vocabularyId: string,
) {
  // Ensure the user actually has the word in their notebook before init.
  await ensureUserVocab(userId, vocabularyId);

  const existing = await db.query.vocabularyReview.findFirst({
    where: and(
      eq(vocabularyReview.userId, userId),
      eq(vocabularyReview.vocabularyId, vocabularyId),
    ),
  });
  if (existing) return existing;

  const id = nanoid();
  const now = new Date();
  await db.insert(vocabularyReview).values({
    id,
    userId,
    vocabularyId,
    easeFactor: 2.5,
    intervalDays: 0,
    repetition: 0,
    lapses: 0,
    dueAt: now,
    lastReviewedAt: null,
  });
  const created = await db.query.vocabularyReview.findFirst({
    where: eq(vocabularyReview.id, id),
  });
  return created!;
}

/** Returns notebook entries that have a due review (dueAt <= now). */
export async function getDueReviews(
  userId: string,
  limit = 20,
): Promise<UserNotebookEntry[]> {
  const now = new Date();
  // Find review rows that are due and join to user_vocabulary + vocabulary.
  const rows = await db
    .select({
      reviewId: vocabularyReview.id,
      vocabId: vocabularyReview.vocabularyId,
      uvId: userVocabulary.id,
    })
    .from(vocabularyReview)
    .innerJoin(
      userVocabulary,
      and(
        eq(userVocabulary.userId, vocabularyReview.userId),
        eq(userVocabulary.vocabularyId, vocabularyReview.vocabularyId),
      ),
    )
    .where(
      and(
        eq(vocabularyReview.userId, userId),
        lte(vocabularyReview.dueAt, now),
      ),
    )
    .orderBy(asc(vocabularyReview.dueAt))
    .limit(limit);

  if (rows.length === 0) return [];

  const uvIds = rows.map((r) => r.uvId);
  const fullEntries = await db.query.userVocabulary.findMany({
    where: inArray(userVocabulary.id, uvIds),
    with: { vocabulary: true },
  });

  // Preserve the order of the SRS query.
  const orderByUv = new Map(rows.map((r, i) => [r.uvId, i] as const));
  return fullEntries
    .map((e) => ({ ...e }) as UserNotebookEntry)
    .sort(
      (a, b) =>
        (orderByUv.get(a.id) ?? 0) - (orderByUv.get(b.id) ?? 0),
    );
}

/** Counts words that are due (for badge in sidebar). */
export async function getDueReviewCount(userId: string): Promise<number> {
  const now = new Date();
  const [row] = await db
    .select({ cnt: count() })
    .from(vocabularyReview)
    .where(
      and(eq(vocabularyReview.userId, userId), lte(vocabularyReview.dueAt, now)),
    );
  return Number(row?.cnt ?? 0);
}

/**
 * Apply SM-2 update for a single review.
 * grade: 0=Again, 1=Hard, 2=Good, 3=Easy.
 */
export async function submitReview(
  userId: string,
  vocabularyId: string,
  grade: ReviewGrade,
) {
  const review = await getOrInitReview(userId, vocabularyId);
  const now = new Date();

  let { easeFactor, intervalDays, repetition, lapses } = review;
  const g = grade;

  if (g === 0) {
    repetition = 0;
    intervalDays = 1;
    lapses += 1;
  } else {
    if (repetition === 0) {
      intervalDays = 1;
    } else if (repetition === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    if (g === 1) intervalDays = Math.max(1, Math.round(intervalDays * 0.8));
    if (g === 3) intervalDays = Math.round(intervalDays * 1.3);
    repetition += 1;
  }

  // SM-2 ease-factor update:  EF' = EF + (0.1 - (3-q) * (0.08 + (3-q) * 0.02))
  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (3 - g) * (0.08 + (3 - g) * 0.02)),
  );

  const dueAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  await db
    .update(vocabularyReview)
    .set({
      easeFactor,
      intervalDays,
      repetition,
      lapses,
      dueAt,
      lastReviewedAt: now,
    })
    .where(eq(vocabularyReview.id, review.id));

  return {
    nextDueAt: dueAt,
    newIntervalDays: intervalDays,
    newEaseFactor: easeFactor,
  };
}

// ─── Tags / Note / Mastered ───────────────────────────────────────────────

export async function updateUserVocabTags(
  userId: string,
  vocabularyId: string,
  tags: string[],
): Promise<ActionResult> {
  const ensured = await ensureUserVocab(userId, vocabularyId);
  if (!ensured) return { success: false, error: "Không thể cập nhật tag" };

  const sanitized = sanitizeTags(tags);
  await db
    .update(userVocabulary)
    .set({ tags: sanitized })
    .where(eq(userVocabulary.id, ensured.id));
  return { success: true, data: { tags: sanitized } };
}

export async function updateUserVocabNote(
  userId: string,
  vocabularyId: string,
  note: string,
): Promise<ActionResult> {
  const ensured = await ensureUserVocab(userId, vocabularyId);
  if (!ensured) return { success: false, error: "Không thể cập nhật ghi chú" };

  const trimmed = note?.length > 1000 ? note.slice(0, 1000) : note ?? null;
  await db
    .update(userVocabulary)
    .set({ note: trimmed ?? null })
    .where(eq(userVocabulary.id, ensured.id));
  return { success: true, data: { note: trimmed } };
}

export async function markMastered(
  userId: string,
  vocabularyId: string,
): Promise<ActionResult> {
  const ensured = await ensureUserVocab(userId, vocabularyId);
  if (!ensured) return { success: false, error: "Không thể đánh dấu đã thuộc" };

  await db
    .update(userVocabulary)
    .set({ masteredAt: new Date() })
    .where(eq(userVocabulary.id, ensured.id));
  return { success: true, data: undefined };
}

export async function unmarkMastered(
  userId: string,
  vocabularyId: string,
): Promise<ActionResult> {
  // Set masteredAt to null
  await db
    .update(userVocabulary)
    .set({ masteredAt: null })
    .where(
      and(
        eq(userVocabulary.userId, userId),
        eq(userVocabulary.vocabularyId, vocabularyId),
      ),
    );

  // Ensure there's a review record so it appears in "Cần ôn"
  await getOrInitReview(userId, vocabularyId);

  return { success: true, data: undefined };
}

// ─── Collections ──────────────────────────────────────────────────────────

export async function listCollections(userId: string) {
  const rows = await db.query.vocabularyCollection.findMany({
    where: eq(vocabularyCollection.userId, userId),
    orderBy: [asc(vocabularyCollection.name)],
  });
  // Get the count of items per collection.
  if (rows.length === 0) return rows.map((r) => ({ ...r, _count: 0 }));
  const counts = await db
    .select({
      collectionId: userVocabularyCollection.collectionId,
      cnt: count(),
    })
    .from(userVocabularyCollection)
    .innerJoin(
      userVocabulary,
      eq(userVocabulary.id, userVocabularyCollection.userVocabularyId),
    )
    .where(
      and(
        eq(userVocabulary.userId, userId),
        inArray(
          userVocabularyCollection.collectionId,
          rows.map((r) => r.id),
        ),
      ),
    )
    .groupBy(userVocabularyCollection.collectionId);

  const countMap = new Map(counts.map((c) => [c.collectionId, Number(c.cnt)]));
  return rows.map((r) => ({ ...r, _count: countMap.get(r.id) ?? 0 }));
}

export async function createCollection(
  userId: string,
  input: CreateCollectionInput,
): Promise<ActionResult<{ id: string }>> {
  const name = input.name.trim();
  if (!name) return { success: false, error: "Tên bộ sưu tập không được để trống" };

  const existing = await db.query.vocabularyCollection.findFirst({
    where: and(
      eq(vocabularyCollection.userId, userId),
      sql`LOWER(${vocabularyCollection.name}) = LOWER(${name})`,
    ),
  });
  if (existing) {
    return {
      success: false,
      error: "Đã có bộ sưu tập với tên này",
    };
  }

  const id = nanoid();
  await db.insert(vocabularyCollection).values({
    id,
    userId,
    name,
    description: input.description || null,
    color: input.color || null,
    isPublic: false,
    shareSlug: null,
  });
  return { success: true, data: { id } };
}

export async function renameCollection(
  userId: string,
  id: string,
  name: string,
): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { success: false, error: "Tên không được để trống" };
  const coll = await db.query.vocabularyCollection.findFirst({
    where: and(
      eq(vocabularyCollection.id, id),
      eq(vocabularyCollection.userId, userId),
    ),
  });
  if (!coll) return { success: false, error: "Bộ sưu tập không tồn tại" };

  // Name uniqueness
  const conflict = await db.query.vocabularyCollection.findFirst({
    where: and(
      eq(vocabularyCollection.userId, userId),
      sql`LOWER(${vocabularyCollection.name}) = LOWER(${trimmed})`,
      sql`${vocabularyCollection.id} != ${id}`,
    ),
  });
  if (conflict) return { success: false, error: "Tên bộ sưu tập đã tồn tại" };

  await db
    .update(vocabularyCollection)
    .set({ name: trimmed })
    .where(eq(vocabularyCollection.id, id));
  return { success: true, data: undefined };
}

export async function updateCollection(
  userId: string,
  id: string,
  input: UpdateCollectionInput,
): Promise<ActionResult> {
  const coll = await db.query.vocabularyCollection.findFirst({
    where: and(
      eq(vocabularyCollection.id, id),
      eq(vocabularyCollection.userId, userId),
    ),
  });
  if (!coll) return { success: false, error: "Bộ sưu tập không tồn tại" };

  const patch: Partial<typeof vocabularyCollection.$inferInsert> = {};
  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (!trimmed) return { success: false, error: "Tên không được để trống" };
    const conflict = await db.query.vocabularyCollection.findFirst({
      where: and(
        eq(vocabularyCollection.userId, userId),
        sql`LOWER(${vocabularyCollection.name}) = LOWER(${trimmed})`,
        sql`${vocabularyCollection.id} != ${id}`,
      ),
    });
    if (conflict) return { success: false, error: "Tên bộ sưu tập đã tồn tại" };
    patch.name = trimmed;
  }
  if (input.description !== undefined) {
    patch.description = input.description || null;
  }
  if (input.color !== undefined) {
    patch.color = input.color || null;
  }

  if (Object.keys(patch).length > 0) {
    await db
      .update(vocabularyCollection)
      .set(patch)
      .where(eq(vocabularyCollection.id, id));
  }
  return { success: true, data: undefined };
}

export async function deleteCollection(
  userId: string,
  id: string,
): Promise<ActionResult> {
  const coll = await db.query.vocabularyCollection.findFirst({
    where: and(
      eq(vocabularyCollection.id, id),
      eq(vocabularyCollection.userId, userId),
    ),
  });
  if (!coll) return { success: false, error: "Bộ sưu tập không tồn tại" };
  // Cascade FK will drop join rows; user_vocabulary rows are untouched.
  await db
    .delete(vocabularyCollection)
    .where(eq(vocabularyCollection.id, id));
  return { success: true, data: undefined };
}

export async function addToCollection(
  userId: string,
  collectionId: string,
  vocabularyId: string,
): Promise<ActionResult> {
  const coll = await db.query.vocabularyCollection.findFirst({
    where: and(
      eq(vocabularyCollection.id, collectionId),
      eq(vocabularyCollection.userId, userId),
    ),
  });
  if (!coll) return { success: false, error: "Bộ sưu tập không tồn tại" };

  const ensured = await ensureUserVocab(userId, vocabularyId);
  if (!ensured) return { success: false, error: "Không thể thêm vào bộ sưu tập" };

  // Idempotent: uniqueIndex on (userVocabularyId, collectionId).
  const existing = await db.query.userVocabularyCollection.findFirst({
    where: and(
      eq(userVocabularyCollection.userVocabularyId, ensured.id),
      eq(userVocabularyCollection.collectionId, collectionId),
    ),
  });
  if (existing) return { success: true, data: { id: existing.id, alreadyAdded: true } };

  const id = nanoid();
  await db.insert(userVocabularyCollection).values({
    id,
    userVocabularyId: ensured.id,
    collectionId,
  });
  return { success: true, data: { id } };
}

export async function removeFromCollection(
  userId: string,
  collectionId: string,
  vocabularyId: string,
): Promise<ActionResult> {
  // Find the userVocabulary row for this user+vocab.
  const uv = await db.query.userVocabulary.findFirst({
    where: and(
      eq(userVocabulary.userId, userId),
      eq(userVocabulary.vocabularyId, vocabularyId),
    ),
  });
  if (!uv) return { success: true, data: undefined };
  await db
    .delete(userVocabularyCollection)
    .where(
      and(
        eq(userVocabularyCollection.userVocabularyId, uv.id),
        eq(userVocabularyCollection.collectionId, collectionId),
      ),
    );
  return { success: true, data: undefined };
}

export async function bulkAddToCollection(
  userId: string,
  collectionId: string,
  vocabularyIds: string[],
): Promise<ActionResult<{ added: number; already: number }>> {
  const coll = await db.query.vocabularyCollection.findFirst({
    where: and(
      eq(vocabularyCollection.id, collectionId),
      eq(vocabularyCollection.userId, userId),
    ),
  });
  if (!coll) return { success: false, error: "Bộ sưu tập không tồn tại" };

  // Ensure all words are in the user's notebook first.
  const ensuredPairs = await Promise.all(
    vocabularyIds.map((vid) => ensureUserVocab(userId, vid)),
  );
  const userVocabIds = ensuredPairs
    .filter((p): p is { id: string } => !!p)
    .map((p) => p.id);

  if (userVocabIds.length === 0) {
    return { success: true, data: { added: 0, already: 0 } };
  }

  // Find existing links to avoid duplicates.
  const existingLinks = await db
    .select({ userVocabularyId: userVocabularyCollection.userVocabularyId })
    .from(userVocabularyCollection)
    .where(
      and(
        eq(userVocabularyCollection.collectionId, collectionId),
        inArray(userVocabularyCollection.userVocabularyId, userVocabIds),
      ),
    );
  const existingSet = new Set(existingLinks.map((l) => l.userVocabularyId));
  const toInsert = userVocabIds.filter((id) => !existingSet.has(id));

  if (toInsert.length === 0) {
    return { success: true, data: { added: 0, already: existingSet.size } };
  }

  await db.insert(userVocabularyCollection).values(
    toInsert.map((userVocabId) => ({
      id: nanoid(),
      userVocabularyId: userVocabId,
      collectionId,
    })),
  );

  return {
    success: true,
    data: { added: toInsert.length, already: existingSet.size },
  };
}

export async function bulkRemoveFromNotebook(
  userId: string,
  vocabularyIds: string[],
): Promise<ActionResult<{ removed: number }>> {
  if (vocabularyIds.length === 0) {
    return { success: true, data: { removed: 0 } };
  }
  const result = await db
    .delete(userVocabulary)
    .where(
      and(
        eq(userVocabulary.userId, userId),
        inArray(userVocabulary.vocabularyId, vocabularyIds),
      ),
    )
    .returning({ id: userVocabulary.id });
  return { success: true, data: { removed: result.length } };
}

export async function bulkMarkMastered(
  userId: string,
  vocabularyIds: string[],
  mastered: boolean,
): Promise<ActionResult<{ updated: number }>> {
  if (vocabularyIds.length === 0) {
    return { success: true, data: { updated: 0 } };
  }
  // Ensure all words are in the user's notebook.
  await Promise.all(vocabularyIds.map((vid) => ensureUserVocab(userId, vid)));

  // If unmarking (mastered = false), ensure review records exist so words appear in "Cần ôn"
  if (!mastered) {
    await Promise.all(vocabularyIds.map((vid) => getOrInitReview(userId, vid)));
  }

  const result = await db
    .update(userVocabulary)
    .set({ masteredAt: mastered ? new Date() : null })
    .where(
      and(
        eq(userVocabulary.userId, userId),
        inArray(userVocabulary.vocabularyId, vocabularyIds),
      ),
    )
    .returning({ id: userVocabulary.id });
  return { success: true, data: { updated: result.length } };
}

// ─── Share / Public Collection ────────────────────────────────────────────

export async function toggleCollectionPublic(
  userId: string,
  collectionId: string,
  isPublic: boolean,
): Promise<ActionResult<{ shareSlug: string | null }>> {
  const coll = await db.query.vocabularyCollection.findFirst({
    where: and(
      eq(vocabularyCollection.id, collectionId),
      eq(vocabularyCollection.userId, userId),
    ),
  });
  if (!coll) return { success: false, error: "Bộ sưu tập không tồn tại" };

  if (isPublic && !coll.shareSlug) {
    // Generate a unique slug with a few attempts to dodge collisions.
    let slug = generateShareSlug();
    for (let i = 0; i < 4; i++) {
      const conflict = await db.query.vocabularyCollection.findFirst({
        where: eq(vocabularyCollection.shareSlug, slug),
      });
      if (!conflict) break;
      slug = generateShareSlug();
    }
    await db
      .update(vocabularyCollection)
      .set({ isPublic: true, shareSlug: slug })
      .where(eq(vocabularyCollection.id, collectionId));
    return { success: true, data: { shareSlug: slug } };
  }

  if (!isPublic) {
    await db
      .update(vocabularyCollection)
      .set({ isPublic: false })
      .where(eq(vocabularyCollection.id, collectionId));
    return { success: true, data: { shareSlug: null } };
  }

  return { success: true, data: { shareSlug: coll.shareSlug } };
}

export async function getCollectionByShareSlug(shareSlug: string) {
  const coll = await db.query.vocabularyCollection.findFirst({
    where: and(
      eq(vocabularyCollection.shareSlug, shareSlug),
      eq(vocabularyCollection.isPublic, true),
    ),
  });
  if (!coll) return null;

  // Get the words in this collection.
  const items = await db
    .select({
      id: vocabulary.id,
      word: vocabulary.word,
      phonetic: vocabulary.phonetic,
      partOfSpeech: vocabulary.partOfSpeech,
      meaning: vocabulary.meaning,
      level: vocabulary.level,
      topic: vocabulary.topic,
      audioUrl: vocabulary.audioUrl,
    })
    .from(vocabulary)
    .innerJoin(
      userVocabulary,
      eq(userVocabulary.vocabularyId, vocabulary.id),
    )
    .innerJoin(
      userVocabularyCollection,
      eq(userVocabularyCollection.userVocabularyId, userVocabulary.id),
    )
    .where(eq(userVocabularyCollection.collectionId, coll.id))
    .orderBy(asc(vocabulary.word));

  return { collection: coll, items };
}

export async function cloneSharedCollection(
  userId: string,
  shareSlug: string,
): Promise<ActionResult<{ collectionId: string; copied: number }>> {
  const shared = await getCollectionByShareSlug(shareSlug);
  if (!shared) return { success: false, error: "Bộ sưu tập không tồn tại hoặc đã bị xoá" };

  // Choose a unique name (clone) for the new user.
  const baseName = `${shared.collection.name} (Bản sao)`;
  let name = baseName;
  let suffix = 1;
  while (true) {
    const existing = await db.query.vocabularyCollection.findFirst({
      where: and(
        eq(vocabularyCollection.userId, userId),
        sql`LOWER(${vocabularyCollection.name}) = LOWER(${name})`,
      ),
    });
    if (!existing) break;
    suffix += 1;
    name = `${baseName} (${suffix})`;
  }

  const newId = nanoid();
  await db.insert(vocabularyCollection).values({
    id: newId,
    userId,
    name,
    description: shared.collection.description,
    color: shared.collection.color,
    isPublic: false,
    shareSlug: null,
  });

  // Add the shared items to the new user's notebook + collection.
  let copied = 0;
  for (const item of shared.items) {
    const ensured = await ensureUserVocab(userId, item.id);
    if (!ensured) continue;
    await db.insert(userVocabularyCollection).values({
      id: nanoid(),
      userVocabularyId: ensured.id,
      collectionId: newId,
    });
    copied += 1;
  }

  return { success: true, data: { collectionId: newId, copied } };
}

// ─── Tag suggestion list (all distinct tags used by user) ─────────────────

export async function listUserTags(userId: string): Promise<string[]> {
  const rows = await db
    .select({ tags: userVocabulary.tags })
    .from(userVocabulary)
    .where(eq(userVocabulary.userId, userId));
  const set = new Set<string>();
  for (const r of rows) {
    if (Array.isArray(r.tags)) {
      for (const t of r.tags) if (typeof t === "string") set.add(t);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

// ─── Random vocabulary distractors for Quiz ───────────────────────────────

export async function getRandomDistractors(
  excludeVocabularyId: string,
  level: string | null,
  limit: number,
) {
  // Try same level first; if not enough, fall back to global random.
  const whereSameLevel = level
    ? and(ne(vocabulary.id, excludeVocabularyId), eq(vocabulary.level, level))
    : ne(vocabulary.id, excludeVocabularyId);
  const sameLevel = await db
    .select({
      id: vocabulary.id,
      word: vocabulary.word,
      meaning: vocabulary.meaning,
      level: vocabulary.level,
    })
    .from(vocabulary)
    .where(whereSameLevel)
    .orderBy(sql`RANDOM()`)
    .limit(limit);
  if (sameLevel.length >= limit) return sameLevel;
  // Fall back to global
  const filler = await db
    .select({
      id: vocabulary.id,
      word: vocabulary.word,
      meaning: vocabulary.meaning,
      level: vocabulary.level,
    })
    .from(vocabulary)
    .where(ne(vocabulary.id, excludeVocabularyId))
    .orderBy(sql`RANDOM()`)
    .limit(limit);
  // Dedupe by id
  const seen = new Set(sameLevel.map((r) => r.id));
  const merged = [...sameLevel];
  for (const f of filler) {
    if (seen.has(f.id)) continue;
    merged.push(f);
    seen.add(f.id);
    if (merged.length >= limit) break;
  }
  return merged.slice(0, limit);
}
