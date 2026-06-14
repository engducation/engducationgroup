/**
 * Sub-components for WritingLesson UI: header + draft save status.
 *
 * Tách riêng để giữ file chính `writing-lesson.tsx` dưới ngưỡng 250 dòng
 * (quy tắc trong structure_code.md §2.1).
 */

"use client";

import {
  CheckCircle2,
  CloudOff,
  FilePenLine,
  Loader2,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatTimeAgo(ts: number | null): string {
  if (!ts) return "";
  const diff = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diff < 5) return "vừa xong";
  if (diff < 60) return `${diff}s trước`;
  return `${Math.floor(diff / 60)} phút trước`;
}

export function DraftStatus({
  isSaving,
  lastSavedAt,
  visible,
}: {
  isSaving: boolean;
  lastSavedAt: number | null;
  visible: boolean;
}) {
  if (!visible) return null;
  if (isSaving) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
        <Loader2 className="size-3 animate-spin" />
        Đang lưu...
      </span>
    );
  }
  if (lastSavedAt) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
        <CheckCircle2 className="size-3" />
        Đã lưu {formatTimeAgo(lastSavedAt)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
      <CloudOff className="size-3" />
      Chưa lưu
    </span>
  );
}

export function WritingHeader({
  title,
  isReadOnly,
  submissionStatus,
  wordCount,
  wordCountGuidance,
  isSavingDraft,
  lastSavedAt,
  showSaveStatus,
}: {
  title: string;
  isReadOnly: boolean;
  submissionStatus: string | null;
  wordCount: number;
  wordCountGuidance: number | null | undefined;
  isSavingDraft: boolean;
  lastSavedAt: number | null;
  showSaveStatus: boolean;
}) {
  const meetsLengthGuidance = wordCount >= (wordCountGuidance || 50);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
          <FilePenLine className="size-3 mr-1" />
          Bài viết Writing
        </span>
        {isReadOnly && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
            <CheckCircle2 className="size-3" />
            Đã hoàn thành
          </span>
        )}
        {submissionStatus === "DRAFT" && !isReadOnly && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            <Save className="size-3" />
            Bản nháp
          </span>
        )}
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>

      <div className="flex flex-wrap items-center gap-4 mt-3">
        <div className="flex-1 min-w-[160px]">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                meetsLengthGuidance
                  ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                  : "bg-amber-400",
              )}
              style={{
                width: `${Math.min(100, (wordCount / (wordCountGuidance || 100)) * 100)}%`,
              }}
            />
          </div>
        </div>
        <span
          className={cn(
            "text-sm font-medium shrink-0",
            meetsLengthGuidance ? "text-emerald-600" : "text-amber-600",
          )}
        >
          {wordCount} / {wordCountGuidance || 50} từ
        </span>
        <DraftStatus
          isSaving={isSavingDraft}
          lastSavedAt={lastSavedAt}
          visible={showSaveStatus}
        />
      </div>
    </div>
  );
}
