"use client";

/**
 * SaveDraftButton - Nút lưu bản nháp thủ công cho bài Writing.
 *
 * Tách thành component riêng để:
 *   - Tự "khoá" nút trong lúc đang lưu (`isSaving`).
 *   - Có thể `memo` hoá ngoài nếu cần, tránh re-render cha.
 *   - Truyền đúng state "đã lưu" / "có thay đổi" qua prop `isDirty`.
 */

import * as React from "react";
import { CheckCircle2, CloudOff, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SaveDraftButtonProps {
  onSave: () => void | Promise<void>;
  disabled: boolean;
  isSaving: boolean;
  isDirty: boolean;
  className?: string;
}

export function SaveDraftButton({
  onSave,
  disabled,
  isSaving,
  isDirty,
  className,
}: SaveDraftButtonProps) {
  const handleClick = React.useCallback(() => {
    void onSave();
  }, [onSave]);

  // Visual hint: when not dirty and not saving, show a "đã lưu" checkmark so
  // the user gets positive feedback that their work is persisted.
  const showSavedState = !isDirty && !isSaving;

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      disabled={disabled}
      className={cn("gap-2", className)}
      aria-label={isSaving ? "Đang lưu bản nháp" : "Lưu bản nháp"}
    >
      {isSaving ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Đang lưu...
        </>
      ) : showSavedState ? (
        <>
          <CheckCircle2 className="size-4 text-emerald-600" />
          Đã lưu
        </>
      ) : (
        <>
          {isDirty ? <CloudOff className="size-4" /> : <Save className="size-4" />}
          Lưu bản nháp
        </>
      )}
    </Button>
  );
}
