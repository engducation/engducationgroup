"use client";

import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";

import { Button } from "@/components/ui/button";

interface StickyActionBarProps {
  isDirty: boolean;
  isSubmitting: boolean;
  onSave: () => void;
  onCancel: () => void;
  saveLabel?: string;
  cancelLabel?: string;
}

export function StickyActionBar({
  isDirty,
  isSubmitting,
  onSave,
  onCancel,
  saveLabel = "Lưu thay đổi",
  cancelLabel = "Hủy bỏ",
}: StickyActionBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isDirty) {
      setVisible(true);
    } else {
      // Small delay to allow for smooth transition
      const timer = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isDirty]);

  if (!visible && !isDirty) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-0 right-0 w-full transition-all duration-300 ease-out z-50 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      }`}
    >
      <div className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-end gap-3 px-6 py-4 max-w-5xl mx-auto">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="gap-2"
          >
            <X className="size-4" />
            {cancelLabel}
          </Button>
          <Button
            onClick={onSave}
            disabled={isSubmitting}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            {isSubmitting ? (
              <>
                <svg className="size-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Đang lưu...
              </>
            ) : (
              <>
                <Check className="size-4" />
                {saveLabel}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Spacer to prevent content from being hidden */}
      <div className="h-[72px] lg:h-[80px]" />
    </div>
  );
}
