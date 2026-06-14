"use client";

/**
 * WritingLesson - UI cho bài Writing trong lesson viewer.
 *
 * Phiên bản tối ưu:
 *   - Tự động fetch + restore nội dung + AI feedback từ DB khi mount.
 *   - KHÔNG auto-save: học viên phải bấm "Lưu bản nháp" thì mới lưu.
 *     Tránh spam Server Action mỗi lần gõ phím (giảm tải cho Groq quota).
 *   - Nộp bài gọi AI service thật, hiển thị analysis (highlight lỗi +
 *     popover + phiên bản hoàn chỉnh + gợi ý).
 *   - Sau khi nộp vẫn cho phép "Viết lại" để tạo bản mới.
 *   - Hiển thị cảnh báo rõ ràng khi có thay đổi chưa lưu để tránh mất bài.
 *
 * Props interface được giữ nguyên để tương thích với lesson-viewer-client.
 */

import * as React from "react";
import { AlertCircle, FileWarning, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useWritingLesson } from "@/features/learning-content/hooks/useWritingLesson";
import { WritingAnalysisPanel } from "@/features/learning-content/components/writing/writing-analysis-panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SubmissionActionBar } from "./writing-lesson-actions";
import { WritingEditor, WritingGradingCriteria, WritingPrompt, WritingTips } from "./writing-lesson-content";
import { WritingHeader } from "./writing-lesson-header";
import { WritingLessonSkeleton } from "./writing-lesson-skeleton";
import { SaveDraftButton } from "./writing-lesson-save-draft";

interface WritingLessonProps {
  lessonId: string;
  title: string;
  prompt: string;
  gradingCriteria?: string | null;
  wordCountGuidance?: number | null;
  isCompleted: boolean;
  onComplete: (content: string) => void;
}

const MIN_WORDS_TO_SUBMIT = 5;
const MIN_CHARS_TO_SHOW_SAVE_STATUS = 20;
const MIN_CHARS_TO_ENABLE_SAVE = 5;

export function WritingLesson({
  lessonId,
  title,
  prompt,
  gradingCriteria,
  wordCountGuidance,
  isCompleted,
  onComplete,
}: WritingLessonProps) {
  // Stable callback so the hook doesn't recreate `submit` on every render.
  const handleSubmitted = React.useCallback(() => {
    onComplete("");
  }, [onComplete]);

  const lesson = useWritingLesson({
    lessonId,
    initialCompleted: isCompleted,
    onSubmitted: handleSubmitted,
  });

  const {
    content,
    setContent,
    writeId,
    isLoading,
    analysis,
    submissionStatus,
    isSavingDraft,
    lastSavedAt,
    isSubmitting,
    error,
    isReadOnly,
    hasUnsavedChanges,
    saveDraft,
    submit,
    resetForRewrite,
  } = lesson;

  const wordCount = React.useMemo(() => {
    const t = content.trim();
    return t.length === 0 ? 0 : t.split(/\s+/).length;
  }, [content]);

  const characterCount = content.length;
  const meetsWordMinimum = wordCount >= MIN_WORDS_TO_SUBMIT;
  const canSaveDraft =
    !isReadOnly &&
    !isSavingDraft &&
    !isSubmitting &&
    characterCount >= MIN_CHARS_TO_ENABLE_SAVE;
  const showAnalysis = !!analysis && isReadOnly;

  // Warn user about unsaved changes before they navigate away / close tab.
  React.useEffect(() => {
    if (!hasUnsavedChanges || isReadOnly) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges, isReadOnly]);

  // ─── Loading state ─────────────────────────────────────────────────────
  if (isLoading) {
    return <WritingLessonSkeleton />;
  }

  if (!writeId) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        <AlertTitle>Bài học chưa cấu hình bài viết</AlertTitle>
        <AlertDescription>
          Vui lòng liên hệ giáo viên để được hỗ trợ.
        </AlertDescription>
      </Alert>
    );
  }

  // ─── Main view ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <WritingHeader
        title={title}
        isReadOnly={isReadOnly}
        submissionStatus={submissionStatus}
        wordCount={wordCount}
        wordCountGuidance={wordCountGuidance}
        isSavingDraft={isSavingDraft}
        lastSavedAt={lastSavedAt}
        showSaveStatus={
          !isReadOnly && characterCount >= MIN_CHARS_TO_SHOW_SAVE_STATUS
        }
      />

      <WritingPrompt prompt={prompt} />

      {gradingCriteria && <WritingGradingCriteria criteria={gradingCriteria} />}

      {/* Manual save reminder — shown only when user has unsaved content. */}
      {!isReadOnly && hasUnsavedChanges && characterCount >= MIN_CHARS_TO_ENABLE_SAVE && (
        <Alert className="border-amber-200 bg-amber-50/80 text-amber-900">
          <FileWarning className="size-4 text-amber-600" />
          <AlertTitle>Bạn có thay đổi chưa được lưu</AlertTitle>
          <AlertDescription>
            Hệ thống <strong>không tự động lưu</strong> bản nháp. Hãy bấm
            nút <strong>&quot;Lưu bản nháp&quot;</strong> phía dưới để tránh
            mất bài khi tải lại trang.
          </AlertDescription>
        </Alert>
      )}

      {showAnalysis && (
        <WritingAnalysisPanel originalText={content} analysis={analysis} />
      )}

      {error && !isReadOnly && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Không thể lưu/nộp bài</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <WritingEditor
        content={content}
        onChange={setContent}
        isReadOnly={isReadOnly}
        isSubmitting={isSubmitting}
        characterCount={characterCount}
      />

      {!isReadOnly && <WritingTips wordCountGuidance={wordCountGuidance} />}

      {/* Save-draft row sits just above the submit row so the two states
          (đã lưu / chưa lưu) are visible right before the user commits. */}
      {!isReadOnly && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="size-3.5 text-indigo-500" />
            <span>
              {hasUnsavedChanges
                ? "Bạn đang có thay đổi chưa lưu."
                : "Mọi thay đổi đã được lưu."}
            </span>
          </div>
          <SaveDraftButton
            onSave={async () => {
              const ok = await saveDraft();
              if (ok) {
                toast.success("Đã lưu bản nháp vào cơ sở dữ liệu.");
              } else {
                toast.error("Không thể lưu bản nháp. Vui lòng thử lại.");
              }
            }}
            disabled={!canSaveDraft}
            isSaving={isSavingDraft}
            isDirty={hasUnsavedChanges}
          />
        </div>
      )}

      <SubmissionActionBar
        isReadOnly={isReadOnly}
        isSubmitting={isSubmitting}
        canSubmit={meetsWordMinimum && !isSubmitting}
        wordCount={wordCount}
        onSubmit={submit}
        onRewrite={resetForRewrite}
      />
    </div>
  );
}
