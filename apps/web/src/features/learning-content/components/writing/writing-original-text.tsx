"use client";

/**
 * WritingOriginalText - Hiển thị văn bản gốc của học viên với các cụm từ sai
 * được bọc trong <span> có nền màu lỗi. Hover vào cụm lỗi sẽ mở popover
 * hiển thị "từ đúng" + giải thích.
 *
 * Đây là pure presentation: bóc tách văn bản qua `buildTextSegments` từ
 * utils/highlight-errors.ts để tách biệt phần logic highlight khỏi JSX.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { WritingError } from "@/features/learning-content/types";
import { buildTextSegments, type TextSegment } from "../../utils/highlight-errors";

const TYPE_LABEL: Record<WritingError["type"], string> = {
  grammar: "Ngữ pháp",
  spelling: "Chính tả",
  style: "Phong cách",
};

const TYPE_STYLES: Record<WritingError["type"], string> = {
  grammar: "bg-rose-100 text-rose-900 ring-1 ring-rose-200 hover:bg-rose-200",
  spelling: "bg-amber-100 text-amber-900 ring-1 ring-amber-200 hover:bg-amber-200",
  style: "bg-sky-100 text-sky-900 ring-1 ring-sky-200 hover:bg-sky-200",
};

interface WritingOriginalTextProps {
  text: string;
  errors: WritingError[];
  className?: string;
}

function renderErrorTrigger(
  segment: TextSegment,
  props: React.HTMLAttributes<HTMLElement>,
): React.ReactElement {
  // The caller (`TooltipTrigger render` prop) is always invoked with `error`
  // segments in this file, so we cast and never return null.
  if (segment.kind !== "error") {
    return <span {...props} />;
  }
  return (
    <mark
      {...props}
      className={cn(
        "cursor-pointer rounded px-0.5 transition-colors",
        TYPE_STYLES[segment.error.type],
        props.className,
      )}
    >
      {segment.value}
    </mark>
  );
}

export function WritingOriginalText({
  text,
  errors,
  className,
}: WritingOriginalTextProps) {
  const segments = React.useMemo(() => buildTextSegments(text, errors), [text, errors]);

  if (segments.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground italic", className)}>
        Chưa có nội dung bài viết.
      </p>
    );
  }

  return (
    <TooltipProvider delay={100}>
      <p
        className={cn(
          "whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground",
          className,
        )}
      >
        {segments.map((segment) => {
          if (segment.kind === "text") {
            return <React.Fragment key={segment.key}>{segment.value}</React.Fragment>;
          }
          return (
            <Tooltip key={segment.key}>
              <TooltipTrigger
                render={(triggerProps) => renderErrorTrigger(segment, triggerProps)}
              />
              <TooltipContent
                side="top"
                className="max-w-xs border-0 bg-foreground p-3 text-left"
              >
                <ErrorPopoverBody error={segment.error} />
              </TooltipContent>
            </Tooltip>
          );
        })}
      </p>
    </TooltipProvider>
  );
}

/**
 * Body của popover — tách riêng để giữ component cha dưới ngưỡng 250 dòng
 * và dễ test/khi cần dùng lại (vd: trong trang xem lại submission).
 */
export function ErrorPopoverBody({ error }: { error: WritingError }) {
  return (
    <div className="flex flex-col gap-1.5 text-xs text-background">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-background/70">
        <span>{TYPE_LABEL[error.type]}</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="line-through text-background/60">{error.original}</span>
        <span className="font-semibold text-emerald-300">{error.replacement}</span>
      </div>
      <p className="text-background/90 leading-relaxed">{error.explanation}</p>
    </div>
  );
}
