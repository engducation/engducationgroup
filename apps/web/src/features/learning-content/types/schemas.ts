import { z } from "zod";
import type { InferSelectModel } from "drizzle-orm";
import {
  course,
  module,
  lesson,
  read,
  write,
  quiz,
  quizQuestion,
  lessonVideo,
  vocabulary,
  studentProgress,
  quizAttempt,
  writingSubmission,
  userVocabulary as userVocabTable,
} from "@/db/schema/learning-content";

export type Course = InferSelectModel<typeof course>;
export type Module = InferSelectModel<typeof module>;
export type Lesson = InferSelectModel<typeof lesson>;
export type ReadModel = InferSelectModel<typeof read>;
export type WriteModel = InferSelectModel<typeof write>;
export type Quiz = InferSelectModel<typeof quiz>;
export type QuizQuestion = InferSelectModel<typeof quizQuestion>;
export type LessonVideo = InferSelectModel<typeof lessonVideo>;
export type Vocabulary = InferSelectModel<typeof vocabulary>;
export type StudentProgress = InferSelectModel<typeof studentProgress>;
export type QuizAttempt = InferSelectModel<typeof quizAttempt>;
export type WritingSubmission = InferSelectModel<typeof writingSubmission>;
export type UserVocabulary = InferSelectModel<typeof userVocabTable>;

// ─── Course ─────────────────────────────────────────────────────────────────

export const createCourseSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  level: z.string().min(1).max(50),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
});

export const updateCourseSchema = createCourseSchema.partial();

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

// ─── Module ─────────────────────────────────────────────────────────────────

export const createModuleSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(1).max(255),
  orderIndex: z.number().int().nonnegative().optional(),
});

export const updateModuleSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  orderIndex: z.number().int().nonnegative().optional(),
});

export const reorderModulesSchema = z.object({
  courseId: z.string().min(1),
  orderedIds: z.array(z.string()).min(0),
});

export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
export type ReorderModulesInput = z.infer<typeof reorderModulesSchema>;

// ─── Lesson ─────────────────────────────────────────────────────────────────

export const createLessonSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().min(1).max(255),
  orderIndex: z.number().int().nonnegative().optional(),
  hasRead: z.boolean().default(false),
  hasWrite: z.boolean().default(false),
  hasQuiz: z.boolean().default(false),
  hasVideo: z.boolean().default(false),
  hasVocabulary: z.boolean().default(false),
  isRequired: z.boolean().default(true),
});

export const updateLessonSchema = createLessonSchema.partial();

export const reorderLessonsSchema = z.object({
  moduleId: z.string().min(1),
  orderedIds: z.array(z.string()).min(0),
});

export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type ReorderLessonsInput = z.infer<typeof reorderLessonsSchema>;

// ─── Read ───────────────────────────────────────────────────────────────────

export const createReadSchema = z.object({
  lessonId: z.string().min(1),
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  keywords: z.string().optional(),
  learningObjectives: z.string().optional(),
});

export const updateReadSchema = createReadSchema.partial();

export type CreateReadInput = z.infer<typeof createReadSchema>;
export type UpdateReadInput = z.infer<typeof updateReadSchema>;

// ─── Write ───────────────────────────────────────────────────────────────────

export const createWriteSchema = z.object({
  lessonId: z.string().min(1),
  prompt: z.string().min(1),
  gradingCriteria: z.string().optional(),
  wordCountGuidance: z.number().int().positive().optional(),
  aiPromptId: z.string().optional(),
  maxAiRevisions: z.number().int().min(1).default(5),
});

export const updateWriteSchema = createWriteSchema.partial();

export type CreateWriteInput = z.infer<typeof createWriteSchema>;
export type UpdateWriteInput = z.infer<typeof updateWriteSchema>;

// ─── Quiz Question ───────────────────────────────────────────────────────────

export const quizQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string()).min(2).max(5),
  correctOption: z.number().int().min(0),
  explanation: z.string().min(1),
  orderIndex: z.number().int().nonnegative().optional(),
});

export const createQuizSchema = z.object({
  lessonId: z.string().min(1),
  questions: z.array(quizQuestionSchema).min(1),
});

export const updateQuizQuestionSchema = quizQuestionSchema.partial();

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type QuizQuestionInput = z.infer<typeof quizQuestionSchema>;
export type UpdateQuizQuestionInput = z.infer<typeof updateQuizQuestionSchema>;

// ─── Lesson Video ────────────────────────────────────────────────────────────

export const createLessonVideoSchema = z.object({
  lessonId: z.string().min(1),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  cloudinaryPublicId: z.string().min(1),
  cloudinaryUrl: z.string().url(),
  durationSeconds: z.number().int().nonnegative().optional(),
});

export const updateLessonVideoSchema = createLessonVideoSchema.partial();

export type CreateLessonVideoInput = z.infer<typeof createLessonVideoSchema>;
export type UpdateLessonVideoInput = z.infer<typeof updateLessonVideoSchema>;

// ─── Student Quiz Submission ─────────────────────────────────────────────────

export const submitQuizSchema = z.object({
  quizId: z.string().min(1),
  answers: z.record(z.string(), z.number().int().min(0)),
});

export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;

// ─── Writing Submission ───────────────────────────────────────────────────────

export const submitWritingSchema = z.object({
  writeId: z.string().min(1),
  content: z.string().min(1),
  requestAiReview: z.boolean().default(false),
});

export type SubmitWritingInput = z.infer<typeof submitWritingSchema>;

// ─── Progress ────────────────────────────────────────────────────────────────

export const updateProgressSchema = z.object({
  lessonId: z.string().min(1),
  readCompleted: z.boolean().optional(),
  writeCompleted: z.boolean().optional(),
  quizCompleted: z.boolean().optional(),
  videoCompleted: z.boolean().optional(),
  vocabularyReviewed: z.boolean().optional(),
});

export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;

// ─── Composite Types (for API responses) ────────────────────────────────────

export type CourseWithModules = {
  id: string;
  title: string;
  status: string;
  modules: ModuleWithLessons[];
};

export type ModuleWithLessons = {
  id: string;
  title: string;
  orderIndex: number;
  lessons: LessonWithContent[];
};

export type LessonWithContent = {
  id: string;
  moduleId: string;
  title: string;
  hasRead: boolean;
  hasWrite: boolean;
  hasQuiz: boolean;
  hasVideo: boolean;
  hasVocabulary: boolean;
  isRequired: boolean;
  read: { id: string; title: string; content: string; keywords: string | null } | null;
  write: { id: string; prompt: string } | null;
  quiz: ({ questions: QuizQuestion[] }) | null;
  video: { id: string; title: string; cloudinaryUrl: string } | null;
  lessonVocabularies: { vocabulary: Vocabulary }[];
};

export type QuizSubmissionResult = {
  attemptId: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  results: QuizQuestionResult[];
  completedAt: Date;
};

export type QuizQuestionResult = {
  questionId: string;
  question: string;
  options: string[];
  userAnswer: number | null;
  correctOption: number;
  isCorrect: boolean;
  explanation: string;
};

export type CourseProgressSummary = {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  percentage: number;
  lastActivityAt: Date | null;
};

// ─── Server Action Response Wrappers ─────────────────────────────────────────

export type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; details?: string[] };

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
