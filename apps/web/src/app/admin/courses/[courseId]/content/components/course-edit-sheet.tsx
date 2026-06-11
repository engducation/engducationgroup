"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "@/components/cloudinary";

interface CourseFormState {
  title: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  level: string;
  language: string;
}

interface CourseEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  form: CourseFormState;
  onFormChange: (form: CourseFormState) => void;
  submitting: boolean;
  courseTitle?: string;
}

export function CourseEditSheet({
  open,
  onOpenChange,
  onSubmit,
  form,
  onFormChange,
  submitting,
  courseTitle,
}: CourseEditSheetProps) {
  const updateForm = <K extends keyof CourseFormState>(
    field: K,
    value: CourseFormState[K]
  ) => {
    onFormChange({ ...form, [field]: value });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
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
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <SheetTitle className="text-left text-lg">
                Chỉnh sửa khóa học
              </SheetTitle>
              <SheetDescription className="text-left">
                Cập nhật thông tin khóa học &ldquo;{courseTitle}&rdquo;.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Tên khóa học *
            </label>
            <Input
              placeholder="VD: English for Beginners"
              value={form.title}
              onChange={(e) => updateForm("title", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Mô tả ngắn
            </label>
            <Textarea
              placeholder="Mô tả ngắn gọn về khóa học..."
              className="resize-none text-sm min-h-20"
              value={form.shortDescription}
              onChange={(e) => updateForm("shortDescription", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Mô tả chi tiết
            </label>
            <Textarea
              placeholder="Mô tả chi tiết nội dung khóa học..."
              className="resize-none text-sm min-h-32"
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Level</label>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                value={form.level}
                onChange={(e) => updateForm("level", e.target.value)}
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Ngôn ngữ
              </label>
              <Input
                placeholder="VD: English"
                value={form.language}
                onChange={(e) => updateForm("language", e.target.value)}
              />
            </div>
          </div>
          <ImageUploadField
            label="Thumbnail"
            value={form.thumbnail}
            onChange={(url) => updateForm("thumbnail", url)}
            hint="Ảnh đại diện hiển thị trong danh sách khóa học"
          />
        </div>

        <SheetFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Hủy
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {submitting ? "Đang cập nhật..." : "Cập nhật khóa học"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
