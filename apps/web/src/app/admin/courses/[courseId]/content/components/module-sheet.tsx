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

interface ModuleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  submitting: boolean;
  isEditing?: boolean;
  moduleId?: string;
}

export function ModuleSheet({
  open,
  onOpenChange,
  onSubmit,
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  submitting,
  isEditing = false,
  moduleId,
}: ModuleSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
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
                {isEditing ? "Chỉnh sửa chương học" : "Tạo chương học mới"}
              </SheetTitle>
              <SheetDescription className="text-left">
                {isEditing
                  ? "Cập nhật thông tin chương học."
                  : "Chương học sẽ được tạo ở trạng thái bản nháp. Bạn có thể chỉnh sửa trạng thái sau."}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Tên chương học <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="VD: Chương 1 — Ngữ pháp cơ bản"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Mô tả <span className="text-slate-400 font-normal">(tùy chọn)</span>
            </label>
            <Textarea
              placeholder="Mô tả ngắn gọn nội dung chương học..."
              className="resize-none text-sm min-h-24"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
            />
          </div>
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
            {submitting
              ? isEditing
                ? "Đang cập nhật..."
                : "Đang tạo..."
              : isEditing
              ? "Cập nhật chương học"
              : "Tạo chương học"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
