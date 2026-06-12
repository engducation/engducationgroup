"use client";

import { Plus, Trash2, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface QuizQuestion {
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

interface QuizLessonConfigProps {
  title: string;
  passingPercentage: string;
  questions: QuizQuestion[];
  onTitleChange: (title: string) => void;
  onPassingPercentageChange: (percentage: string) => void;
  onQuestionsChange: (questions: QuizQuestion[]) => void;
}

export function QuizLessonConfig({
  title,
  passingPercentage,
  questions,
  onTitleChange,
  onPassingPercentageChange,
  onQuestionsChange,
}: QuizLessonConfigProps) {
  const updateQuestion = (
    index: number,
    field: keyof QuizQuestion,
    value: string | number | string[]
  ) => {
    const updated = [...questions];
    if (field === "correctOption") {
      updated[index] = { ...updated[index], [field]: value as number };
    } else if (field === "options") {
      updated[index] = { ...updated[index], [field]: value as string[] };
    } else {
      updated[index] = { ...updated[index], [field]: value as string };
    }
    onQuestionsChange(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex] = {
      ...updated[questionIndex],
      options: [...updated[questionIndex].options, ""],
    };
    onQuestionsChange(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex] = {
      ...updated[questionIndex],
      options: updated[questionIndex].options.filter((_, i) => i !== optionIndex),
      correctOption:
        updated[questionIndex].correctOption >= updated[questionIndex].options.length - 1
          ? 0
          : updated[questionIndex].correctOption,
    };
    onQuestionsChange(updated);
  };

  const addQuestion = () => {
    onQuestionsChange([
      ...questions,
      { question: "", options: ["", ""], correctOption: 0, explanation: "" },
    ]);
  };

  const removeQuestion = (index: number) => {
    onQuestionsChange(questions.filter((_, i) => i !== index));
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Column: Question List (3 columns) */}
      <div className="col-span-12 lg:col-span-3 space-y-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-900">
                Danh sách câu hỏi
              </CardTitle>
              <span className="text-xs text-slate-500">{questions.length} câu</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    const element = document.getElementById(`question-${index}`);
                    element?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50"
                >
                  <span className="font-medium text-slate-700">Câu {index + 1}</span>
                  <span className="text-xs text-slate-400">
                    {questions[index].options.filter((o) => o.trim()).length} đáp án
                  </span>
                </button>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={addQuestion}
              className="w-full mt-4 gap-1.5"
            >
              <Plus className="size-4" />
              Thêm câu hỏi
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Question Detail Form (9 columns) */}
      <div className="col-span-12 lg:col-span-9 space-y-6">
        {/* Quiz Settings */}
        <Card className="border-slate-200">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="size-5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Cấu hình Quiz
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thiết lập thông tin cơ bản cho bài quiz
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiz-title" className="text-xs font-semibold text-slate-700">
                  Tên quiz <span className="text-slate-400 font-normal">(tùy chọn)</span>
                </Label>
                <Input
                  id="quiz-title"
                  placeholder="VD: Kiểm tra từ vựng bài 1"
                  value={title}
                  onChange={(e) => onTitleChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passing-percentage" className="text-xs font-semibold text-slate-700">
                  Tỉ lệ đạt (%) <span className="text-slate-400 font-normal">(tùy chọn)</span>
                </Label>
                <Input
                  id="passing-percentage"
                  type="number"
                  placeholder="70"
                  min="0"
                  max="100"
                  value={passingPercentage}
                  onChange={(e) => onPassingPercentageChange(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((question, questionIndex) => (
            <QuestionCard
              key={questionIndex}
              index={questionIndex}
              question={question}
              onChange={(field, value) => updateQuestion(questionIndex, field, value)}
              onAddOption={() => addOption(questionIndex)}
              onRemoveOption={(optionIndex) => removeOption(questionIndex, optionIndex)}
              onRemove={
                questions.length > 1 ? () => removeQuestion(questionIndex) : undefined
              }
            />
          ))}

          <Button
            variant="outline"
            onClick={addQuestion}
            className="w-full gap-2"
          >
            <Plus className="size-4" />
            Thêm câu hỏi mới
          </Button>
        </div>
      </div>
    </div>
  );
}

// Question Card Component
function QuestionCard({
  index,
  question,
  onChange,
  onAddOption,
  onRemoveOption,
  onRemove,
}: {
  index: number;
  question: QuizQuestion;
  onChange: (field: keyof QuizQuestion, value: string | number | string[]) => void;
  onAddOption: () => void;
  onRemoveOption: (optionIndex: number) => void;
  onRemove?: () => void;
}) {
  return (
    <div
      id={`question-${index}`}
      className="rounded-2xl border-2 border-slate-200 bg-white p-6 space-y-5 scroll-mt-4"
    >
      {/* Question Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 font-semibold text-sm">
            {index + 1}
          </div>
          <h4 className="font-semibold text-slate-900">Câu hỏi {index + 1}</h4>
        </div>
        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-1.5"
          >
            <Trash2 className="size-4" />
            Xóa câu hỏi
          </Button>
        )}
      </div>

      {/* Question Text */}
      <div className="space-y-2">
        <Label htmlFor={`question-${index}-text`} className="text-xs font-semibold text-slate-700">
          Nội dung câu hỏi <span className="text-slate-400 font-normal">(tùy chọn)</span>
        </Label>
        <Textarea
          id={`question-${index}-text`}
          placeholder="Nhập nội dung câu hỏi..."
          className="min-h-20 resize-none"
          value={question.question}
          onChange={(e) => onChange("question", e.target.value)}
        />
      </div>

      {/* Answer Options - 2x2 Grid */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-slate-700">
          Đáp án — Chọn đáp án đúng bằng cách nhấp vào nút tròn <span className="text-slate-400 font-normal">(tùy chọn)</span>
        </Label>
        <div className="grid gap-3 sm:grid-cols-2">
          {question.options.map((option, optionIndex) => (
            <div
              key={optionIndex}
              className={`flex items-center gap-3 rounded-xl border-2 p-3 transition-colors ${
                question.correctOption === optionIndex
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
              }`}
            >
              <button
                type="button"
                onClick={() => onChange("correctOption", optionIndex)}
                className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  question.correctOption === optionIndex
                    ? "border-emerald-500 bg-emerald-500"
                    : "border-slate-300 hover:border-slate-400"
                }`}
              >
                {question.correctOption === optionIndex && (
                  <Check className="size-3.5 text-white" />
                )}
              </button>
              <div className="flex-1 flex gap-2">
                <span className="shrink-0 text-xs font-medium text-slate-400 mt-2">
                  {String.fromCharCode(65 + optionIndex)}.
                </span>
                <Input
                  placeholder={`Đáp án ${optionIndex + 1}`}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...question.options];
                    newOptions[optionIndex] = e.target.value;
                    onChange("options", newOptions);
                  }}
                  className="flex-1"
                />
              </div>
              {question.options.length > 2 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-slate-400 hover:text-red-500"
                  onClick={() => onRemoveOption(optionIndex)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddOption}
          className="gap-1.5 text-slate-500"
        >
          <Plus className="size-3.5" />
          Thêm đáp án
        </Button>
      </div>

      {/* Explanation */}
      <div className="space-y-2">
        <Label
          htmlFor={`question-${index}-explanation`}
          className="text-xs font-semibold text-slate-700"
        >
          Giải thích đáp án <span className="text-slate-400 font-normal">(tùy chọn)</span>
        </Label>
        <Textarea
          id={`question-${index}-explanation`}
          placeholder="Giải thích tại sao đáp án này là đúng..."
          className="min-h-16 resize-none"
          value={question.explanation}
          onChange={(e) => onChange("explanation", e.target.value)}
        />
      </div>
    </div>
  );
}
