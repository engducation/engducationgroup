/**
 * useStudentLearning - Hook quản lý học tập cho Student
 *
 * Cung cấp trạng thái và hành động học tập cơ bản.
 */

"use client";

import { useState, useCallback } from "react";
import { useAction } from "next-safe-action/hooks";
import type { LessonWithContent, CourseProgressSummary } from "@/features/learning-content/types";

interface UseStudentLearningOptions {
  onError?: (error: string) => void;
  onSuccess?: (data: unknown) => void;
}

export function useStudentLearning(_options?: UseStudentLearningOptions) {
  const [currentLesson, setCurrentLesson] = useState<LessonWithContent | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgressSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadLesson = useCallback(async (lessonId: string) => {
    setIsLoading(true);
    try {
      const { getLessonForStudent } = await import("@/features/learning-content/actions");
      const lesson = await getLessonForStudent(lessonId);
      setCurrentLesson(lesson);
      return lesson;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCourseProgress = useCallback(async (courseId: string) => {
    setIsLoading(true);
    try {
      const { getCourseProgressSummary } = await import("@/features/learning-content/actions");
      const progress = await getCourseProgressSummary(courseId);
      setCourseProgress(progress);
      return progress;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    currentLesson,
    courseProgress,
    isLoading,
    loadLesson,
    loadCourseProgress,
    setCurrentLesson,
  };
}
