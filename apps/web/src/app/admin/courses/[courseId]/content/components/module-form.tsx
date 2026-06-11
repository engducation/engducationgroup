"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ModuleFormDialogProps {
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

export function ModuleFormDialog({
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
}: ModuleFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
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
              <DialogTitle className="text-left">
                {isEditing ? "Chỉnh sửa chương học" : "Tạo chương học mới"}
              </DialogTitle>
              <DialogDescription className="text-left">
                {isEditing
                  ? "Cập nhật thông tin chương học."
                  : "Chương học sẽ được tạo ở trạng thái bản nháp. Bạn có thể chỉnh sửa trạng thái sau."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 px-1 pb-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Tên chương học *</label>
            <Input
              placeholder="VD: Chương 1 — Ngữ pháp cơ bản"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Mô tả</label>
            <Textarea
              placeholder="Mô tả ngắn gọn nội dung chương học..."
              className="resize-none text-sm"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
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
            {submitting
              ? isEditing
                ? "Đang cập nhật..."
                : "Đang tạo..."
              : isEditing
                ? "Cập nhật chương học"
                : "Tạo chương học"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
