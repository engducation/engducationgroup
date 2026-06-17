/**
 * Zod Schemas & Types - Writing Submissions
 *
 * Tách riêng khỏi `schemas.ts` để giữ mỗi file dưới ngưỡng 250 dòng
 * (quy tắc trong structure_code.md §2.1).
 *
 * Public surface: các schema + type ở đây được re-export từ
 * `@/features/learning-content` (xem `schemas.ts` & `index.ts`).
 */

import { z } from "zod";

export const writingErrorSchema = z.object({
  original: z.string().min(1),
  replacement: z.string().min(1),
  type: z.enum(["grammar", "spelling", "style"]),
  explanation: z.string().min(1),
});

export const writingAnalysisSchema = z.object({
  hasError: z.boolean(),
  score: z.number().min(0).max(100),
  correctedText: z.string(),
  errors: z.array(writingErrorSchema),
  suggestions: z.array(z.string()).max(3),
});

export const submitWritingSchema = z.object({
  writeId: z.string().min(1),
  content: z
    .string()
    .min(5, "Bài viết quá ngắn (tối thiểu 5 ký tự).")
    .max(20000, "Bài viết quá dài (tối đa 20.000 ký tự)."),
});

export const getWritingSubmissionSchema = z.object({
  writeId: z.string().min(1),
});

export const loadWritingForLessonSchema = z.object({
  lessonId: z.string().min(1),
});

export const saveWritingDraftSchema = z.object({
  writeId: z.string().min(1),
  content: z.string().min(1, "Không thể lưu bài trống.").max(20000),
});

export type WritingError = z.infer<typeof writingErrorSchema>;
export type WritingAnalysis = z.infer<typeof writingAnalysisSchema>;
export type SubmitWritingInput = z.infer<typeof submitWritingSchema>;
export type GetWritingSubmissionInput = z.infer<typeof getWritingSubmissionSchema>;
export type LoadWritingForLessonInput = z.infer<typeof loadWritingForLessonSchema>;
export type SaveWritingDraftInput = z.infer<typeof saveWritingDraftSchema>;
