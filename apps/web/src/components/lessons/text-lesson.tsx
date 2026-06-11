"use client";

import { useState } from "react";
import { CheckCircle2, BookOpen, Bookmark, Clock, Target, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TextLessonProps {
  lessonId: string;
  title: string;
  content: string;
  keywords?: string | null;
  learningObjectives?: string | null;
  isCompleted: boolean;
  onComplete: () => void;
}

export function TextLesson({
  lessonId,
  title,
  content,
  keywords,
  learningObjectives,
  isCompleted,
  onComplete,
}: TextLessonProps) {
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight - element.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 100;
    setReadingProgress(Math.round(progress));

    if (progress >= 95) {
      setIsScrolledToEnd(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Lesson Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
            <BookOpen className="size-3 mr-1" />
            Bài học Text
          </span>
          {isCompleted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="size-3" />
              Đã hoàn thành
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>

        {/* Reading progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500">
              {readingProgress < 100 ? "Đang đọc..." : "Đã đọc xong"}
            </span>
            <span className="text-xs font-medium text-indigo-600">{readingProgress}%</span>
          </div>
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-300"
              style={{ width: `${readingProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Learning Objectives */}
      {learningObjectives && (
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="size-5 text-amber-600" />
            <h3 className="font-semibold text-amber-900">Mục tiêu bài học</h3>
          </div>
          <div className="prose prose-sm prose-amber max-w-none">
            <p className="text-amber-800 whitespace-pre-wrap">{learningObjectives}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 min-h-[400px] max-h-[600px] overflow-y-auto"
        onScroll={handleScroll}
      >
        <div className="prose prose-slate max-w-none">
          <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
        </div>
      </div>

      {/* Keywords */}
      {keywords && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bookmark className="size-5 text-slate-600" />
            <h3 className="font-semibold text-slate-700">Từ khóa</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {keywords.split(",").map((keyword, index) => (
              <span
                key={index}
                className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
              >
                {keyword.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Complete Action */}
      {!isCompleted ? (
        <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-6 text-center">
          {isScrolledToEnd || readingProgress >= 95 ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-indigo-100">
                  <BookOpen className="size-8 text-indigo-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  Đã đọc xong bài học?
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Nhấn nút bên dưới để đánh dấu hoàn thành bài học này.
                </p>
              </div>
              <Button
                onClick={onComplete}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                <CheckCircle2 className="size-4" />
                Hoàn thành bài học
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex justify-center mb-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-indigo-100">
                  <Clock className="size-6 text-indigo-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                Hãy đọc hết bài học
              </h3>
              <p className="text-sm text-slate-500">
                Cuộn xuống và đọc hết nội dung để có thể hoàn thành bài học.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="size-6 text-emerald-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-emerald-900">
            Bạn đã hoàn thành bài học này!
          </h3>
          <p className="text-sm text-emerald-600 mt-1">
            Tiếp tục với bài học tiếp theo để học thêm nhiều kiến thức mới.
          </p>
        </div>
      )}
    </div>
  );
}
