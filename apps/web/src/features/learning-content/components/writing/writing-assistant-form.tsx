"use client";

/**
 * WritingAssistantForm - Form nhập bài viết + nộp để AI phân tích.
 *
 * - Đếm số từ realtime, validate 5-500 từ ngay phía client.
 * - Nút submit disabled khi chưa hợp lệ / đang gửi.
 * - Hiển thị skeleton trong khi chờ AI trả lời.
 */

import * as React from "react";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MAX_WORDS, MIN_WORDS } from "../../hooks/useWritingAssistant";

interface WritingAssistantFormProps {
  value: string;
  onChange: (value: string) => void;
  wordCount: number;
  isValid: boolean;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: () => void;
  disabled?: boolean;
  className?: string;
}

export function WritingAssistantForm({
  value,
  onChange,
  wordCount,
  isValid,
  isSubmitting,
  error,
  onSubmit,
  disabled = false,
  className,
}: WritingAssistantFormProps) {
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Cmd/Ctrl + Enter for power users
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (isValid && !isSubmitting && !disabled) {
          onSubmit();
        }
      }
    },
    [isSubmitting, isValid, onSubmit, disabled],
  );

  const isOutOfRange = wordCount > MAX_WORDS;
  const isTooShort = value.trim().length > 0 && wordCount < MIN_WORDS;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nhập đoạn văn tiếng Anh của bạn vào đây. Hệ thống sẽ phân tích lỗi chính tả, ngữ pháp và phong cách viết..."
        rows={8}
        disabled={isSubmitting || disabled}
        aria-invalid={isOutOfRange || isTooShort || Boolean(error)}
        aria-describedby="word-count-helper"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p
          id="word-count-helper"
          className={cn(
            "text-xs",
            isOutOfRange || isTooShort
              ? "text-destructive"
              : "text-muted-foreground",
          )}
        >
          Số từ: <span className="font-semibold">{wordCount}</span> / tối đa {MAX_WORDS}
          {isTooShort && wordCount > 0 && ` (cần tối thiểu ${MIN_WORDS} từ)`}
        </p>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!isValid || isSubmitting || disabled}
        >
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
          {isSubmitting ? "Đang phân tích..." : "Nộp bài"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Không thể phân tích</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
