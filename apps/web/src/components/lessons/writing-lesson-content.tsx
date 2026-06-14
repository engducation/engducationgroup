/**
 * Sub-components for WritingLesson UI: prompt / editor / tips.
 *
 * Tách riêng để giữ file chính `writing-lesson.tsx` dưới ngưỡng 250 dòng
 * (quy tắc trong structure_code.md §2.1).
 */

"use client";

import { FilePenLine, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function WritingPrompt({ prompt }: { prompt: string }) {
  return (
    <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-amber-200 shrink-0">
          <FilePenLine className="size-4 text-amber-700" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 mb-2">Yêu cầu bài viết</h3>
          <p className="text-amber-800 whitespace-pre-wrap text-sm">{prompt}</p>
        </div>
      </div>
    </div>
  );
}

export function WritingGradingCriteria({ criteria }: { criteria: string }) {
  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-slate-200 shrink-0">
          <Sparkles className="size-4 text-slate-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-700 mb-2">Tiêu chí đánh giá</h3>
          <p className="text-slate-600 whitespace-pre-wrap text-sm">{criteria}</p>
        </div>
      </div>
    </div>
  );
}

export function WritingEditor({
  content,
  onChange,
  isReadOnly,
  isSubmitting,
  characterCount,
}: {
  content: string;
  onChange: (value: string) => void;
  isReadOnly: boolean;
  isSubmitting: boolean;
  characterCount: number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <span className="text-sm font-medium text-slate-600">Viết bài của bạn</span>
        <span
          className={cn(
            "text-xs",
            characterCount > 0 ? "text-emerald-600" : "text-slate-400",
          )}
        >
          {characterCount} ký tự
        </span>
      </div>
      <Textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          isReadOnly
            ? "Bạn đã hoàn thành bài viết này. Bấm 'Viết lại' để bắt đầu bản mới."
            : "Bắt đầu viết bài của bạn ở đây... Bài nháp sẽ được tự động lưu."
        }
        className="min-h-[300px] border-0 rounded-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-white"
        disabled={isSubmitting}
      />
    </div>
  );
}

export function WritingTips({
  wordCountGuidance,
}: {
  wordCountGuidance: number | null | undefined;
}) {
  return (
    <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5">
      <h3 className="font-semibold text-indigo-900 mb-3">Mẹo viết bài</h3>
      <ul className="space-y-2 text-sm text-indigo-700">
        <li>• Bài nháp được tự động lưu mỗi khi bạn ngừng gõ ~1 giây.</li>
        <li>• Viết ít nhất {wordCountGuidance || 50} từ để đạt yêu cầu.</li>
        <li>• Sau khi nộp, AI sẽ highlight lỗi + đưa phiên bản hoàn chỉnh.</li>
      </ul>
    </div>
  );
}
