"use client";

/**
 * WritingLessonSkeleton - Skeleton đẹp mắt hiển thị trong lúc load bài viết.
 *
 * Mục tiêu UX: tránh nhàm chán khi user chờ bằng các yếu tố:
 *   - Progress bar "đang chuẩn bị bài viết..." có animation chạy liên tục
 *   - 3 thẻ "fact thú vị" rotate theo thời gian (5s/thẻ)
 *   - Skeleton blocks mô phỏng header + editor + button
 *   - Emoji subtle để giảm cảm giác "đang lỗi"
 */

import * as React from "react";
import { Loader2, PenLine, Sparkles, Languages, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const TIPS = [
  {
    icon: PenLine,
    title: "Viết đúng trọng tâm",
    body: "Đọc kỹ đề bài, gạch chân các từ khóa rồi triển khai theo từng đoạn — đừng cố viết dài trước khi có outline.",
  },
  {
    icon: Languages,
    title: "Mỗi câu — một ý",
    body: "Câu tiếng Anh rõ ý thường có chủ ngữ – động từ rõ ràng. Tránh nhồi 2-3 mệnh đề vào một câu dài.",
  },
  {
    icon: Brain,
    title: "Đọc lại trước khi nộp",
    body: "AI chấm dựa trên chính tả, ngữ pháp và phong cách. Một lượt đọc lại giúp bạn sửa ~30% lỗi thường gặp.",
  },
] as const;

export function WritingLessonSkeleton() {
  const [tipIndex, setTipIndex] = React.useState(0);

  // Cycle through tips every 5s so the user has something to read.
  React.useEffect(() => {
    const t = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 5000);
    return () => window.clearInterval(t);
  }, []);

  const currentTip = TIPS[tipIndex];
  const TipIcon = currentTip.icon;

  return (
    <div
      className="flex flex-col gap-6"
      role="status"
      aria-live="polite"
      aria-label="Đang tải bài viết của bạn"
    >
      {/* Header skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="h-5 w-28 animate-pulse rounded-full bg-slate-200" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-slate-200" />
        </div>
        <div className="h-7 w-2/3 animate-pulse rounded-md bg-slate-200" />
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="h-2 flex-1 min-w-[160px] animate-pulse rounded-full bg-slate-200" />
          <div className="h-4 w-24 animate-pulse rounded-md bg-slate-200" />
          <div className="h-4 w-28 animate-pulse rounded-md bg-slate-200" />
        </div>
      </div>

      {/* Animated progress card — keeps the user engaged while loading. */}
      <div
        key={tipIndex}
        className={cn(
          "rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-amber-50/40 p-6",
          "transition-all duration-500",
        )}
      >
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-indigo-100">
            <TipIcon className="size-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-indigo-600">
              <Sparkles className="size-3.5" />
              Mẹo hữu ích trong khi chờ
            </div>
            <h3 className="mt-1 text-base font-semibold text-slate-900">
              {currentTip.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {currentTip.body}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <Loader2 className="size-4 animate-spin text-indigo-600" />
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-indigo-100">
            <div className="absolute inset-y-0 left-0 w-1/3 animate-[shimmer_1.4s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
          </div>
          <span className="text-xs font-medium text-indigo-600">
            Đang tải bài viết...
          </span>
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          {TIPS.map((_, i) => (
            <span
              key={i}
              aria-hidden
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                i === tipIndex ? "w-6 bg-indigo-500" : "w-1.5 bg-indigo-200",
              )}
            />
          ))}
        </div>
      </div>

      {/* Prompt skeleton */}
      <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
        <div className="flex items-start gap-3">
          <div className="size-8 shrink-0 animate-pulse rounded-full bg-amber-200/70" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-amber-200/70" />
            <div className="h-3 w-full animate-pulse rounded bg-amber-200/60" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-amber-200/60" />
            <div className="h-3 w-4/6 animate-pulse rounded bg-amber-200/60" />
          </div>
        </div>
      </div>

      {/* Editor skeleton */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-16 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="space-y-3 p-4">
          <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-11/12 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-10/12 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-9/12 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-8/12 animate-pulse rounded bg-slate-100" />
        </div>
      </div>

      {/* Submit button skeleton */}
      <div className="flex justify-center">
        <div className="h-12 w-44 animate-pulse rounded-full bg-slate-200" />
      </div>
    </div>
  );
}
