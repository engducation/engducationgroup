"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CourseFormState {
  title: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  level: string;
  language: string;
}

interface CourseEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  form: CourseFormState;
  onFormChange: (form: CourseFormState) => void;
  submitting: boolean;
  courseTitle?: string;
}

export function CourseEditDialog({
  open,
  onOpenChange,
  onSubmit,
  form,
  onFormChange,
  submitting,
  courseTitle,
}: CourseEditDialogProps) {
  const updateForm = <K extends keyof CourseFormState>(field: K, value: CourseFormState[K]) => {
    onFormChange({ ...form, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 pr-8">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <DialogTitle className="text-left">Chỉnh sửa khóa học</DialogTitle>
              <DialogDescription className="text-left">
                Cập nhật thông tin khóa học &ldquo;{courseTitle}&rdquo;.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 px-1 pb-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Tên khóa học *</label>
            <Input
              placeholder="VD: English for Beginners"
              value={form.title}
              onChange={(e) => updateForm("title", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Mô tả ngắn</label>
            <Textarea
              placeholder="Mô tả ngắn gọn về khóa học..."
              className="resize-none text-sm"
              value={form.shortDescription}
              onChange={(e) => updateForm("shortDescription", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Mô tả chi tiết</label>
            <Textarea
              placeholder="Mô tả chi tiết nội dung khóa học..."
              className="resize-none text-sm min-h-24"
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Level</label>
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
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Ngôn ngữ</label>
              <Input
                placeholder="VD: English"
                value={form.language}
                onChange={(e) => updateForm("language", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Thumbnail URL</label>
            <Input
              placeholder="https://example.com/thumbnail.jpg"
              value={form.thumbnail}
              onChange={(e) => updateForm("thumbnail", e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
