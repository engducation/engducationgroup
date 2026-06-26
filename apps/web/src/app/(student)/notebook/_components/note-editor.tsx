"use client";

/**
 * NoteEditor
 *
 * Inline note editor with debounced save (500ms).
 * Max 1000 chars.
 */

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MAX_LEN = 1000;

export function NoteEditor({
  vocabularyId,
  initialNote,
  onSave,
}: {
  vocabularyId: string;
  initialNote: string | null;
  onSave: (
    vocabularyId: string,
    note: string,
  ) => Promise<{ success: boolean; error?: string }>;
}) {
  const [value, setValue] = useState(initialNote ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [editing, setEditing] = useState(false);

  // Debounce save
  useEffect(() => {
    if (!editing) return;
    const v = value;
    const t = setTimeout(async () => {
      if (v === (initialNote ?? "")) return;
      setStatus("saving");
      const r = await onSave(vocabularyId, v);
      if (!r.success) {
        setStatus("idle");
        toast.error(r.error ?? "Lỗi khi lưu ghi chú");
      } else {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 1500);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [value, editing, vocabularyId, initialNote, onSave]);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="group flex w-full items-start gap-2 rounded-md border border-dashed p-2 text-left text-sm text-slate-500 hover:border-slate-300 hover:bg-slate-50"
      >
        <Pencil className="mt-0.5 h-3 w-3" />
        <span className="flex-1">
          {value || "Thêm ghi chú..."}
        </span>
      </button>
    );
  }

  return (
    <div className="space-y-1">
      <Textarea
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX_LEN))}
        onBlur={() => setEditing(false)}
        placeholder="Ghi chú cá nhân..."
        rows={3}
        className="text-sm"
      />
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{value.length}/{MAX_LEN}</span>
        <span className={cn(status === "saving" && "text-amber-500", status === "saved" && "text-emerald-500")}>
          {status === "saving" ? (
            <>
              <Loader2 className="inline h-3 w-3 animate-spin" /> Đang lưu
            </>
          ) : status === "saved" ? (
            <>
              <CheckCircle2 className="inline h-3 w-3" /> Đã lưu
            </>
          ) : (
            "Tự lưu khi ngừng gõ"
          )}
        </span>
      </div>
    </div>
  );
}