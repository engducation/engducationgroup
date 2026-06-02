/**
 * useQuizEngine - Hook xử lý Quiz tương tác cho Student
 *
 * PRD Section 9.11: User nhận điểm số, kết quả từng câu và giải thích.
 * PRD Section 10.3: Giải thích bắt buộc cho mỗi câu hỏi.
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import type {
  QuizSubmissionResult,
  QuizQuestionResult,
} from "@/features/learning-content/types";

export type QuizState = "idle" | "answering" | "submitted" | "reviewing";

interface UseQuizEngineOptions {
  quizId: string;
  questions: {
    id: string;
    question: string;
    options: string[];
    explanation: string;
  }[];
}

export function useQuizEngine({ quizId, questions }: UseQuizEngineOptions) {
  const [quizState, setQuizState] = useState<QuizState>("idle");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === totalQuestions;

  const currentQuestion = useMemo(
    () => questions[currentQuestionIndex] ?? null,
    [questions, currentQuestionIndex],
  );

  const answeredQuestions = useMemo(
    () =>
      questions.map((q) => ({
        ...q,
        selectedOption: answers[q.id] ?? null,
        isAnswered: answers[q.id] !== undefined,
      })),
    [questions, answers],
  );

  const setAnswer = useCallback((questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }, []);

  const goToQuestion = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalQuestions) {
        setCurrentQuestionIndex(index);
      }
    },
    [totalQuestions],
  );

  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((i) => i + 1);
    }
  }, [currentQuestionIndex, totalQuestions]);

  const prevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((i) => i - 1);
    }
  }, [currentQuestionIndex]);

  const submitQuiz = useCallback(async () => {
    if (!allAnswered) {
      setSubmitError("Vui lòng trả lời tất cả các câu hỏi trước khi nộp bài.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const { submitQuizAction } = await import("@/features/learning-content/actions");

      const response = await submitQuizAction(quizId, answers);

      if (!response.result) {
        setSubmitError(response.error ?? "Đã xảy ra lỗi khi nộp bài.");
        return;
      }

      setResult(response.result);
      setQuizState("submitted");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi nộp bài.");
    } finally {
      setIsSubmitting(false);
    }
  }, [allAnswered, answers, quizId]);

  const startReview = useCallback(() => {
    setQuizState("reviewing");
    setCurrentQuestionIndex(0);
  }, []);

  const resetQuiz = useCallback(() => {
    setAnswers({});
    setResult(null);
    setQuizState("idle");
    setCurrentQuestionIndex(0);
    setSubmitError(null);
  }, []);

  return {
    quizState,
    answers,
    result,
    isSubmitting,
    submitError,
    currentQuestionIndex,
    totalQuestions,
    answeredCount,
    allAnswered,
    currentQuestion,
    answeredQuestions,
    setAnswer,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    submitQuiz,
    startReview,
    resetQuiz,
  };
}
