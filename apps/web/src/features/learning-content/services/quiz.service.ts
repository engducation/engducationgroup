/**
 * Quiz Scoring Engine - Chấm điểm Quiz với giải thích bắt buộc
 *
 * PRD Section 9.6: Mỗi câu hỏi bắt buộc có giải thích.
 * PRD Section 9.11: User nhận điểm số, kết quả từng câu và giải thích.
 * PRD Section 10.3: Quiz rules - at least 2 options, at least 1 correct, mandatory explanation.
 */

import { db } from "@/db";
import {
  quiz,
  quizQuestion,
  quizAttempt,
  lesson,
  module,
} from "@/db/schema/learning-content";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import type {
  QuizSubmissionResult,
  QuizQuestionResult,
} from "@/features/learning-content/types";

export interface SubmitQuizInput {
  userId: string;
  quizId: string;
  answers: Record<string, number>; // questionId -> selectedOptionIndex
}

export async function getQuizWithQuestions(quizId: string) {
  return db.query.quiz.findFirst({
    where: eq(quiz.id, quizId),
    with: {
      questions: {
        orderBy: (q, { asc }) => [asc(q.orderIndex)],
      },
      lesson: {
        with: {
          module: true,
        },
      },
    },
  });
}

/**
 * Core scoring engine: computes score, builds per-question results with explanation.
 * All explanations are mandatory per PRD, so they are always present in the result.
 */
export function scoreQuiz(
  questions: {
    id: string;
    question: string;
    options: string;
    correctOption: number;
    explanation: string;
  }[],
  answers: Record<string, number>,
): {
  score: number;
  totalQuestions: number;
  results: QuizQuestionResult[];
} {
  let score = 0;
  const results: QuizQuestionResult[] = [];

  for (const q of questions) {
    const parsedOptions: string[] = JSON.parse(q.options);
    const userAnswer = answers[q.id] ?? null;
    const isCorrect = userAnswer === q.correctOption;

    if (isCorrect) score++;

    results.push({
      questionId: q.id,
      question: q.question,
      options: parsedOptions,
      userAnswer,
      correctOption: q.correctOption,
      isCorrect,
      explanation: q.explanation,
    });
  }

  return { score, totalQuestions: questions.length, results };
}

/**
 * Submit and score a quiz attempt.
 * Stores the attempt in DB and returns structured result.
 */
export async function submitQuiz(input: SubmitQuizInput): Promise<{
  result: QuizSubmissionResult | null;
  error: string | null;
}> {
  const { userId, quizId, answers } = input;

  const quizData = await getQuizWithQuestions(quizId);
  if (!quizData) return { result: null, error: "Quiz không tồn tại" };
  if (!quizData.questions || quizData.questions.length === 0) {
    return { result: null, error: "Quiz chưa có câu hỏi nào" };
  }

  // Verify all required question fields
  for (const q of quizData.questions) {
    if (q.explanation.trim().length === 0) {
      return { result: null, error: `Câu hỏi "${q.question}" chưa có giải thích. Mỗi câu hỏi bắt buộc phải có giải thích.` };
    }
    const opts: string[] = JSON.parse(q.options);
    if (opts.length < 2) {
      return { result: null, error: `Câu hỏi "${q.question}" phải có ít nhất 2 đáp án` };
    }
    if (q.correctOption < 0 || q.correctOption >= opts.length) {
      return { result: null, error: `Câu hỏi "${q.question}" có đáp án đúng không hợp lệ` };
    }
  }

  const { score, totalQuestions, results } = scoreQuiz(quizData.questions, answers);
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const attemptId = nanoid();

  await db.insert(quizAttempt).values({
    id: attemptId,
    userId,
    quizId,
    score,
    totalQuestions,
    answers: JSON.stringify(answers),
  });

  return {
    result: {
      attemptId,
      score,
      totalQuestions,
      percentage,
      results,
      completedAt: new Date(),
    },
    error: null,
  };
}

/**
 * Get all attempts for a user on a specific quiz.
 */
export async function getQuizAttempts(userId: string, quizId: string) {
  return db.query.quizAttempt.findMany({
    where: and(eq(quizAttempt.userId, userId), eq(quizAttempt.quizId, quizId)),
    orderBy: (a, { desc }) => [desc(a.createdAt)],
  });
}

/**
 * Get best attempt for a user on a specific quiz.
 */
export async function getBestQuizAttempt(userId: string, quizId: string) {
  const attempts = await db.query.quizAttempt.findMany({
    where: and(eq(quizAttempt.userId, userId), eq(quizAttempt.quizId, quizId)),
  });

  if (attempts.length === 0) return null;
  return attempts.reduce((best, current) => (current.score > best.score ? current : best));
}

/**
 * Validate quiz structure before publishing.
 * Called internally when creating or updating a quiz.
 */
export function validateQuizStructure(questions: {
  question: string;
  options: string;
  correctOption: number;
  explanation: string;
}[]): string[] {
  const errors: string[] = [];

  if (questions.length === 0) {
    errors.push("Quiz phải có ít nhất 1 câu hỏi");
    return errors;
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];

    const opts: string[] = JSON.parse(q.options);
    if (opts.length < 2) {
      errors.push(`Câu hỏi ${i + 1}: phải có ít nhất 2 đáp án`);
    }

    if (q.correctOption < 0 || q.correctOption >= opts.length) {
      errors.push(`Câu hỏi ${i + 1}: đáp án đúng không hợp lệ (phải nằm trong khoảng 0-${opts.length - 1})`);
    }

    if (!q.explanation || q.explanation.trim() === "") {
      errors.push(`Câu hỏi ${i + 1}: bắt buộc phải có giải thích`);
    }
  }

  return errors;
}

/**
 * Upsert a complete quiz with its questions.
 */
export async function upsertQuizWithQuestions(
  lessonId: string,
  questions: {
    question: string;
    options: string[];
    correctOption: number;
    explanation: string;
  }[],
) {
  const errors = validateQuizStructure(
    questions.map((q) => ({
      ...q,
      options: JSON.stringify(q.options),
    })),
  );
  if (errors.length > 0) {
    throw new Error(`Lỗi cấu trúc Quiz: ${errors.join("; ")}`);
  }

  const existing = await db.query.quiz.findFirst({ where: eq(quiz.lessonId, lessonId) });

  const quizId = existing?.id ?? nanoid();

  if (existing) {
    // Delete existing questions and re-insert
    await db.delete(quizQuestion).where(eq(quizQuestion.quizId, existing.id));
    await db.update(quiz).set({ updatedAt: new Date() }).where(eq(quiz.id, existing.id));
  } else {
    await db.insert(quiz).values({ id: quizId, lessonId });
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    await db.insert(quizQuestion).values({
      id: nanoid(),
      quizId,
      question: q.question,
      options: JSON.stringify(q.options),
      correctOption: q.correctOption,
      explanation: q.explanation,
      orderIndex: i,
    });
  }

  return { quizId };
}
