"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface SubWorkspaceHeaderProps {
  courseId: string;
  courseTitle?: string;
  lessonTitle?: string;
  lessonType?: "TEXT" | "VIDEO" | "QUIZ" | "WRITING";
  onBack?: () => void;
}

const LESSON_TYPE_LABELS: Record<string, string> = {
  TEXT: "Bài học Text",
  VIDEO: "Bài giảng Video",
  QUIZ: "Bài Quiz",
  WRITING: "Bài tập Writing",
};

export function SubWorkspaceHeader({
  courseId,
  courseTitle,
  lessonTitle,
  lessonType,
  onBack,
}: SubWorkspaceHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 rounded-lg transition-colors hover:text-slate-900 hover:bg-slate-100"
            >
              <ArrowLeft className="size-4" />
              Quay lại sơ đồ khóa học
            </button>
          ) : (
            <Link
              href={`/admin/courses/${courseId}/content`}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 rounded-lg transition-colors hover:text-slate-900 hover:bg-slate-100"
            >
              <ArrowLeft className="size-4" />
              Quay lại sơ đồ khóa học
            </Link>
          )}

          <div className="h-6 w-px bg-slate-200" />

          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/admin/courses"
              className="text-slate-500 transition-colors hover:text-slate-700"
            >
              Khóa học
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-medium text-slate-900 truncate max-w-[200px]">
              {courseTitle || "Course"}
            </span>
            {lessonTitle && (
              <>
                <span className="text-slate-300">/</span>
                <span className="text-slate-500 truncate max-w-[150px]">
                  {lessonTitle}
                </span>
              </>
            )}
          </nav>
        </div>

        {lessonType && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              {LESSON_TYPE_LABELS[lessonType] || lessonType}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
