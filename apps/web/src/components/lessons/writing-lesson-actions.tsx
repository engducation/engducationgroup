/**
 * Sub-components for WritingLesson UI: submit / rewrite action bar.
 *
 * Tách riêng để giữ file chính `writing-lesson.tsx` dưới ngưỡng 250 dòng
 * (quy tắc trong structure_code.md §2.1).
 */

"use client";

import { AlertCircle, CheckCircle2, Loader2, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const MIN_WORDS_TO_SUBMIT = 5;

export function SubmissionActionBar({
  isReadOnly,
  isSubmitting,
  canSubmit,
  wordCount,
  onSubmit,
  onRewrite,
}: {
  isReadOnly: boolean;
  isSubmitting: boolean;
  canSubmit: boolean;
  wordCount: number;
  onSubmit: () => void;
  onRewrite: () => void;
}) {
  if (isReadOnly) {
    return (
      <div className="flex flex-col items-center gap-3 w-full">
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6 text-center w-full max-w-md">
          <div className="flex justify-center mb-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="size-6 text-emerald-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-emerald-900">
            Bạn đã hoàn thành bài viết này!
          </h3>
          <p className="text-sm text-emerald-600 mt-1">
            Xem lại phản hồi từ AI phía trên. Bấm &quot;Viết lại&quot; nếu muốn thử lại.
          </p>
        </div>
        <Button variant="outline" onClick={onRewrite}>
          <RotateCcw />
          Viết lại
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {!canSubmit && wordCount > 0 && (
        <div className="flex items-center gap-2 text-amber-600 text-sm">
          <AlertCircle className="size-4" />
          <span>Cần ít nhất {MIN_WORDS_TO_SUBMIT} từ để nộp bài</span>
        </div>
      )}
      <Button
        onClick={onSubmit}
        disabled={!canSubmit || isSubmitting}
        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Đang phân tích bằng AI...
          </>
        ) : (
          <>
            <Send className="size-4" />
            Nộp bài viết
          </>
        )}
      </Button>
    </div>
  );
}
