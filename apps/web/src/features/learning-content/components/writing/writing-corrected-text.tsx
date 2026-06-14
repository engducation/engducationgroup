"use client";

/**
 * WritingCorrectedText - Hiển thị phiên bản hoàn chỉnh sau khi AI sửa hết lỗi.
 * Kèm nút "Sao chép" để học viên copy lại toàn bộ văn bản mẫu.
 */

import * as React from "react";
import { toast } from "sonner";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface WritingCorrectedTextProps {
  correctedText: string;
  className?: string;
}

export function WritingCorrectedText({
  correctedText,
  className,
}: WritingCorrectedTextProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard) {
        toast.error("Trình duyệt không hỗ trợ sao chép tự động.");
        return;
      }
      await navigator.clipboard.writeText(correctedText);
      setCopied(true);
      toast.success("Đã sao chép văn bản hoàn chỉnh.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép. Vui lòng thử lại.");
    }
  }, [correctedText]);

  if (!correctedText) {
    return (
      <p className={cn("text-sm text-muted-foreground italic", className)}>
        Chưa có phiên bản sửa lỗi.
      </p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
          aria-label="Sao chép văn bản"
        >
          {copied ? <Check /> : <Copy />}
          {copied ? "Đã sao chép" : "Sao chép"}
        </Button>
      </div>
      <div className="rounded-md border border-emerald-200 bg-emerald-50/50 p-3">
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-emerald-950">
          {correctedText}
        </p>
      </div>
    </div>
  );
}
