"use client";

/**
 * WritingAnalysisPanel - Panel chính hiển thị kết quả phân tích.
 *
 * Layout 2 cột (responsive):
 *   - Trái: Card "Bài viết của bạn" dùng WritingOriginalText.
 *   - Phải: Tabs gồm 3 panel:
 *       1. "Phiên bản hoàn chỉnh" (WritingCorrectedText)
 *       2. "Chi tiết lỗi" (ErrorSummaryTable)
 *       3. "Gợi ý nâng cao" (StyleSuggestionsList)
 *
 * Header card hiển thị điểm số (0-100) + số lỗi tóm tắt nhanh.
 */

import * as React from "react";
import { AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WritingAnalysis } from "@/features/learning-content/types";
import { WritingOriginalText } from "./writing-original-text";
import { WritingCorrectedText } from "./writing-corrected-text";
import {
  ErrorSummaryTable,
  StyleSuggestionsList,
} from "./writing-suggestions";

function scoreTone(score: number): "good" | "warn" | "bad" {
  if (score >= 80) return "good";
  if (score >= 50) return "warn";
  return "bad";
}

const SCORE_STYLES: Record<"good" | "warn" | "bad", string> = {
  good: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
  warn: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  bad: "bg-rose-100 text-rose-800 ring-1 ring-rose-200",
};

interface WritingAnalysisPanelProps {
  originalText: string;
  analysis: WritingAnalysis;
  className?: string;
}

export function WritingAnalysisPanel({
  originalText,
  analysis,
  className,
}: WritingAnalysisPanelProps) {
  const tone = scoreTone(analysis.score);
  const errorCount = analysis.errors.length;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header: Score + summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-500" />
            <CardTitle>Kết quả phân tích từ AI</CardTitle>
          </div>
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-sm font-semibold",
              SCORE_STYLES[tone],
            )}
            aria-label={`Điểm: ${analysis.score}/100`}
          >
            {analysis.score}/100
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {analysis.hasError ? (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="size-3" /> {errorCount} lỗi được phát hiện
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="size-3" /> Không phát hiện lỗi
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Body: 2-column grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: original text with highlights */}
        <Card>
          <CardHeader>
            <CardTitle>Bài viết của bạn</CardTitle>
          </CardHeader>
          <CardContent>
            <WritingOriginalText
              text={originalText}
              errors={analysis.errors}
            />
            <p className="mt-3 text-[11px] text-muted-foreground">
              Rê chuột vào cụm từ được tô màu để xem gợi ý sửa lỗi.
            </p>
          </CardContent>
        </Card>

        {/* Right: tabs */}
        <Card>
          <CardContent className="pt-4">
            <Tabs defaultValue="corrected" orientation="horizontal">
              <TabsList variant="line" className="w-full">
                <TabsTrigger value="corrected">Phiên bản hoàn chỉnh</TabsTrigger>
                <TabsTrigger value="errors">Chi tiết lỗi ({errorCount})</TabsTrigger>
                <TabsTrigger value="suggestions">Gợi ý</TabsTrigger>
              </TabsList>

              <TabsContent value="corrected" className="pt-3">
                <WritingCorrectedText correctedText={analysis.correctedText} />
              </TabsContent>

              <TabsContent value="errors" className="pt-3">
                <ErrorSummaryTable errors={analysis.errors} />
              </TabsContent>

              <TabsContent value="suggestions" className="pt-3">
                <StyleSuggestionsList suggestions={analysis.suggestions} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
