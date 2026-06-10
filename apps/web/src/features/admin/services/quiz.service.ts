import { db } from "@/db";
import { quiz, quizQuestion } from "@/db/schema/learning-content";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function getQuizzes(lessonId: string) {
  return db
    .select()
    .from(quiz)
    .where(eq(quiz.lessonId, lessonId));
}

export async function getQuizById(quizId: string) {
  return db
    .select()
    .from(quiz)
    .where(eq(quiz.id, quizId));
}

export async function createQuiz(lessonId: string) {
  const id = nanoid();
  await db.insert(quiz).values({
    id,
    lessonId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}

export async function deleteQuiz(id: string) {
  await db.delete(quiz).where(eq(quiz.id, id));
  return { success: true };
}

export async function getQuizQuestions(quizId: string) {
  return db
    .select()
    .from(quizQuestion)
    .where(eq(quizQuestion.quizId, quizId))
    .orderBy(quizQuestion.orderIndex);
}

export async function createQuizQuestion(data: {
  quizId: string;
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
}) {
  const existing = await db
    .select({ maxOrder: sql<number>`max(${quizQuestion.orderIndex})` })
    .from(quizQuestion)
    .where(eq(quizQuestion.quizId, data.quizId));
  const maxOrder = existing[0]?.maxOrder ?? -1;

  const id = nanoid();
  await db.insert(quizQuestion).values({
    id,
    quizId: data.quizId,
    question: data.question,
    options: JSON.stringify(data.options),
    correctOption: data.correctOption,
    explanation: data.explanation,
    orderIndex: maxOrder + 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return id;
}

export async function updateQuizQuestion(
  id: string,
  data: {
    question?: string;
    options?: string[];
    correctOption?: number;
    explanation?: string;
  }
) {
  const { options: optionsArr, ...rest } = data;
  await db
    .update(quizQuestion)
    .set({
      ...rest,
      ...(optionsArr !== undefined ? { options: JSON.stringify(optionsArr) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(quizQuestion.id, id));
  return { success: true };
}

export async function deleteQuizQuestion(id: string) {
  await db.delete(quizQuestion).where(eq(quizQuestion.id, id));
  return { success: true };
}
