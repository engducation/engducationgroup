import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export { user };

// ─── Publication Status Enum ───────────────────────────────────────────────

export const publicationStatusEnum = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type PublicationStatus = (typeof publicationStatusEnum)[number];

// ─── Course ────────────────────────────────────────────────────────────────

export const course = pgTable(
  "course",
  {
    id: text("id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    level: varchar("level", { length: 50 }).notNull(),
    thumbnailUrl: text("thumbnail_url"),
    certificateTemplateUrl: text("certificate_template_url"),
    status: varchar("status", { length: 20 })
      .$type<PublicationStatus>()
      .default("DRAFT")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("course_status_idx").on(table.status)],
);

// ─── Module ────────────────────────────────────────────────────────────────

export const module = pgTable(
  "module",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 20 })
      .$type<PublicationStatus>()
      .default("DRAFT")
      .notNull(),
    orderIndex: integer("order_index").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("module_course_idx").on(table.courseId),
    uniqueIndex("module_course_order_unique").on(table.courseId, table.orderIndex),
  ],
);

// ─── Lesson ────────────────────────────────────────────────────────────────

export const lesson = pgTable(
  "lesson",
  {
    id: text("id").primaryKey(),
    moduleId: text("module_id")
      .notNull()
      .references(() => module.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 20 })
      .$type<PublicationStatus>()
      .default("DRAFT")
      .notNull(),
    orderIndex: integer("order_index").notNull(),
    hasRead: boolean("has_read").default(false).notNull(),
    hasWrite: boolean("has_write").default(false).notNull(),
    hasQuiz: boolean("has_quiz").default(false).notNull(),
    hasVideo: boolean("has_video").default(false).notNull(),
    hasVocabulary: boolean("has_vocabulary").default(false).notNull(),
    isRequired: boolean("is_required").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("lesson_module_idx").on(table.moduleId),
    uniqueIndex("lesson_module_order_unique").on(table.moduleId, table.orderIndex),
  ],
);

// ─── Read ──────────────────────────────────────────────────────────────────

export const read = pgTable(
  "read",
  {
    id: text("id").primaryKey(),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    keywords: text("keywords"),
    learningObjectives: text("learning_objectives"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("read_lesson_idx").on(table.lessonId)],
);

// ─── Write ─────────────────────────────────────────────────────────────────

export const write = pgTable(
  "write",
  {
    id: text("id").primaryKey(),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    gradingCriteria: text("grading_criteria"),
    wordCountGuidance: integer("word_count_guidance"),
    aiPromptId: text("ai_prompt_id"),
    maxAiRevisions: integer("max_ai_revisions").default(5).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("write_lesson_idx").on(table.lessonId)],
);

// ─── Quiz ──────────────────────────────────────────────────────────────────

export const quiz = pgTable(
  "quiz",
  {
    id: text("id").primaryKey(),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("quiz_lesson_idx").on(table.lessonId)],
);

export const quizQuestion = pgTable(
  "quiz_question",
  {
    id: text("id").primaryKey(),
    quizId: text("quiz_id")
      .notNull()
      .references(() => quiz.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    options: text("options").notNull(),
    correctOption: integer("correct_option").notNull(),
    explanation: text("explanation").notNull(),
    orderIndex: integer("order_index").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("quiz_question_quiz_idx").on(table.quizId),
    uniqueIndex("quiz_question_quiz_order_unique").on(table.quizId, table.orderIndex),
  ],
);

// ─── Lesson Video ─────────────────────────────────────────────────────────

export const lessonVideo = pgTable(
  "lesson_video",
  {
    id: text("id").primaryKey(),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    cloudinaryPublicId: text("cloudinary_public_id").notNull(),
    cloudinaryUrl: text("cloudinary_url").notNull(),
    durationSeconds: integer("duration_seconds"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("lesson_video_lesson_idx").on(table.lessonId)],
);

// ─── Module Vocabulary ───────────────────────────────────────────────────────

export const moduleVocabulary = pgTable(
  "module_vocabulary",
  {
    id: text("id").primaryKey(),
    moduleId: text("module_id")
      .notNull()
      .references(() => module.id, { onDelete: "cascade" }),
    word: varchar("word", { length: 255 }).notNull(),
    phonetic: text("phonetic"),
    partOfSpeech: varchar("part_of_speech", { length: 50 }).notNull(),
    meaning: text("meaning").notNull(),
    example: text("example"),
    notes: text("notes"),
    orderIndex: integer("order_index").default(0).notNull(),
    status: varchar("status", { length: 20 })
      .$type<PublicationStatus>()
      .default("DRAFT")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("module_vocabulary_module_idx").on(table.moduleId),
    uniqueIndex("module_vocabulary_module_order_unique").on(table.moduleId, table.orderIndex),
  ],
);

// ─── Vocabulary (Global) ───────────────────────────────────────────────────

export const vocabulary = pgTable(
  "vocabulary",
  {
    id: text("id").primaryKey(),
    word: varchar("word", { length: 255 }).notNull(),
    phonetic: text("phonetic"),
    partOfSpeech: varchar("part_of_speech", { length: 50 }).notNull(),
    meaning: text("meaning").notNull(),
    examples: text("examples"),
    level: varchar("level", { length: 20 }),
    topic: varchar("topic", { length: 100 }),
    audioUrl: text("audio_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("vocabulary_word_idx").on(table.word),
    index("vocabulary_level_idx").on(table.level),
    index("vocabulary_topic_idx").on(table.topic),
    uniqueIndex("vocabulary_word_pos_unique").on(table.word, table.partOfSpeech),
  ],
);

// ─── Lesson ↔ Vocabulary Junction ───────────────────────────────────────────

export const lessonVocabulary = pgTable(
  "lesson_vocabulary",
  {
    id: text("id").primaryKey(),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    vocabularyId: text("vocabulary_id")
      .notNull()
      .references(() => vocabulary.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("lesson_vocabulary_lesson_idx").on(table.lessonId),
    index("lesson_vocabulary_vocab_idx").on(table.vocabularyId),
    uniqueIndex("lesson_vocabulary_unique").on(table.lessonId, table.vocabularyId),
  ],
);

// ─── Inline Lesson Vocabulary Item (for inline vocabulary in lessons) ─────────────

export const lessonVocabularyItem = pgTable(
  "lesson_vocabulary_item",
  {
    id: text("id").primaryKey(),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    word: varchar("word", { length: 255 }).notNull(),
    phonetic: text("phonetic"),
    partOfSpeech: varchar("part_of_speech", { length: 50 }).notNull(),
    meaning: text("meaning").notNull(),
    example: text("example"),
    notes: text("notes"),
    orderIndex: integer("order_index").default(0).notNull(),
    status: varchar("status", { length: 20 })
      .$type<PublicationStatus>()
      .default("DRAFT")
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("lesson_vocabulary_item_lesson_idx").on(table.lessonId),
    index("lesson_vocabulary_item_order_idx").on(table.lessonId, table.orderIndex),
  ],
);

// ─── User Vocabulary (Personal Notebook) ───────────────────────────────────

export const userVocabulary = pgTable(
  "user_vocabulary",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    vocabularyId: text("vocabulary_id")
      .notNull()
      .references(() => vocabulary.id, { onDelete: "cascade" }),
    savedAt: timestamp("saved_at").defaultNow().notNull(),
  },
  (table) => [
    index("user_vocabulary_user_idx").on(table.userId),
    index("user_vocabulary_vocab_idx").on(table.vocabularyId),
    uniqueIndex("user_vocabulary_unique").on(table.userId, table.vocabularyId),
  ],
);

// ─── Course Review ───────────────────────────────────────────────────────────

export const courseReview = pgTable(
  "course_review",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => course.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    adminReply: text("admin_reply"),
    adminReplyAt: timestamp("admin_reply_at"),
    status: varchar("status", { length: 20 }).default("VISIBLE").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("course_review_course_idx").on(table.courseId),
    index("course_review_user_idx").on(table.userId),
  ],
);

// ─── Student Progress ──────────────────────────────────────────────────────

export const studentProgress = pgTable(
  "student_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    readCompleted: boolean("read_completed").default(false).notNull(),
    writeCompleted: boolean("write_completed").default(false).notNull(),
    quizCompleted: boolean("quiz_completed").default(false).notNull(),
    videoCompleted: boolean("video_completed").default(false).notNull(),
    vocabularyReviewed: boolean("vocabulary_reviewed").default(false).notNull(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("student_progress_user_idx").on(table.userId),
    index("student_progress_lesson_idx").on(table.lessonId),
    uniqueIndex("student_progress_unique").on(table.userId, table.lessonId),
  ],
);

// ─── Quiz Attempts ─────────────────────────────────────────────────────────

export const quizAttempt = pgTable(
  "quiz_attempt",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    quizId: text("quiz_id")
      .notNull()
      .references(() => quiz.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    totalQuestions: integer("total_questions").notNull(),
    answers: text("answers").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("quiz_attempt_user_idx").on(table.userId),
    index("quiz_attempt_quiz_idx").on(table.quizId),
  ],
);

// ─── User Writing Submissions ───────────────────────────────────────────────

export const writingSubmission = pgTable(
  "writing_submission",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    writeId: text("write_id")
      .notNull()
      .references(() => write.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    aiFeedback: text("ai_feedback"),
    aiScore: integer("ai_score"),
    teacherFeedback: text("teacher_feedback"),
    teacherScore: integer("teacher_score"),
    status: varchar("status", { length: 20 }).default("DRAFT").notNull(),
    aiRevisionsUsed: integer("ai_revisions_used").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("writing_submission_user_idx").on(table.userId),
    index("writing_submission_write_idx").on(table.writeId),
  ],
);

// ─── Relations ─────────────────────────────────────────────────────────────

export const courseRelations = relations(course, ({ many }) => ({
  modules: many(module),
  reviews: many(courseReview),
}));

export const moduleRelations = relations(module, ({ one, many }) => ({
  course: one(course, {
    fields: [module.courseId],
    references: [course.id],
  }),
  lessons: many(lesson),
  vocabularies: many(moduleVocabulary),
}));

export const lessonRelations = relations(lesson, ({ one, many }) => ({
  module: one(module, {
    fields: [lesson.moduleId],
    references: [module.id],
  }),
  read: one(read, {
    fields: [lesson.id],
    references: [read.lessonId],
  }),
  write: one(write, {
    fields: [lesson.id],
    references: [write.lessonId],
  }),
  quiz: one(quiz, {
    fields: [lesson.id],
    references: [quiz.lessonId],
  }),
  video: one(lessonVideo, {
    fields: [lesson.id],
    references: [lessonVideo.lessonId],
  }),
  lessonVocabularies: many(lessonVocabulary),
  studentProgress: many(studentProgress),
}));

export const quizRelations = relations(quiz, ({ one, many }) => ({
  lesson: one(lesson, {
    fields: [quiz.lessonId],
    references: [lesson.id],
  }),
  questions: many(quizQuestion),
  attempts: many(quizAttempt),
}));

export const quizQuestionRelations = relations(quizQuestion, ({ one }) => ({
  quiz: one(quiz, {
    fields: [quizQuestion.quizId],
    references: [quiz.id],
  }),
}));

export const lessonVideoRelations = relations(lessonVideo, ({ one }) => ({
  lesson: one(lesson, {
    fields: [lessonVideo.lessonId],
    references: [lesson.id],
  }),
}));

export const readRelations = relations(read, ({ one }) => ({
  lesson: one(lesson, {
    fields: [read.lessonId],
    references: [lesson.id],
  }),
}));

export const writeRelations = relations(write, ({ one }) => ({
  lesson: one(lesson, {
    fields: [write.lessonId],
    references: [lesson.id],
  }),
}));

export const moduleVocabularyRelations = relations(moduleVocabulary, ({ one }) => ({
  module: one(module, {
    fields: [moduleVocabulary.moduleId],
    references: [module.id],
  }),
}));

export const vocabularyRelations = relations(vocabulary, ({ many }) => ({
  lessonVocabularies: many(lessonVocabulary),
  userVocabularies: many(userVocabulary),
}));

export const lessonVocabularyRelations = relations(lessonVocabulary, ({ one }) => ({
  lesson: one(lesson, {
    fields: [lessonVocabulary.lessonId],
    references: [lesson.id],
  }),
  vocabulary: one(vocabulary, {
    fields: [lessonVocabulary.vocabularyId],
    references: [vocabulary.id],
  }),
}));

export const userVocabularyRelations = relations(userVocabulary, ({ one }) => ({
  user: one(user, {
    fields: [userVocabulary.userId],
    references: [user.id],
  }),
  vocabulary: one(vocabulary, {
    fields: [userVocabulary.vocabularyId],
    references: [vocabulary.id],
  }),
}));

export const courseReviewRelations = relations(courseReview, ({ one }) => ({
  course: one(course, {
    fields: [courseReview.courseId],
    references: [course.id],
  }),
  user: one(user, {
    fields: [courseReview.userId],
    references: [user.id],
  }),
}));

export const studentProgressRelations = relations(studentProgress, ({ one }) => ({
  user: one(user, {
    fields: [studentProgress.userId],
    references: [user.id],
  }),
  lesson: one(lesson, {
    fields: [studentProgress.lessonId],
    references: [lesson.id],
  }),
}));

export const quizAttemptRelations = relations(quizAttempt, ({ one }) => ({
  user: one(user, {
    fields: [quizAttempt.userId],
    references: [user.id],
  }),
  quiz: one(quiz, {
    fields: [quizAttempt.quizId],
    references: [quiz.id],
  }),
}));

export const writingSubmissionRelations = relations(writingSubmission, ({ one }) => ({
  user: one(user, {
    fields: [writingSubmission.userId],
    references: [user.id],
  }),
  write: one(write, {
    fields: [writingSubmission.writeId],
    references: [write.id],
  }),
}));
