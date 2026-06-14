/**
 * useWritingLesson - Hook quản lý state cho bài Writing trong lesson.
 *
 * Hành vi (cập nhật theo tối ưu hóa hạ tầng):
 *   1. Khi mount, gọi `loadWritingForLessonAction(lessonId)` để fetch writeId
 *      + submission mới nhất (DRAFT hoặc AI_GRADED) -> restore content + analysis.
 *   2. KHÔNG còn auto-save. Học viên phải bấm nút "Lưu bản nháp" thì mới lưu
 *      DRAFT lên DB (gọi `saveWritingDraftAction`). Mục đích: cắt giảm số
 *      request không cần thiết trong phiên test, tránh vượt rate-limit Groq ở
 *      production.
 *   3. Khi user bấm "Nộp bài", gọi `submitWritingAction` (chạy AI thật) và
 *      cập nhật analysis -> gọi `onComplete` để parent đánh dấu hoàn thành.
 *   4. Khi user bấm "Viết lại", reset analysis -> cho phép soạn bản mới.
 *
 * Lưu ý: Server Action `submitWritingAction` đã tự gọi
 * `upsertWriteProgress` bên trong, nên hook KHÔNG cần gọi thêm
 * `/api/student/progress` sau khi submit thành công.
 */

"use client";

import * as React from "react";
import type { WritingAnalysis } from "@/features/learning-content/types";

interface UseWritingLessonOptions {
  lessonId: string;
  initialCompleted: boolean;
  onSubmitted?: () => void;
}

interface UseWritingLessonResult {
  /** Cached text the student is editing. */
  content: string;
  setContent: (value: string) => void;
  /** writeId resolved from lessonId, or null if lesson has no writing. */
  writeId: string | null;
  /** Loading initial submission from DB. */
  isLoading: boolean;
  /** AI analysis result (only present after a real submit). */
  analysis: WritingAnalysis | null;
  /** Whether the most recent submission is a DRAFT (manually saved) or AI_GRADED. */
  submissionStatus: "DRAFT" | "AI_GRADED" | null;
  /** AI score 0-100, only available after submit. */
  score: number | null;
  /** True when the lesson is already marked complete in student_progress. */
  isCompleted: boolean;
  /** True while manual save-draft is in flight. */
  isSavingDraft: boolean;
  /** Last save timestamp (epoch ms) for the "Đã lưu cách đây Xs" hint. */
  lastSavedAt: number | null;
  /** True while AI is grading. */
  isSubmitting: boolean;
  error: string | null;
  /** True once a final submission has been made (cannot save anymore). */
  isReadOnly: boolean;
  /** True if the current content differs from the last saved draft. */
  hasUnsavedChanges: boolean;
  /** Manually persist the current content as a DRAFT. */
  saveDraft: () => Promise<boolean>;
  submit: () => Promise<void>;
  resetForRewrite: () => void;
}

type SubmissionStatus = UseWritingLessonResult["submissionStatus"];

export function useWritingLesson({
  lessonId,
  initialCompleted,
  onSubmitted,
}: UseWritingLessonOptions): UseWritingLessonResult {
  const [content, setContentState] = React.useState("");
  const [lastSavedContent, setLastSavedContent] = React.useState("");
  const [writeId, setWriteId] = React.useState<string | null>(null);
  const [analysis, setAnalysis] = React.useState<WritingAnalysis | null>(null);
  const [score, setScore] = React.useState<number | null>(null);
  const [submissionStatus, setSubmissionStatus] =
    React.useState<SubmissionStatus>(null);
  const [isCompleted, setIsCompleted] = React.useState(initialCompleted);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSavingDraft, setIsSavingDraft] = React.useState(false);
  const [lastSavedAt, setLastSavedAt] = React.useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Track whether a final submission has been made (locks the editor).
  const isFinalized = React.useMemo(
    () => submissionStatus === "AI_GRADED",
    [submissionStatus],
  );

  // Detect dirty state so the UI can warn the user about unsaved changes.
  const hasUnsavedChanges = content !== lastSavedContent;

  // ─── Load initial state on mount ────────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const { loadWritingForLessonAction } = await import(
          "@/features/learning-content/actions-writing"
        );
        const res = await loadWritingForLessonAction({ lessonId });
        if (cancelled) return;
        if (!res.success) {
          setError(res.error || "Không thể tải bài viết.");
          return;
        }
        setWriteId(res.data.writeId);
        if (res.data.submission) {
          setContentState(res.data.submission.content);
          setLastSavedContent(res.data.submission.content);
          setScore(res.data.submission.score);
          setAnalysis(res.data.submission.analysis);
          setSubmissionStatus(res.data.submission.status as SubmissionStatus);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lessonId]);

  // ─── Manual save draft (no auto-save to cut API cost) ──────────────────
  // Ref-based guard against double-clicks while a save is in flight.
  const saveDraftInFlightRef = React.useRef(false);
  const saveDraft = React.useCallback(async (): Promise<boolean> => {
    if (saveDraftInFlightRef.current) return false;
    if (isSavingDraft) return false;
    if (!writeId) {
      setError("Bài học này chưa cấu hình bài viết.");
      return false;
    }
    if (isFinalized) {
      return false;
    }
    if (content.trim().length === 0) {
      setError("Không thể lưu bài viết trống.");
      return false;
    }

    saveDraftInFlightRef.current = true;
    setIsSavingDraft(true);
    setError(null);
    try {
      const { saveWritingDraftAction } = await import(
        "@/features/learning-content/actions-writing"
      );
      const res = await saveWritingDraftAction({ writeId, content });
      if (!res.success) {
        setError(res.error || "Không thể lưu bản nháp.");
        return false;
      }
      setLastSavedAt(Date.now());
      setLastSavedContent(content);
      setSubmissionStatus("DRAFT");
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Lỗi khi lưu bản nháp.",
      );
      return false;
    } finally {
      setIsSavingDraft(false);
      saveDraftInFlightRef.current = false;
    }
  }, [content, isFinalized, isSavingDraft, writeId]);

  // ─── Submit (calls AI, marks lesson complete) ───────────────────────────
  // Ref-based guard so that even if a user double-clicks the submit button
  // before React state (`isSubmitting`) has propagated, we never issue
  // more than one submit in flight.
  const submitInFlightRef = React.useRef(false);
  const submit = React.useCallback(async () => {
    if (submitInFlightRef.current) return;
    if (isSubmitting) return;
    if (!writeId) {
      setError("Bài học này chưa cấu hình bài viết.");
      return;
    }
    if (content.trim().length < 5) {
      setError("Bài viết quá ngắn.");
      return;
    }

    submitInFlightRef.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      const { submitWritingAction } = await import(
        "@/features/learning-content/actions-writing"
      );
      const res = await submitWritingAction({ writeId, content });
      if (!res.success) {
        setError(res.error || "Không thể nộp bài.");
        return;
      }
      setAnalysis(res.data.analysis);
      setScore(res.data.analysis.score);
      setSubmissionStatus("AI_GRADED");
      setIsCompleted(true);
      setLastSavedContent(content);
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi nộp bài.");
    } finally {
      setIsSubmitting(false);
      submitInFlightRef.current = false;
    }
  }, [content, isSubmitting, onSubmitted, writeId]);

  // ─── "Viết lại" — wipe analysis + completed flag, start a new attempt ──
  const resetForRewrite = React.useCallback(() => {
    setContentState("");
    setLastSavedContent("");
    setAnalysis(null);
    setScore(null);
    setSubmissionStatus(null);
    setIsCompleted(false);
    setError(null);
    setLastSavedAt(null);
  }, []);

  const setContent = React.useCallback((value: string) => {
    setContentState(value);
    if (error) setError(null);
  }, [error]);

  return {
    content,
    setContent,
    writeId,
    isLoading,
    analysis,
    score,
    submissionStatus,
    isCompleted,
    isSavingDraft,
    lastSavedAt,
    isSubmitting,
    error,
    isReadOnly: isFinalized,
    hasUnsavedChanges,
    saveDraft,
    submit,
    resetForRewrite,
  };
}
