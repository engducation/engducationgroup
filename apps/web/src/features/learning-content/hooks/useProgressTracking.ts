/**
 * useProgressTracking - Hook theo dõi tiến độ học tập
 *
 * PRD Section 10.5: Lesson hoàn thành khi User hoàn thành tất cả các phần bắt buộc.
 * PRD Section 10.5: Tiến độ Course tính theo số Lesson hoàn thành.
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import type { UpdateProgressInput, LessonWithContent } from "@/features/learning-content/types";

export type CompletionStatus = "not_started" | "in_progress" | "completed";

export interface LessonCompletionState {
  read: boolean;
  write: boolean;
  quiz: boolean;
  video: boolean;
  vocabulary: boolean;
}

export function useProgressTracking(lesson: LessonWithContent | null) {
  const [completedParts, setCompletedParts] = useState<LessonCompletionState>({
    read: false,
    write: false,
    quiz: false,
    video: false,
    vocabulary: false,
  });

  const requiredParts = useMemo(() => {
    if (!lesson) return [];
    const parts: string[] = [];
    if (lesson.hasRead && lesson.isRequired) parts.push("read");
    if (lesson.hasWrite && lesson.isRequired) parts.push("write");
    if (lesson.hasQuiz && lesson.isRequired) parts.push("quiz");
    if (lesson.hasVideo && lesson.isRequired) parts.push("video");
    if (lesson.hasVocabulary && lesson.isRequired) parts.push("vocabulary");
    return parts;
  }, [lesson]);

  const optionalParts = useMemo(() => {
    if (!lesson) return [];
    const parts: string[] = [];
    if (lesson.hasRead && !lesson.isRequired) parts.push("read");
    if (lesson.hasWrite && !lesson.isRequired) parts.push("write");
    if (lesson.hasQuiz && !lesson.isRequired) parts.push("quiz");
    if (lesson.hasVideo && !lesson.isRequired) parts.push("video");
    if (lesson.hasVocabulary && !lesson.isRequired) parts.push("vocabulary");
    return parts;
  }, [lesson]);

  const completedCount = useMemo(
    () => Object.values(completedParts).filter(Boolean).length,
    [completedParts],
  );

  const requiredCompletedCount = useMemo(
    () => requiredParts.filter((p) => completedParts[p as keyof LessonCompletionState]).length,
    [completedParts, requiredParts],
  );

  const isLessonComplete = useMemo(
    () => requiredParts.every((p) => completedParts[p as keyof LessonCompletionState]),
    [completedParts, requiredParts],
  );

  const completionPercentage = useMemo(() => {
    const total = requiredParts.length;
    if (total === 0) return 0;
    return Math.round((requiredCompletedCount / total) * 100);
  }, [requiredCompletedCount, requiredParts]);

  const completionStatus = useMemo((): CompletionStatus => {
    if (isLessonComplete) return "completed";
    if (completedCount > 0) return "in_progress";
    return "not_started";
  }, [isLessonComplete, completedCount]);

  const markPartComplete = useCallback(
    (part: keyof LessonCompletionState) => {
      setCompletedParts((prev) => ({ ...prev, [part]: true }));
    },
    [],
  );

  const markPartIncomplete = useCallback(
    (part: keyof LessonCompletionState) => {
      setCompletedParts((prev) => ({ ...prev, [part]: false }));
    },
    [],
  );

  const syncProgressToServer = useCallback(
    async (lessonId: string) => {
      const { updateStudentProgress } = await import("@/features/learning-content/actions");
      const input: UpdateProgressInput = {
        lessonId,
        readCompleted: completedParts.read || undefined,
        writeCompleted: completedParts.write || undefined,
        quizCompleted: completedParts.quiz || undefined,
        videoCompleted: completedParts.video || undefined,
        vocabularyReviewed: completedParts.vocabulary || undefined,
      };
      await updateStudentProgress(input);
    },
    [completedParts],
  );

  const initializeFromServer = useCallback(
    (serverProgress: {
      readCompleted?: boolean;
      writeCompleted?: boolean;
      quizCompleted?: boolean;
      videoCompleted?: boolean;
      vocabularyReviewed?: boolean;
    }) => {
      setCompletedParts({
        read: serverProgress.readCompleted ?? false,
        write: serverProgress.writeCompleted ?? false,
        quiz: serverProgress.quizCompleted ?? false,
        video: serverProgress.videoCompleted ?? false,
        vocabulary: serverProgress.vocabularyReviewed ?? false,
      });
    },
    [],
  );

  return {
    completedParts,
    requiredParts,
    optionalParts,
    completedCount,
    requiredCompletedCount,
    isLessonComplete,
    completionPercentage,
    completionStatus,
    markPartComplete,
    markPartIncomplete,
    syncProgressToServer,
    initializeFromServer,
  };
}
