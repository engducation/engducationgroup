/**
 * useWritingAssistant - Hook quản lý state cho AI Writing Assistant.
 *
 * - Giữ nội dung bài viết của học viên trong state.
 * - Đếm số từ theo thời gian thực để validate 5-500 từ ngay phía client.
 * - Gọi Server Action `submitWritingAction` để phân tích + lưu DB.
 * - Trả về `analysis` để UI render highlight + popover.
 */

"use client";

import { useCallback, useMemo, useState } from "react";
import type { WritingAnalysis } from "@/features/learning-content/types";

export const MIN_WORDS = 5;
export const MAX_WORDS = 500;

interface UseWritingAssistantOptions {
  writeId: string;
  /** Phân tích đã có sẵn (vd: reload trang) — set vào state khi mount. */
  initialAnalysis?: WritingAnalysis | null;
  initialContent?: string;
}

interface UseWritingAssistantResult {
  content: string;
  setContent: (value: string) => void;
  wordCount: number;
  isValid: boolean;
  isSubmitting: boolean;
  error: string | null;
  analysis: WritingAnalysis | null;
  submissionId: string | null;
  submit: () => Promise<void>;
  reset: () => void;
  applyCorrection: (replacement: string) => void;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function useWritingAssistant(
  options: UseWritingAssistantOptions,
): UseWritingAssistantResult {
  const { writeId, initialAnalysis = null, initialContent = "" } = options;

  const [content, setContentState] = useState<string>(initialContent);
  const [analysis, setAnalysis] = useState<WritingAnalysis | null>(initialAnalysis);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = useMemo(() => countWords(content), [content]);
  const isValid = wordCount >= MIN_WORDS && wordCount <= MAX_WORDS;

  const setContent = useCallback((value: string) => {
    setContentState(value);
    if (error) setError(null);
  }, [error]);

  const submit = useCallback(async () => {
    if (!isValid) {
      setError(
        wordCount < MIN_WORDS
          ? `Bài viết cần tối thiểu ${MIN_WORDS} từ.`
          : `Bài viết không được vượt quá ${MAX_WORDS} từ.`,
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { submitWritingAction } = await import(
        "@/features/learning-content/actions-writing"
      );
      const response = await submitWritingAction({ writeId, content });

      if (!response.success) {
        setError(response.error || "Đã xảy ra lỗi khi phân tích bài viết.");
        return;
      }

      setAnalysis(response.data.analysis);
      setSubmissionId(response.data.submissionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.");
    } finally {
      setIsSubmitting(false);
    }
  }, [content, isValid, wordCount, writeId]);

  const reset = useCallback(() => {
    setContentState("");
    setAnalysis(null);
    setSubmissionId(null);
    setError(null);
  }, []);

  const applyCorrection = useCallback(
    (replacement: string) => {
      // Convenience for the "replace next mistake" UX. We only swap the latest
      // occurrence to avoid touching earlier content; this is intentionally
      // simple so the student can keep control of the rewrite.
      if (!analysis) return;
      const lastError = analysis.errors[analysis.errors.length - 1];
      if (!lastError) return;
      setContentState((prev) => prev.replace(lastError.original, replacement));
    },
    [analysis],
  );

  return {
    content,
    setContent,
    wordCount,
    isValid,
    isSubmitting,
    error,
    analysis,
    submissionId,
    submit,
    reset,
    applyCorrection,
  };
}
