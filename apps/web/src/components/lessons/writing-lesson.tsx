"use client";

import { useState } from "react";
import { CheckCircle2, FilePenLine, Send, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface WritingLessonProps {
  lessonId: string;
  title: string;
  prompt: string;
  gradingCriteria?: string | null;
  wordCountGuidance?: number | null;
  isCompleted: boolean;
  onComplete: (content: string) => void;
}

export function WritingLesson({
  lessonId,
  title,
  prompt,
  gradingCriteria,
  wordCountGuidance,
  isCompleted,
  onComplete,
}: WritingLessonProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setContent(text);
    const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
    setWordCount(words.length);
  };

  const handleSubmit = async () => {
    if (content.trim().length < 10) return;

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulated API call
      onComplete(content);
    } finally {
      setIsSubmitting(false);
    }
  };

  const characterCount = content.length;
  const meetsMinimumLength = wordCount >= (wordCountGuidance || 50);
  const meetsMinimumChars = characterCount >= 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
            <FilePenLine className="size-3 mr-1" />
            Bài viết Writing
          </span>
          {isCompleted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
              <CheckCircle2 className="size-3" />
              Đã hoàn thành
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>

        {/* Word count indicator */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex-1">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  meetsMinimumLength
                    ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                    : "bg-amber-400"
                }`}
                style={{
                  width: `${Math.min(100, (wordCount / (wordCountGuidance || 100)) * 100)}%`,
                }}
              />
            </div>
          </div>
          <span
            className={`text-sm font-medium shrink-0 ${
              meetsMinimumLength ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {wordCount} / {wordCountGuidance || 50} từ
          </span>
        </div>
      </div>

      {/* Writing Prompt */}
      <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-amber-200 shrink-0">
            <FilePenLine className="size-4 text-amber-700" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 mb-2">Yêu cầu bài viết</h3>
            <div className="prose prose-sm prose-amber max-w-none">
              <p className="text-amber-800 whitespace-pre-wrap">{prompt}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grading Criteria */}
      {gradingCriteria && (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-8 items-center justify-center rounded-full bg-slate-200 shrink-0">
              <Sparkles className="size-4 text-slate-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-700 mb-2">Tiêu chí đánh giá</h3>
              <div className="prose prose-sm prose-slate max-w-none">
                <p className="text-slate-600 whitespace-pre-wrap">{gradingCriteria}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Writing Area */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
          <span className="text-sm font-medium text-slate-600">Viết bài của bạn</span>
          <span
            className={`text-xs ${
              meetsMinimumChars ? "text-emerald-600" : "text-slate-400"
            }`}
          >
            {characterCount} ký tự
          </span>
        </div>
        <Textarea
          value={content}
          onChange={handleContentChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Bắt đầu viết bài của bạn ở đây..."
          className={`min-h-[300px] border-0 rounded-none resize-none focus-visible:ring-0 focus-visible:ring-offset-0 ${
            isFocused ? "bg-white" : "bg-slate-50/50"
          }`}
          disabled={isCompleted}
        />
      </div>

      {/* Writing Tips */}
      <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-5">
        <h3 className="font-semibold text-indigo-900 mb-3">Mẹo viết bài</h3>
        <ul className="space-y-2 text-sm text-indigo-700">
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5">•</span>
            Viết ít nhất {wordCountGuidance || 50} từ để đạt yêu cầu.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5">•</span>
            Sử dụng từ vựng và cấu trúc câu đa dạng.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5">•</span>
            Kiểm tra chính tả và ngữ pháp trước khi nộp.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-indigo-400 mt-0.5">•</span>
            Nộp bài để nhận phản hồi từ AI.
          </li>
        </ul>
      </div>

      {/* Submit Button */}
      {!isCompleted && (
        <div className="flex flex-col items-center">
          {!meetsMinimumLength ? (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <AlertCircle className="size-4" />
              <span>Cần viết ít nhất {wordCountGuidance || 50} từ để nộp bài</span>
            </div>
          ) : null}

          <Button
            onClick={handleSubmit}
            disabled={!meetsMinimumLength || isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 mt-2"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Đang nộp bài...
              </>
            ) : (
              <>
                <Send className="size-4" />
                Nộp bài viết
              </>
            )}
          </Button>
        </div>
      )}

      {isCompleted && (
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="size-6 text-emerald-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-emerald-900">
            Bạn đã nộp bài viết này!
          </h3>
          <p className="text-sm text-emerald-600 mt-1">
            Bài viết của bạn đã được ghi nhận. Tiếp tục với bài học tiếp theo.
          </p>
        </div>
      )}
    </div>
  );
}
