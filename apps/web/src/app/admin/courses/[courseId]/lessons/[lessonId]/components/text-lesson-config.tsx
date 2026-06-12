"use client";

import { FileText } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface TextContent {
  title: string;
  content: string;
  keywords: string;
  learningObjectives: string;
}

interface TextLessonConfigProps {
  content: TextContent;
  onContentChange: (content: TextContent) => void;
}

export function TextLessonConfig({
  content,
  onContentChange,
}: TextLessonConfigProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Left Column: Form */}
      <div className="space-y-6">
        <Card className="border-slate-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <FileText className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Cấu hình Bài học Text
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhập nội dung văn bản cho bài học
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="text-title" className="text-xs font-semibold text-slate-700">
                Tiêu đề bài text <span className="text-slate-400 font-normal">(tùy chọn)</span>
              </Label>
              <Input
                id="text-title"
                placeholder="VD: Grammar Focus — Câu điều kiện loại 1"
                value={content.title}
                onChange={(e) =>
                  onContentChange({ ...content, title: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="text-content" className="text-xs font-semibold text-slate-700">
                  Nội dung bài học <span className="text-slate-400 font-normal">(tùy chọn)</span>
                </Label>
                <span className="text-xs text-slate-400">
                  {content.content.length} ký tự
                </span>
              </div>
              <Textarea
                id="text-content"
                placeholder="Nhập nội dung bài học tại đây...

Bạn có thể sử dụng Markdown để định dạng:
- **In đậm** cho từ khóa
- *In nghiêng* cho giải thích
- Danh sách bullet points cho ví dụ"
                className="min-h-80 resize-none font-sans text-sm leading-relaxed"
                value={content.content}
                onChange={(e) =>
                  onContentChange({ ...content, content: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="keywords" className="text-xs font-semibold text-slate-700">
                  Từ khóa <span className="text-slate-400 font-normal">(tùy chọn)</span>
                </Label>
                <Input
                  id="keywords"
                  placeholder="VD: conditionals, if, when, unless"
                  value={content.keywords}
                  onChange={(e) =>
                    onContentChange({ ...content, keywords: e.target.value })
                  }
                />
                <p className="text-xs text-slate-400">Phân cách bằng dấu phẩy</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="learning-objectives" className="text-xs font-semibold text-slate-700">
                  Mục tiêu bài học <span className="text-slate-400 font-normal">(tùy chọn)</span>
                </Label>
                <Input
                  id="learning-objectives"
                  placeholder="VD: Hiểu cấu trúc câu điều kiện loại 1"
                  value={content.learningObjectives}
                  onChange={(e) =>
                    onContentChange({
                      ...content,
                      learningObjectives: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Preview */}
      <div className="space-y-6">
        <Card className="border-slate-200 bg-slate-50/50">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-4"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <CardTitle className="text-base font-semibold text-slate-700">
                Xem trước nội dung
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-slate-200 bg-white p-6 min-h-64">
              {content.content ? (
                <div className="prose prose-slate max-w-none">
                  <h4 className="text-lg font-semibold text-slate-900 mb-4">
                    {content.title || "Tiêu đề bài học"}
                  </h4>
                  <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                    {content.content}
                  </div>
                  {content.keywords && (
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Từ khóa
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {content.keywords.split(",").map((keyword, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                          >
                            {keyword.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {content.learningObjectives && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Mục tiêu
                      </p>
                      <p className="text-sm text-slate-600">
                        {content.learningObjectives}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                    <FileText className="size-6" />
                  </div>
                  <p className="text-sm text-slate-400">
                    Nội dung xem trước sẽ hiển thị ở đây khi bạn nhập nội dung
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
