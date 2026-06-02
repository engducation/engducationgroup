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

export type UserNotebookEntry = UserVocabulary & {
  vocabulary: Vocabulary;
};

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
