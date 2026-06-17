"use client";

/**
 * WritingAssistantClient - Shell gom tất cả component UI của AI Writing Assistant.
 *
 * Luồng:
 *   1. Nhận đề bài (writeId, prompt) từ server page.
 *   2. Dùng useWritingAssistant để quản lý state.
 *   3. Khi chưa có analysis: render WritingAssistantForm + đề bài.
 *   4. Khi đã có analysis: render WritingAnalysisPanel.
 *   5. Có thể "viết lại" để reset về form.
 */

import * as React from "react";
import { RotateCcw, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WritingAssistantForm } from "./writing-assistant-form";
import { WritingAnalysisPanel } from "./writing-analysis-panel";
import { useWritingAssistant } from "../../hooks/useWritingAssistant";
import type { WritingAnalysis } from "@/features/learning-content/types";

interface WritingAssistantClientProps {
  writeId: string;
  prompt: string;
  wordCountGuidance: number | null;
  initialAnalysis?: WritingAnalysis | null;
  initialContent?: string;
}

export function WritingAssistantClient({
  writeId,
  prompt,
  wordCountGuidance,
  initialAnalysis = null,
  initialContent = "",
}: WritingAssistantClientProps) {
  const {
    content,
    setContent,
    wordCount,
    isValid,
    isSubmitting,
    error,
    analysis,
    submit,
    reset,
  } = useWritingAssistant({ writeId, initialAnalysis, initialContent });

  return (
    <div className="flex flex-col gap-6">
      {/* Đề bài */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Wand2 className="size-4 text-indigo-500" />
            <CardTitle>Đề bài</CardTitle>
            {wordCountGuidance && (
              <Badge variant="outline">Gợi ý: {wordCountGuidance} từ</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {prompt}
          </p>
        </CardContent>
      </Card>

      {/* Form hoặc kết quả */}
      {!analysis ? (
        <Card>
          <CardHeader>
            <CardTitle>Bài viết của bạn</CardTitle>
          </CardHeader>
          <CardContent>
            <WritingAssistantForm
              value={content}
              onChange={setContent}
              wordCount={wordCount}
              isValid={isValid}
              isSubmitting={isSubmitting}
              error={error}
              onSubmit={submit}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <WritingAnalysisPanel originalText={content} analysis={analysis} />
          <div className="flex justify-end">
            <Button variant="outline" onClick={reset}>
              <RotateCcw />
              Viết lại
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
