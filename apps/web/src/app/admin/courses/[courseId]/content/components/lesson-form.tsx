"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FilePenLine, FileQuestion, FileText, Trash2, Video } from "lucide-react";

type LessonType = "TEXT" | "VIDEO" | "QUIZ" | "WRITING";
type StatusValue = "DRAFT" | "PUBLISHED" | "PAUSED";

interface LessonFormState {
  title: string;
  description: string;
  type: LessonType;
  status: StatusValue;
  orderIndex: string;
  isRequired: boolean;
}

interface TextContent {
  title: string;
  content: string;
  keywords: string;
  learningObjectives: string;
}

interface VideoContent {
  title: string;
  description: string;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  durationSeconds: string;
  resourceNotes: string;
}

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

interface QuizQuestion {
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

interface LessonFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  lessonForm: LessonFormState;
  onLessonFormChange: (form: LessonFormState) => void;
  textContent: TextContent;
  onTextContentChange: (content: TextContent) => void;
  videoContent: VideoContent;
  onVideoContentChange: (content: VideoContent) => void;
  writingContent: WritingContent;
  onWritingContentChange: (content: WritingContent) => void;
  quizTitle: string;
  onQuizTitleChange: (title: string) => void;
  quizPassingPercentage: string;
  onQuizPassingPercentageChange: (percentage: string) => void;
  quizQuestions: QuizQuestion[];
  onQuizQuestionsChange: (questions: QuizQuestion[]) => void;
  submitting: boolean;
  isEditing: boolean;
}

const STATUS_OPTIONS: { value: StatusValue; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "PAUSED", label: "Paused" },
];

export function LessonFormDialog({
  open,
  onOpenChange,
  onSubmit,
  lessonForm,
  onLessonFormChange,
  textContent,
  onTextContentChange,
  videoContent,
  onVideoContentChange,
  writingContent,
  onWritingContentChange,
  quizTitle,
  onQuizTitleChange,
  quizPassingPercentage,
  onQuizPassingPercentageChange,
  quizQuestions,
  onQuizQuestionsChange,
  submitting,
  isEditing,
}: LessonFormProps) {
  const updateQuestion = (index: number, field: keyof QuizQuestion, value: string | number | string[]) => {
    const updated = [...quizQuestions];
    if (field === "correctOption") {
      updated[index] = { ...updated[index], [field]: value as number };
    } else if (field === "options") {
      updated[index] = { ...updated[index], [field]: value as string[] };
    } else {
      updated[index] = { ...updated[index], [field]: value as string };
    }
    onQuizQuestionsChange(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...quizQuestions];
    updated[questionIndex] = {
      ...updated[questionIndex],
      options: [...updated[questionIndex].options, ""],
    };
    onQuizQuestionsChange(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...quizQuestions];
    updated[questionIndex] = {
      ...updated[questionIndex],
      options: updated[questionIndex].options.filter((_, i) => i !== optionIndex),
      correctOption: updated[questionIndex].correctOption >= updated[questionIndex].options.length - 1
        ? 0
        : updated[questionIndex].correctOption,
    };
    onQuizQuestionsChange(updated);
  };

  const addQuestion = () => {
    onQuizQuestionsChange([
      ...quizQuestions,
      { question: "", options: ["", ""], correctOption: 0, explanation: "" },
    ]);
  };

  const removeQuestion = (index: number) => {
    onQuizQuestionsChange(quizQuestions.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-3 pr-8">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <FileText className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-left">{isEditing ? "Chỉnh sửa bài học" : "Tạo bài học mới"}</DialogTitle>
              <DialogDescription className="text-left">
                {isEditing ? "Cập nhật nội dung bài học hiện có." : "Tạo bài học mới — nội dung sẽ ở trạng thái bản nháp."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 px-4 pb-2">
          {/* Basic Info */}
          <BasicInfoSection
            form={lessonForm}
            onFormChange={onLessonFormChange}
            isEditing={isEditing}
          />

          {/* Text Content */}
          {lessonForm.type === "TEXT" && (
            <TextContentSection
              content={textContent}
              onContentChange={onTextContentChange}
            />
          )}

          {/* Video Content */}
          {lessonForm.type === "VIDEO" && (
            <VideoContentSection
              content={videoContent}
              onContentChange={onVideoContentChange}
            />
          )}

          {/* Writing Content */}
          {lessonForm.type === "WRITING" && (
            <WritingContentSection
              content={writingContent}
              onContentChange={onWritingContentChange}
            />
          )}

          {/* Quiz Content */}
          {lessonForm.type === "QUIZ" && (
            <QuizContentSection
              title={quizTitle}
              onTitleChange={onQuizTitleChange}
              passingPercentage={quizPassingPercentage}
              onPassingPercentageChange={onQuizPassingPercentageChange}
              questions={quizQuestions}
              onQuestionChange={updateQuestion}
              onAddOption={addOption}
              onRemoveOption={removeOption}
              onAddQuestion={addQuestion}
              onRemoveQuestion={removeQuestion}
            />
          )}
        </div>

        <DialogFooter className="px-4 pb-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Hủy
          </Button>
          <Button onClick={onSubmit} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700">
            {submitting ? "Đang lưu..." : isEditing ? "Cập nhật" : "Tạo bài học"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Section Components

function BasicInfoSection({
  form,
  onFormChange,
  isEditing,
}: {
  form: LessonFormState;
  onFormChange: (form: LessonFormState) => void;
  isEditing: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Thông tin cơ bản</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Tên bài học *</label>
          <Input
            placeholder="VD: Bài 1 — Giới thiệu ngữ pháp"
            value={form.title}
            onChange={(e) => onFormChange({ ...form, title: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Loại nội dung</label>
          <select
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
            value={form.type}
            onChange={(e) => onFormChange({ ...form, type: e.target.value as LessonType })}
          >
            <option value="TEXT">📄 Text lesson</option>
            <option value="VIDEO">🎬 Video lesson</option>
            <option value="QUIZ">❓ Quiz</option>
            <option value="WRITING">✍️ Writing</option>
          </select>
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-semibold text-slate-600">Mô tả ngắn</label>
          <Textarea
            placeholder="Mô tả ngắn gọn nội dung bài học..."
            value={form.description}
            className="resize-none"
            onChange={(e) => onFormChange({ ...form, description: e.target.value })}
          />
        </div>
        {isEditing && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Trạng thái</label>
            <select
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              value={form.status}
              onChange={(e) => onFormChange({ ...form, status: e.target.value as StatusValue })}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Thứ tự trong chương</label>
          <Input
            type="number"
            placeholder="1"
            value={form.orderIndex}
            onChange={(e) => onFormChange({ ...form, orderIndex: e.target.value })}
          />
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              className="size-4 rounded border-slate-300 text-indigo-600"
              checked={form.isRequired}
              onChange={(e) => onFormChange({ ...form, isRequired: e.target.checked })}
            />
            <span className="text-sm font-medium text-slate-700">Bắt buộc hoàn thành</span>
          </label>
        </div>
      </div>
    </div>
  );
}

function TextContentSection({
  content,
  onContentChange,
}: {
  content: TextContent;
  onContentChange: (content: TextContent) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
          <FileText className="size-4" />
        </div>
        <p className="text-sm font-semibold text-slate-900">Nội dung Text</p>
      </div>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Tiêu đề bài text</label>
          <Input
            placeholder="VD: Grammar Focus — Câu điều kiện loại 1"
            value={content.title}
            onChange={(e) => onContentChange({ ...content, title: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Nội dung bài học</label>
          <Textarea
            placeholder="Nhập nội dung bài học tại đây..."
            className="min-h-44 font-mono text-sm"
            value={content.content}
            onChange={(e) => onContentChange({ ...content, content: e.target.value })}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Từ khóa</label>
            <Input
              placeholder="VD: conditionals, if, when"
              value={content.keywords}
              onChange={(e) => onContentChange({ ...content, keywords: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Mục tiêu bài học</label>
            <Input
              placeholder="VD: Hiểu cấu trúc câu điều kiện"
              value={content.learningObjectives}
              onChange={(e) => onContentChange({ ...content, learningObjectives: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoContentSection({
  content,
  onContentChange,
}: {
  content: VideoContent;
  onContentChange: (content: VideoContent) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
          <Video className="size-4" />
        </div>
        <p className="text-sm font-semibold text-slate-900">Nội dung Video</p>
      </div>
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Tiêu đề video</label>
            <Input
              placeholder="VD: Bài giảng — Câu điều kiện"
              value={content.title}
              onChange={(e) => onContentChange({ ...content, title: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Thời lượng (giây)</label>
            <Input
              type="number"
              placeholder="600"
              value={content.durationSeconds}
              onChange={(e) => onContentChange({ ...content, durationSeconds: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Mô tả video</label>
          <Textarea
            placeholder="Mô tả nội dung video..."
            className="resize-none"
            value={content.description}
            onChange={(e) => onContentChange({ ...content, description: e.target.value })}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Cloudinary Public ID</label>
            <Input
              placeholder="folder/video-name"
              value={content.cloudinaryPublicId}
              onChange={(e) => onContentChange({ ...content, cloudinaryPublicId: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Cloudinary URL</label>
            <Input
              placeholder="https://res.cloudinary.com/..."
              value={content.cloudinaryUrl}
              onChange={(e) => onContentChange({ ...content, cloudinaryUrl: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Tài nguyên / Ghi chú</label>
          <Textarea
            placeholder="Link tài liệu, transcript, hoặc ghi chú bổ sung..."
            className="resize-none"
            value={content.resourceNotes}
            onChange={(e) => onContentChange({ ...content, resourceNotes: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

function WritingContentSection({
  content,
  onContentChange,
}: {
  content: WritingContent;
  onContentChange: (content: WritingContent) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <FilePenLine className="size-4" />
        </div>
        <p className="text-sm font-semibold text-slate-900">Bài tập Writing</p>
      </div>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Tiêu đề bài viết</label>
          <Input
            placeholder="VD: Writing Task 1"
            value={content.title}
            onChange={(e) => onContentChange({ ...content, title: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Đề bài / Prompt</label>
          <Textarea
            placeholder="Nhập đề bài hoặc prompt cho bài viết..."
            className="min-h-28"
            value={content.prompt}
            onChange={(e) => onContentChange({ ...content, prompt: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Tiêu chí chấm điểm / Hướng dẫn</label>
          <Textarea
            placeholder="Mô tả tiêu chí chấm điểm, band descriptor, rubric..."
            className="min-h-24"
            value={content.gradingCriteria}
            onChange={(e) => onContentChange({ ...content, gradingCriteria: e.target.value })}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Số từ yêu cầu</label>
            <Input
              type="number"
              placeholder="150"
              value={content.wordCountGuidance}
              onChange={(e) => onContentChange({ ...content, wordCountGuidance: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Hạn nộp</label>
            <Input
              type="date"
              value={content.dueDate}
              onChange={(e) => onContentChange({ ...content, dueDate: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Max AI revisions</label>
            <Input
              type="number"
              placeholder="5"
              value={content.maxAiRevisions}
              onChange={(e) => onContentChange({ ...content, maxAiRevisions: e.target.value })}
            />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">AI Prompt ID</label>
            <Input
              placeholder="prompt-uuid-..."
              value={content.aiPromptId}
              onChange={(e) => onContentChange({ ...content, aiPromptId: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Chế độ nhận bài</label>
            <select
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              value={content.submissionMode}
              onChange={(e) => onContentChange({ ...content, submissionMode: e.target.value as "OPEN" | "CLOSED" })}
            >
              <option value="OPEN">Mở — có thể nộp lại nhiều lần</option>
              <option value="CLOSED">Đóng — chỉ nộp một lần</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuizContentSection({
  title,
  onTitleChange,
  passingPercentage,
  onPassingPercentageChange,
  questions,
  onQuestionChange,
  onAddOption,
  onRemoveOption,
  onAddQuestion,
  onRemoveQuestion,
}: {
  title: string;
  onTitleChange: (title: string) => void;
  passingPercentage: string;
  onPassingPercentageChange: (percentage: string) => void;
  questions: QuizQuestion[];
  onQuestionChange: (index: number, field: keyof QuizQuestion, value: string | number | string[]) => void;
  onAddOption: (index: number) => void;
  onRemoveOption: (questionIndex: number, optionIndex: number) => void;
  onAddQuestion: () => void;
  onRemoveQuestion: (index: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
          <FileQuestion className="size-4" />
        </div>
        <p className="text-sm font-semibold text-slate-900">Câu hỏi Quiz</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Tên quiz</label>
          <Input
            placeholder="VD: Kiểm tra từ vựng bài 1"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Tỉ lệ đạt (%)</label>
          <Input
            type="number"
            placeholder="70"
            value={passingPercentage}
            onChange={(e) => onPassingPercentageChange(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-4">
        {questions.map((question, questionIndex) => (
          <div key={questionIndex} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">Câu {questionIndex + 1}</p>
              {questions.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 px-2"
                  onClick={() => onRemoveQuestion(questionIndex)}
                >
                  <Trash2 className="size-3" />
                  Xóa
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Câu hỏi..."
                value={question.question}
                onChange={(e) => onQuestionChange(questionIndex, "question", e.target.value)}
              />
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${questionIndex}`}
                      checked={question.correctOption === optionIndex}
                      onChange={() => onQuestionChange(questionIndex, "correctOption", optionIndex)}
                      className="size-4"
                    />
                    <Input
                      placeholder={`Đáp án ${optionIndex + 1}`}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...question.options];
                        newOptions[optionIndex] = e.target.value;
                        onQuestionChange(questionIndex, "options", newOptions);
                      }}
                      className="flex-1"
                    />
                    {question.options.length > 2 && (
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => onRemoveOption(questionIndex, optionIndex)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddOption(questionIndex)}
                className="w-full"
              >
                + Thêm đáp án
              </Button>
            </div>
            <Textarea
              placeholder="Giải thích đáp án đúng..."
              value={question.explanation}
              onChange={(e) => onQuestionChange(questionIndex, "explanation", e.target.value)}
              className="min-h-16 text-sm"
            />
          </div>
        ))}
        <Button
          variant="outline"
          onClick={onAddQuestion}
          className="w-full"
        >
          + Thêm câu hỏi
        </Button>
      </div>
    </div>
  );
}
