"use client";

import { useState } from "react";
import { BookOpen, FileText, Video, FileQuestion, FilePenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

type LessonType = "TEXT" | "VIDEO" | "QUIZ" | "WRITING" | "VOCABULARY";

interface LessonCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (title: string, type: LessonType) => Promise<void>;
  moduleId: string;
  submitting?: boolean;
}

const LESSON_TYPES: Array<{
  value: LessonType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}> = [
  {
    value: "TEXT",
    label: "Bài học Text",
    description: "Nội dung văn bản với định dạng Markdown",
    icon: <FileText className="size-5" />,
    color: "bg-blue-100 text-blue-600 border-blue-200",
  },
  {
    value: "VIDEO",
    label: "Bài học Video",
    description: "Video từ Cloudinary hoặc URL",
    icon: <Video className="size-5" />,
    color: "bg-purple-100 text-purple-600 border-purple-200",
  },
  {
    value: "QUIZ",
    label: "Bài tập Quiz",
    description: "Câu hỏi trắc nghiệm với đáp án",
    icon: <FileQuestion className="size-5" />,
    color: "bg-amber-100 text-amber-600 border-amber-200",
  },
  {
    value: "WRITING",
    label: "Bài viết Writing",
    description: "Bài tập viết với hỗ trợ AI",
    icon: <FilePenLine className="size-5" />,
    color: "bg-emerald-100 text-emerald-600 border-emerald-200",
  },
  {
    value: "VOCABULARY",
    label: "Bài học Từ vựng",
    description: "Danh sách từ vựng với phiên âm",
    icon: <BookOpen className="size-5" />,
    color: "bg-teal-100 text-teal-600 border-teal-200",
  },
];

export function LessonCreateSheet({
  open,
  onOpenChange,
  onSubmit,
  moduleId,
  submitting = false,
}: LessonCreateSheetProps) {
  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState<LessonType>("TEXT");

  const handleSubmit = async () => {
    if (!title.trim()) return;
    await onSubmit(title.trim(), selectedType);
    // Reset form on close
    setTitle("");
    setSelectedType("TEXT");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTitle("");
      setSelectedType("TEXT");
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="size-5"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div>
              <SheetTitle className="text-left text-lg">
                Thêm bài học mới
              </SheetTitle>
              <SheetDescription className="text-left">
                Chọn loại bài học và nhập tiêu đề
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="lesson-title" className="text-sm font-semibold text-slate-700">
              Tiêu đề bài học <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lesson-title"
              placeholder="VD: Bài 1 — Giới từ cơ bản"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Lesson Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-700">
              Loại bài học <span className="text-red-500">*</span>
            </Label>
            <div className="grid gap-3">
              {LESSON_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedType(type.value)}
                  className={`flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                    selectedType === type.value
                      ? `${type.color} border-current`
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="shrink-0 mt-0.5">{type.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900">{type.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {type.description}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <div
                      className={`size-5 rounded-full border-2 flex items-center justify-center ${
                        selectedType === type.value
                          ? "border-current bg-current"
                          : "border-slate-300"
                      }`}
                    >
                      {selectedType === type.value && (
                        <svg
                          className="size-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !title.trim()}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {submitting ? "Đang tạo..." : "Tạo bài học"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
