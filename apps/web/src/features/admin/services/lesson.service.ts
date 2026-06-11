import { db } from "@/db";
import { lesson, lessonVideo, quiz, quizQuestion, read, write, module, lessonVocabulary, lessonVocabularyItem, vocabulary } from "@/db/schema/learning-content";
import { eq, asc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { PublicationStatus } from "./course.service";
import { normalizeStatus, denormalizeStatus } from "./course.service";

export type { PublicationStatus };

export interface AdminLessonInput {
  moduleId: string;
  title: string;
  description?: string;
  status?: PublicationStatus;
  orderIndex?: number;
  hasRead?: boolean;
  hasWrite?: boolean;
  hasQuiz?: boolean;
  hasVideo?: boolean;
  hasVocabulary?: boolean;
  isRequired?: boolean;
}

export interface AdminQuizQuestionInput {
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

export function serializeLessonRecord<T extends { status?: string | null }>(record: T | null | undefined) {
  if (!record) return record;
  return {
    ...record,
    status: denormalizeStatus(record.status),
  };
}

export async function ensureLessonExists(lessonId: string) {
  const existing = await db.query.lesson.findFirst({ where: eq(lesson.id, lessonId) });
  if (!existing) throw new Error("Bài học không tồn tại");
  return existing;
}

export async function getLessonsByModule(moduleId: string) {
  return db.query.lesson.findMany({
    where: eq(lesson.moduleId, moduleId),
    orderBy: [asc(lesson.orderIndex)],
  });
}

export async function getLessonById(lessonId: string) {
  return db.query.lesson.findFirst({ where: eq(lesson.id, lessonId) });
}

async function nextLessonOrderIndex(moduleId: string) {
  const [row] = await db
    .select({ max: sql<number>`coalesce(max(${lesson.orderIndex}), -1)` })
    .from(lesson)
    .where(eq(lesson.moduleId, moduleId));

  return (row?.max ?? -1) + 1;
}

export async function createAdminLesson(input: AdminLessonInput) {
  const existingModule = await db.query.module.findFirst({ where: eq(module.id, input.moduleId) });
  if (!existingModule) throw new Error("Chương học không tồn tại");

  const id = nanoid();
  const orderIndex = input.orderIndex ?? await nextLessonOrderIndex(input.moduleId);

  await db.insert(lesson).values({
    id,
    moduleId: input.moduleId,
    title: input.title,
    description: input.description ?? null,
    status: normalizeStatus(input.status) ?? "DRAFT",
    orderIndex,
    hasRead: input.hasRead ?? false,
    hasWrite: input.hasWrite ?? false,
    hasQuiz: input.hasQuiz ?? false,
    hasVideo: input.hasVideo ?? false,
    hasVocabulary: input.hasVocabulary ?? false,
    isRequired: input.isRequired ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return serializeLessonRecord(await db.query.lesson.findFirst({ where: eq(lesson.id, id) }));
}

export async function updateAdminLesson(lessonId: string, input: Partial<AdminLessonInput>) {
  await ensureLessonExists(lessonId);

  await db.update(lesson).set({
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.status !== undefined ? { status: normalizeStatus(input.status) } : {}),
    ...(input.orderIndex !== undefined ? { orderIndex: input.orderIndex } : {}),
    ...(input.hasRead !== undefined ? { hasRead: input.hasRead } : {}),
    ...(input.hasWrite !== undefined ? { hasWrite: input.hasWrite } : {}),
    ...(input.hasQuiz !== undefined ? { hasQuiz: input.hasQuiz } : {}),
    ...(input.hasVideo !== undefined ? { hasVideo: input.hasVideo } : {}),
    ...(input.hasVocabulary !== undefined ? { hasVocabulary: input.hasVocabulary } : {}),
    ...(input.isRequired !== undefined ? { isRequired: input.isRequired } : {}),
    updatedAt: new Date(),
  }).where(eq(lesson.id, lessonId));

  return serializeLessonRecord(await db.query.lesson.findFirst({ where: eq(lesson.id, lessonId) }));
}

export async function deleteAdminLesson(lessonId: string) {
  await ensureLessonExists(lessonId);
  await db.delete(lesson).where(eq(lesson.id, lessonId));
  return { id: lessonId };
}

export async function updateLessonOrder(lessonId: string, orderIndex: number, moduleId?: string) {
  const updateData: { orderIndex: number; moduleId?: string } = { orderIndex };
  if (moduleId) {
    updateData.moduleId = moduleId;
  }

  await db.update(lesson)
    .set({ orderIndex, updatedAt: new Date() })
    .where(eq(lesson.id, lessonId));

  return { id: lessonId, orderIndex };
}

export async function upsertLessonRead(lessonId: string, data: { title: string; content: string }) {
  await ensureLessonExists(lessonId);

  const existing = await db.query.read.findFirst({ where: eq(read.lessonId, lessonId) });

  if (existing) {
    await db.update(read).set({
      title: data.title,
      content: data.content,
      updatedAt: new Date()
    }).where(eq(read.lessonId, lessonId));
  } else {
    await db.insert(read).values({
      id: nanoid(),
      lessonId,
      title: data.title,
      content: data.content,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  return { success: true };
}

export async function upsertLessonWrite(lessonId: string, data: {
  prompt: string;
  gradingCriteria?: string;
  wordCountGuidance?: number;
  aiPromptId?: string;
  maxAiRevisions?: number;
}) {
  await ensureLessonExists(lessonId);

  const existing = await db.query.write.findFirst({ where: eq(write.lessonId, lessonId) });

  if (existing) {
    await db.update(write).set({
      prompt: data.prompt,
      gradingCriteria: data.gradingCriteria ?? null,
      wordCountGuidance: data.wordCountGuidance ?? null,
      aiPromptId: data.aiPromptId ?? null,
      maxAiRevisions: data.maxAiRevisions ?? 5,
      updatedAt: new Date()
    }).where(eq(write.lessonId, lessonId));
  } else {
    await db.insert(write).values({
      id: nanoid(),
      lessonId,
      prompt: data.prompt,
      gradingCriteria: data.gradingCriteria ?? null,
      wordCountGuidance: data.wordCountGuidance ?? null,
      aiPromptId: data.aiPromptId ?? null,
      maxAiRevisions: data.maxAiRevisions ?? 5,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  return { success: true };
}

export async function upsertLessonVideo(lessonId: string, data: {
  title: string;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  description?: string;
  durationSeconds?: number;
}) {
  await ensureLessonExists(lessonId);

  const existing = await db.query.lessonVideo.findFirst({ where: eq(lessonVideo.lessonId, lessonId) });

  if (existing) {
    await db.update(lessonVideo).set({
      title: data.title,
      description: data.description ?? null,
      cloudinaryPublicId: data.cloudinaryPublicId,
      cloudinaryUrl: data.cloudinaryUrl,
      durationSeconds: data.durationSeconds ?? null,
      updatedAt: new Date()
    }).where(eq(lessonVideo.lessonId, lessonId));
  } else {
    await db.insert(lessonVideo).values({
      id: nanoid(),
      lessonId,
      title: data.title,
      description: data.description ?? null,
      cloudinaryPublicId: data.cloudinaryPublicId,
      cloudinaryUrl: data.cloudinaryUrl,
      durationSeconds: data.durationSeconds ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  return { success: true };
}

export async function upsertLessonQuiz(lessonId: string, data: {
  title?: string;
  passingPercentage?: number | null;
  questions: AdminQuizQuestionInput[];
}) {
  await ensureLessonExists(lessonId);

  // Filter out empty questions (questions without text)
  const validQuestions = data.questions.filter((q) => q.question.trim() !== "");

  // If no valid questions, return early
  if (validQuestions.length === 0) {
    return { success: true, message: "No valid questions to save" };
  }

  const existing = await db.query.quiz.findFirst({ where: eq(quiz.lessonId, lessonId) });

  if (existing) {
    await db.delete(quizQuestion).where(eq(quizQuestion.quizId, existing.id));
    await db.delete(quiz).where(eq(quiz.id, existing.id));
  }

  const quizId = nanoid();
  await db.insert(quiz).values({
    id: quizId,
    lessonId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  for (let i = 0; i < validQuestions.length; i++) {
    const q = validQuestions[i];
    await db.insert(quizQuestion).values({
      id: nanoid(),
      quizId,
      question: q.question,
      options: JSON.stringify(q.options || []),
      correctOption: q.correctOption ?? 0,
      explanation: q.explanation ?? "",
      orderIndex: i,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return { success: true, quizId, questionCount: validQuestions.length };
}

export async function getLessonContent(lessonId: string) {
  const lessonData = await db.query.lesson.findFirst({ where: eq(lesson.id, lessonId) });
  if (!lessonData) return null;

  const [readContent, writeContent, videoContent, quizContent, vocabList] = await Promise.all([
    db.query.read.findFirst({ where: eq(read.lessonId, lessonId) }),
    db.query.write.findFirst({ where: eq(write.lessonId, lessonId) }),
    db.query.lessonVideo.findFirst({ where: eq(lessonVideo.lessonId, lessonId) }),
    db.query.quiz.findFirst({ where: eq(quiz.lessonId, lessonId) }),
    getVocabulariesByLesson(lessonId),
  ]);

  let questions: typeof quizQuestion.$inferSelect[] = [];
  if (quizContent) {
    questions = await db.query.quizQuestion.findMany({
      where: eq(quizQuestion.quizId, quizContent.id),
      orderBy: [asc(quizQuestion.orderIndex)],
    });
  }

  return {
    ...lessonData,
    read: readContent ?? null,
    write: writeContent ?? null,
    video: videoContent ?? null,
    quiz: quizContent ? { ...quizContent, questions } : null,
    vocabulary: vocabList,
  };
}

// Lesson Vocabulary CRUD
export interface AdminLessonVocabularyInput {
  word: string;
  meaning: string;
  partOfSpeech: string;
  phonetic?: string;
  example?: string;
  notes?: string;
}

export async function getVocabulariesByLesson(lessonId: string) {
  return db.query.lessonVocabularyItem.findMany({
    where: eq(lessonVocabularyItem.lessonId, lessonId),
    orderBy: [asc(lessonVocabularyItem.orderIndex)],
  });
}

export async function createLessonVocabulary(lessonId: string, input: AdminLessonVocabularyInput) {
  await ensureLessonExists(lessonId);

  const [existingCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(lessonVocabularyItem)
    .where(eq(lessonVocabularyItem.lessonId, lessonId));

  const orderIndex = (existingCount?.count ?? 0);

  const id = nanoid();
  await db.insert(lessonVocabularyItem).values({
    id,
    lessonId,
    word: input.word,
    meaning: input.meaning,
    partOfSpeech: input.partOfSpeech,
    phonetic: input.phonetic ?? null,
    example: input.example ?? null,
    notes: input.notes ?? null,
    orderIndex,
    status: "DRAFT",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return db.query.lessonVocabularyItem.findFirst({ where: eq(lessonVocabularyItem.id, id) });
}

export async function updateLessonVocabularyItem(vocabularyId: string, input: Partial<AdminLessonVocabularyInput & { status?: string }>) {
  const existing = await db.query.lessonVocabularyItem.findFirst({
    where: eq(lessonVocabularyItem.id, vocabularyId)
  });
  if (!existing) throw new Error("Từ vựng không tồn tại");

  await db.update(lessonVocabularyItem).set({
    ...(input.word !== undefined ? { word: input.word } : {}),
    ...(input.meaning !== undefined ? { meaning: input.meaning } : {}),
    ...(input.partOfSpeech !== undefined ? { partOfSpeech: input.partOfSpeech } : {}),
    ...(input.phonetic !== undefined ? { phonetic: input.phonetic } : {}),
    ...(input.example !== undefined ? { example: input.example } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    ...(input.status !== undefined ? { status: normalizeStatus(input.status as PublicationStatus) } : {}),
    updatedAt: new Date(),
  }).where(eq(lessonVocabularyItem.id, vocabularyId));

  return db.query.lessonVocabularyItem.findFirst({ where: eq(lessonVocabularyItem.id, vocabularyId) });
}

export async function deleteLessonVocabularyItem(vocabularyId: string) {
  const existing = await db.query.lessonVocabularyItem.findFirst({
    where: eq(lessonVocabularyItem.id, vocabularyId)
  });
  if (!existing) throw new Error("Từ vựng không tồn tại");

  await db.delete(lessonVocabularyItem).where(eq(lessonVocabularyItem.id, vocabularyId));
  return { id: vocabularyId };
}

export async function syncLessonVocabulary(lessonId: string, vocabularyList: Array<{
  id?: string;
  word: string;
  meaning: string;
  partOfSpeech: string;
  phonetic?: string;
  example?: string;
  notes?: string;
}>) {
  await ensureLessonExists(lessonId);

  // Delete all existing vocabularies for this lesson
  await db.delete(lessonVocabularyItem).where(eq(lessonVocabularyItem.lessonId, lessonId));

  // Insert all new vocabularies
  for (let i = 0; i < vocabularyList.length; i++) {
    const vocab = vocabularyList[i];
    await db.insert(lessonVocabularyItem).values({
      id: vocab.id || nanoid(),
      lessonId,
      word: vocab.word,
      meaning: vocab.meaning,
      partOfSpeech: vocab.partOfSpeech,
      phonetic: vocab.phonetic ?? null,
      example: vocab.example ?? null,
      notes: vocab.notes ?? null,
      orderIndex: i,
      status: "DRAFT",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return getVocabulariesByLesson(lessonId);
}
