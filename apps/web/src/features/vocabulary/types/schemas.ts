import { z } from "zod";
import type { InferSelectModel } from "drizzle-orm";
import { vocabulary, userVocabulary } from "@/db/schema/learning-content";

export type Vocabulary = InferSelectModel<typeof vocabulary>;
export type UserVocabulary = InferSelectModel<typeof userVocabulary>;

// ─── Vocabulary ─────────────────────────────────────────────────────────────

export const vocabularyLevelEnum = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const createVocabularySchema = z.object({
  word: z.string().min(1).max(255),
  phonetic: z.string().optional(),
  partOfSpeech: z.string().min(1).max(50),
  meaning: z.string().min(1),
  examples: z.string().optional(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
  topic: z.string().max(100).optional(),
  audioUrl: z.string().url().optional().or(z.literal("")),
});

export const updateVocabularySchema = createVocabularySchema.partial();

export type CreateVocabularyInput = z.infer<typeof createVocabularySchema>;
export type UpdateVocabularyInput = z.infer<typeof updateVocabularySchema>;

// ─── Lesson Vocabulary Link ─────────────────────────────────────────────────

export const assignVocabToLessonSchema = z.object({
  lessonId: z.string().min(1),
  vocabularyId: z.string().min(1),
  orderIndex: z.number().int().nonnegative().optional(),
});

export type AssignVocabToLessonInput = z.infer<typeof assignVocabToLessonSchema>;

// ─── User Vocabulary (Notebook) ─────────────────────────────────────────────

export const searchVocabularySchema = z.object({
  query: z.string().min(0).optional(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
  topic: z.string().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

export type SearchVocabularyInput = z.infer<typeof searchVocabularySchema>;

// ─── Response Types ────────────────────────────────────────────────────────

export type VocabularyWithMeta = Vocabulary & {
  _count?: {
    lessonVocabularies: number;
    userVocabularies: number;
  };
};

/**
 * UserNotebookEntry — Phase 2 fields added:
 * - tags, note, masteredAt (mirror DB columns)
 * - collections: list of collectionIds the word belongs to
 * - review: optional SRS state (ease, interval, dueAt, ...)
 */
export type UserNotebookEntry = UserVocabulary & {
  vocabulary: Vocabulary;
  collections?: string[];
  review?: {
    id: string;
    easeFactor: number;
    intervalDays: number;
    repetition: number;
    lapses: number;
    dueAt: Date;
    lastReviewedAt: Date | null;
  } | null;
};

// ─── Phase 2 — Review / SRS / Collections / Tags / Note / Mastered ─────────

export const reviewGradeSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
]);
export type ReviewGrade = z.infer<typeof reviewGradeSchema>;
// 0 = Again (Quên), 1 = Hard (Khó), 2 = Good (Tốt), 3 = Easy (Dễ)

export const tagsSchema = z
  .array(
    z
      .string()
      .min(1)
      .max(30)
      .transform((s) => s.toLowerCase().trim())
      .refine((s) => s.length > 0, "Tag không được để trống"),
  )
  .max(10, "Tối đa 10 tag cho mỗi từ")
  .default([]);

export const noteSchema = z
  .string()
  .max(1000, "Ghi chú tối đa 1000 ký tự")
  .optional()
  .or(z.literal(""));

export const createCollectionSchema = z.object({
  name: z.string().min(1, "Tên bộ sưu tập không được để trống").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Màu không hợp lệ")
    .optional()
    .or(z.literal("")),
});
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;

export const updateCollectionSchema = createCollectionSchema.partial();
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;

export const tagsInputSchema = z.object({
  vocabularyId: z.string().min(1),
  tags: tagsSchema,
});
export const noteInputSchema = z.object({
  vocabularyId: z.string().min(1),
  note: z.string().max(1000).optional().or(z.literal("")),
});
export const masteredInputSchema = z.object({
  vocabularyId: z.string().min(1),
});
export const reviewInputSchema = z.object({
  vocabularyId: z.string().min(1),
  grade: reviewGradeSchema,
});
export const collectionMembershipSchema = z.object({
  collectionId: z.string().min(1),
  vocabularyId: z.string().min(1),
});
export const bulkMembershipSchema = z.object({
  collectionId: z.string().min(1),
  vocabularyIds: z.array(z.string().min(1)).min(1).max(200),
});
export const bulkRemoveSchema = z.object({
  vocabularyIds: z.array(z.string().min(1)).min(1).max(200),
});
export const togglePublicSchema = z.object({
  collectionId: z.string().min(1),
  isPublic: z.boolean(),
});
export const cloneSharedSchema = z.object({
  shareSlug: z.string().min(1).max(32),
});
export const createReviewSchema = z.object({
  vocabularyId: z.string().min(1),
});

export type VocabularySearchResult = {
  items: VocabularyWithMeta[];
  total: number;
  query: string;
};

// ─── Excel Import ──────────────────────────────────────────────────────────

export const excelImportVocabularySchema = z.object({
  rows: z.array(
    z.object({
      tu_goc: z.string().min(1),
      tu_loai: z.string().min(1),
      nghia: z.string().min(1),
      vi_du: z.string().min(1),
      cap_do: z.string().optional(),
      chu_de: z.string().optional(),
      phien_am: z.string().optional(),
    }),
  ),
  mode: z.enum(["INSERT_NEW", "UPDATE_EXISTING"]).default("UPDATE_EXISTING"),
});

export type ExcelImportVocabularyInput = z.infer<typeof excelImportVocabularySchema>;
