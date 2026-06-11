"use client";

import { useState } from "react";
import { Sparkles, Play, Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WritingContent {
  title: string;
  prompt: string;
  gradingCriteria: string;
  wordCountGuidance: string;
  aiPromptId: string;
  maxAiRevisions: string;
  dueDate: string;
  submissionMode: "OPEN" | "CLOSED";
}

interface WritingLessonEditorProps {
  content: WritingContent;
  onContentChange: (content: WritingContent) => void;
  onTestPrompt?: (prompt: string, userText: string) => Promise<string>;
  isTestingPrompt?: boolean;
}

export function WritingLessonEditor({
  content,
  onContentChange,
  onTestPrompt,
  isTestingPrompt = false,
}: WritingLessonEditorProps) {
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState("");
  const [testError, setTestError] = useState("");

  const handleTestPrompt = async () => {
    if (!onTestPrompt || !testInput.trim()) return;

    setTestError("");
    setTestOutput("");

    try {
      const result = await onTestPrompt(content.prompt, testInput);
      setTestOutput(result);
    } catch (err) {
      setTestError(err instanceof Error ? err.message : "Lỗi khi chạy prompt");
    }
  };

  return (
    <div className="space-y-8">
      {/* Part 1: Prompt Configuration */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
              <path d="M12 19l7-7 3 3-7 7-3-3z"/>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
              <path d="M2 2l7.586 7.586"/>
              <circle cx="11" cy="11" r="2"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Cấu hình Bài tập Writing</h3>
            <p className="text-xs text-slate-500">Thiết lập đề bài và tiêu chí chấm điểm</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: Basic Info */}
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="writing-title" className="text-xs font-semibold text-slate-600">Tiêu đề bài viết *</Label>
              <Input
                id="writing-title"
                placeholder="VD: Writing Task 1 — IELTS Academic"
                value={content.title}
                onChange={(e) => onContentChange({ ...content, title: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="writing-prompt" className="text-xs font-semibold text-slate-600">Đề bài / Prompt</Label>
              <Textarea
                id="writing-prompt"
                placeholder="Nhập đề bài hoặc prompt cho bài viết..."
                className="min-h-32 resize-none"
                value={content.prompt}
                onChange={(e) => onContentChange({ ...content, prompt: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="grading-criteria" className="text-xs font-semibold text-slate-600">Tiêu chí chấm điểm</Label>
              <Textarea
                id="grading-criteria"
                placeholder="Mô tả tiêu chí chấm điểm, band descriptor, rubric..."
                className="min-h-28 resize-none"
                value={content.gradingCriteria}
                onChange={(e) => onContentChange({ ...content, gradingCriteria: e.target.value })}
              />
            </div>
          </div>

          {/* Right: Settings */}
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="word-count" className="text-xs font-semibold text-slate-600">Số từ yêu cầu</Label>
                <Input
                  id="word-count"
                  type="number"
                  placeholder="150"
                  value={content.wordCountGuidance}
                  onChange={(e) => onContentChange({ ...content, wordCountGuidance: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="due-date" className="text-xs font-semibold text-slate-600">Hạn nộp</Label>
                <Input
                  id="due-date"
                  type="date"
                  value={content.dueDate}
                  onChange={(e) => onContentChange({ ...content, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="max-revisions" className="text-xs font-semibold text-slate-600">Max AI revisions</Label>
                <Input
                  id="max-revisions"
                  type="number"
                  placeholder="5"
                  min="0"
                  value={content.maxAiRevisions}
                  onChange={(e) => onContentChange({ ...content, maxAiRevisions: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="submission-mode" className="text-xs font-semibold text-slate-600">Chế độ nhận bài</Label>
                <select
                  id="submission-mode"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  value={content.submissionMode}
                  onChange={(e) => onContentChange({ ...content, submissionMode: e.target.value as "OPEN" | "CLOSED" })}
                >
                  <option value="OPEN">Mở — có thể nộp lại nhiều lần</option>
                  <option value="CLOSED">Đóng — chỉ nộp một lần</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ai-prompt-id" className="text-xs font-semibold text-slate-600">AI Prompt ID</Label>
              <Input
                id="ai-prompt-id"
                placeholder="prompt-uuid-... (tùy chọn)"
                value={content.aiPromptId}
                onChange={(e) => onContentChange({ ...content, aiPromptId: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Part 2: AI Playground Tool */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">AI Playground — Chạy thử nghiệm Prompt</h3>
              <p className="text-xs text-slate-500">Kiểm tra và tinh chỉnh prompt AI trước khi lưu</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestPrompt}
            disabled={isTestingPrompt || !testInput.trim() || !onTestPrompt}
            className="gap-2"
          >
            {isTestingPrompt ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Chạy thử nghiệm
          </Button>
        </div>

        <Tabs defaultValue="input" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="input" className="gap-2">
              <Send className="size-4" />
              Nhập văn bản test
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Sparkles className="size-4" />
              Xem kết quả AI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="mt-4">
            <div className="space-y-4">
              <Textarea
                placeholder="Nhập văn bản lỗi ngẫu nhiên để test prompt AI..."
                className="min-h-40 font-mono text-sm"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
              />
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{testInput.split(/\s+/).filter(Boolean).length} từ</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTestInput("")}
                  className="h-7 text-xs"
                >
                  Xóa
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            {testError ? (
              <Alert variant="destructive">
                <AlertDescription>{testError}</AlertDescription>
              </Alert>
            ) : testOutput ? (
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                    <Sparkles className="size-4" />
                    Kết quả phân tích AI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm prose-emerald max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans bg-transparent p-0 m-0 shadow-none">
                      {testOutput}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
                    <Sparkles className="size-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Chưa có kết quả</p>
                  <p className="text-xs text-slate-400">
                    Nhập văn bản test ở tab &ldquo;Nhập văn bản test&rdquo; và nhấn &ldquo;Chạy thử nghiệm&rdquo;
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
