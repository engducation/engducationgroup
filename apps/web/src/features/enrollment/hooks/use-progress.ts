"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UseProgressOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export interface ProgressState {
  isLoading: boolean;
  error: string | null;
}

export interface LessonProgress {
  readCompleted: boolean;
  writeCompleted: boolean;
  quizCompleted: boolean;
  videoCompleted: boolean;
  vocabularyReviewed: boolean;
  completedAt: string | null;
}

export function useProgress(options?: UseProgressOptions) {
  const router = useRouter();
  const [state, setState] = useState<ProgressState>({
    isLoading: false,
    error: null,
  });

  const markVideoCompleted = useCallback(
    async (lessonId: string) => {
      setState({ isLoading: true, error: null });
      try {
        const response = await fetch("/api/student/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId, type: "video" }),
        });

        const data = await response.json();

        if (data.success) {
          setState({ isLoading: false, error: null });
          options?.onSuccess?.();
        } else {
          throw new Error(data.message || "Có lỗi xảy ra");
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Có lỗi xảy ra";
        setState({ isLoading: false, error: errorMsg });
        options?.onError?.(errorMsg);
      }
    },
    [options]
  );

  const markReadCompleted = useCallback(
    async (lessonId: string) => {
      setState({ isLoading: true, error: null });
      try {
        const response = await fetch("/api/student/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId, type: "read" }),
        });

        const data = await response.json();

        if (data.success) {
          setState({ isLoading: false, error: null });
          options?.onSuccess?.();
        } else {
          throw new Error(data.message || "Có lỗi xảy ra");
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Có lỗi xảy ra";
        setState({ isLoading: false, error: errorMsg });
        options?.onError?.(errorMsg);
      }
    },
    [options]
  );

  const markQuizCompleted = useCallback(
    async (lessonId: string, score: number, totalQuestions: number, answers: number[]) => {
      setState({ isLoading: true, error: null });
      try {
        const response = await fetch("/api/student/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId,
            type: "quiz",
            score,
            totalQuestions,
            answers,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setState({ isLoading: false, error: null });
          options?.onSuccess?.();
        } else {
          throw new Error(data.message || "Có lỗi xảy ra");
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Có lỗi xảy ra";
        setState({ isLoading: false, error: errorMsg });
        options?.onError?.(errorMsg);
      }
    },
    [options]
  );

  const markWritingCompleted = useCallback(
    async (lessonId: string, content: string) => {
      setState({ isLoading: true, error: null });
      try {
        const response = await fetch("/api/student/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId, type: "writing", content }),
        });

        const data = await response.json();

        if (data.success) {
          setState({ isLoading: false, error: null });
          options?.onSuccess?.();
        } else {
          throw new Error(data.message || "Có lỗi xảy ra");
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Có lỗi xảy ra";
        setState({ isLoading: false, error: errorMsg });
        options?.onError?.(errorMsg);
      }
    },
    [options]
  );

  const markVocabularyReviewed = useCallback(
    async (lessonId: string) => {
      setState({ isLoading: true, error: null });
      try {
        const response = await fetch("/api/student/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId, type: "vocabulary" }),
        });

        const data = await response.json();

        if (data.success) {
          setState({ isLoading: false, error: null });
          options?.onSuccess?.();
        } else {
          throw new Error(data.message || "Có lỗi xảy ra");
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Có lỗi xảy ra";
        setState({ isLoading: false, error: errorMsg });
        options?.onError?.(errorMsg);
      }
    },
    [options]
  );

  const getLessonProgress = useCallback(async (lessonId: string): Promise<LessonProgress | null> => {
    try {
      const response = await fetch(`/api/student/progress?lessonId=${lessonId}`);
      const data = await response.json();
      return data.progress || null;
    } catch {
      return null;
    }
  }, []);

  return {
    ...state,
    markVideoCompleted,
    markReadCompleted,
    markQuizCompleted,
    markWritingCompleted,
    markVocabularyReviewed,
    getLessonProgress,
  };
}
