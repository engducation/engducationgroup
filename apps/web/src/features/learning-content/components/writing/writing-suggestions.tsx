"use client";

/**
 * WritingSuggestions - Tóm tắt errors + danh sách gợi ý nâng cao phong cách.
 *
 * Tách thành 2 sub-component:
 *   - ErrorSummaryTable: bảng liệt kê từng lỗi (original -> replacement + type)
 *   - StyleSuggestionsList: danh sách 3 gợi ý nâng cao (Vietnamese)
 */

import * as React from "react";
import { Lightbulb, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WritingError } from "@/features/learning-content/types";

const TYPE_LABEL: Record<WritingError["type"], string> = {
  grammar: "Ngữ pháp",
  spelling: "Chính tả",
  style: "Phong cách",
};

const TYPE_BADGE: Record<WritingError["type"], "destructive" | "secondary" | "outline"> = {
  grammar: "destructive",
  spelling: "secondary",
  style: "outline",
};

export function ErrorSummaryTable({ errors }: { errors: WritingError[] }) {
  if (errors.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Tuyệt vời! Không phát hiện lỗi nào trong bài viết.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {errors.map((err, idx) => (
        <li
          key={`${err.original}-${idx}`}
          className="rounded-md border border-border bg-card p-3 text-sm"
        >
          <div className="mb-1.5 flex items-center gap-2">
            <Badge variant={TYPE_BADGE[err.type]}>{TYPE_LABEL[err.type]}</Badge>
            <span className="text-xs text-muted-foreground">Lỗi #{idx + 1}</span>
          </div>
          <div className="mb-1 flex flex-wrap items-baseline gap-2">
            <span className="line-through text-rose-700">{err.original}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-medium text-emerald-700">{err.replacement}</span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{err.explanation}</p>
        </li>
      ))}
    </ul>
  );
}

export function StyleSuggestionsList({ suggestions }: { suggestions: string[] }) {
  if (suggestions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Bài viết đã rất tốt, không có gợi ý bổ sung.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {suggestions.map((s, i) => (
        <li
          key={i}
          className={cn(
            "flex items-start gap-3 rounded-md border border-indigo-100 bg-indigo-50/40 p-3 text-sm",
          )}
        >
          <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-semibold text-white">
            {i + 1}
          </span>
          <span className="text-indigo-950 leading-relaxed">{s}</span>
        </li>
      ))}
    </ol>
  );
}

interface WritingSuggestionsProps {
  errors: WritingError[];
  suggestions: string[];
  className?: string;
}

/**
 * Composition gốc: gom 2 phần vào cùng 1 card để tiện render standalone.
 */
export function WritingSuggestions({
  errors,
  suggestions,
  className,
}: WritingSuggestionsProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-amber-500" />
            Danh sách lỗi ({errors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorSummaryTable errors={errors} />
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="size-3.5 text-amber-500" />
            Gợi ý nâng cao phong cách
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StyleSuggestionsList suggestions={suggestions} />
        </CardContent>
      </Card>
    </div>
  );
}
