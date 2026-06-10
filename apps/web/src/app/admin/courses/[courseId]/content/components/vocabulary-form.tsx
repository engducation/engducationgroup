"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type StatusValue = "DRAFT" | "PUBLISHED" | "PAUSED";

interface VocabularyFormState {
  word: string;
  meaning: string;
  partOfSpeech: string;
  phonetic: string;
  example: string;
  notes: string;
  orderIndex: string;
  status: StatusValue;
}

interface VocabularyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  form: VocabularyFormState;
  onFormChange: (form: VocabularyFormState) => void;
  submitting: boolean;
  isEditing: boolean;
}

const PART_OF_SPEECH_OPTIONS = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "preposition",
  "conjunction",
  "pronoun",
  "determiner",
  "exclamation",
];

export function VocabularyFormDialog({
  open,
  onOpenChange,
  onSubmit,
  form,
  onFormChange,
  submitting,
  isEditing,
}: VocabularyFormProps) {
  const updateForm = (field: keyof VocabularyFormState, value: string) => {
    onFormChange({ ...form, [field]: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Chỉnh sửa từ vựng" : "Thêm từ vựng mới"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Cập nhật thông tin từ vựng."
              : "Thêm từ vựng mới vào chương học."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 px-1 pb-2">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Từ vựng *</label>
              <Input
                placeholder="VD: comfortable"
                value={form.word}
                onChange={(e) => updateForm("word", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Từ loại *</label>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                value={form.partOfSpeech}
                onChange={(e) => updateForm("partOfSpeech", e.target.value)}
              >
                {PART_OF_SPEECH_OPTIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos.charAt(0).toUpperCase() + pos.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Nghĩa *</label>
            <Input
              placeholder="VD: thoải mái, dễ chịu"
              value={form.meaning}
              onChange={(e) => updateForm("meaning", e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Phiên âm</label>
              <Input
                placeholder="VD: /ˈkʌmftəbl/"
                value={form.phonetic}
                onChange={(e) => updateForm("phonetic", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Thứ tự</label>
              <Input
                type="number"
                placeholder="1"
                value={form.orderIndex}
                onChange={(e) => updateForm("orderIndex", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Ví dụ</label>
            <Textarea
              placeholder="VD: The hotel room was very comfortable."
              className="resize-none"
              value={form.example}
              onChange={(e) => updateForm("example", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Ghi chú</label>
            <Textarea
              placeholder="Ghi chú bổ sung..."
              className="resize-none"
              value={form.notes}
              onChange={(e) => updateForm("notes", e.target.value)}
            />
          </div>

          {isEditing && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Trạng thái</label>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                value={form.status}
                onChange={(e) => updateForm("status", e.target.value)}
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="PAUSED">Paused</option>
              </select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Hủy
          </Button>
          <Button onClick={onSubmit} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700">
            {submitting ? "Đang lưu..." : "Lưu từ vựng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
