"use client";

import { useState } from "react";
import { FilePenLine, FileQuestion, FileText, Trash2, Video, GripVertical, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WritingLessonEditor } from "./writing-lesson-editor";
import { VideoLessonEditor } from "./video-lesson-editor";
import { VocabularyLessonEditor } from "./vocabulary-lesson-editor";

type LessonType = "TEXT" | "VIDEO" | "QUIZ" | "WRITING" | "VOCABULARY";
type StatusValue = "DRAFT" | "PUBLISHED" | "PAUSED";

interface AiPromptOption {
  id: string;
  name: string;
  description?: string | null;
  systemPrompt: string;
  userPromptTemplate: string;
  temperature: number;
  maxTokens: number;
}

interface LessonFormState {
  title: string;
  description: string;
  type: LessonType;
  status: StatusValue;
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

interface LessonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    lessonForm: LessonFormState;
    textContent: TextContent;
    videoContent: VideoContent;
    writingContent: WritingContent;
    quizTitle: string;
    quizPassingPercentage: string;
    quizQuestions: QuizQuestion[];
  }) => void;
  initialData?: {
    lessonForm: LessonFormState;
    textContent: TextContent;
    videoContent: VideoContent;
    writingContent: WritingContent;
    quizTitle: string;
    quizPassingPercentage: string;
    quizQuestions: QuizQuestion[];
  };
  submitting: boolean;
  isEditing: boolean;
  moduleTitle?: string;
  aiPrompts?: AiPromptOption[];
}

const EMPTY_LESSON_FORM: LessonFormState = {
  title: "",
  description: "",
  type: "TEXT",
  status: "DRAFT",
  isRequired: true,
};

const EMPTY_TEXT_CONTENT: TextContent = {
  title: "",
  content: "",
  keywords: "",
  learningObjectives: "",
};

const EMPTY_VIDEO_CONTENT: VideoContent = {
  title: "",
  description: "",
  cloudinaryPublicId: "",
  cloudinaryUrl: "",
  durationSeconds: "",
  resourceNotes: "",
};

const EMPTY_WRITING_CONTENT: WritingContent = {
  title: "",
  prompt: "",
  gradingCriteria: "",
  wordCountGuidance: "",
  aiPromptId: "",
  maxAiRevisions: "5",
  dueDate: "",
  submissionMode: "OPEN",
};

export function LessonFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  submitting,
  isEditing,
  moduleTitle,
  aiPrompts = [],
}: LessonFormDialogProps) {
  const [lessonForm, setLessonForm] = useState<LessonFormState>(
    initialData?.lessonForm ?? EMPTY_LESSON_FORM
  );
  const [textContent, setTextContent] = useState<TextContent>(
    initialData?.textContent ?? EMPTY_TEXT_CONTENT
  );
  const [videoContent, setVideoContent] = useState<VideoContent>(
    initialData?.videoContent ?? EMPTY_VIDEO_CONTENT
  );
  const [writingContent, setWritingContent] = useState<WritingContent>(
    initialData?.writingContent ?? EMPTY_WRITING_CONTENT
  );
  const [quizTitle, setQuizTitle] = useState(initialData?.quizTitle ?? "");
  const [quizPassingPercentage, setQuizPassingPercentage] = useState(
    initialData?.quizPassingPercentage ?? ""
  );
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(
    initialData?.quizQuestions ?? [
      { question: "", options: ["", ""], correctOption: 0, explanation: "" },
    ]
  );

  const handleSubmit = () => {
    onSubmit({
      lessonForm,
      textContent,
      videoContent,
      writingContent,
      quizTitle,
      quizPassingPercentage,
      quizQuestions,
    });
  };

  const updateQuestion = (
    index: number,
    field: keyof QuizQuestion,
    value: string | number | string[]
  ) => {
    const updated = [...quizQuestions];
    if (field === "correctOption") {
      updated[index] = { ...updated[index], [field]: value as number };
    } else if (field === "options") {
      updated[index] = { ...updated[index], [field]: value as string[] };
    } else {
      updated[index] = { ...updated[index], [field]: value as string };
    }
    setQuizQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...quizQuestions];
    updated[questionIndex] = {
      ...updated[questionIndex],
      options: [...updated[questionIndex].options, ""],
    };
    setQuizQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...quizQuestions];
    updated[questionIndex] = {
      ...updated[questionIndex],
      options: updated[questionIndex].options.filter((_, i) => i !== optionIndex),
      correctOption:
        updated[questionIndex].correctOption >= updated[questionIndex].options.length - 1
          ? 0
          : updated[questionIndex].correctOption,
    };
    setQuizQuestions(updated);
  };

  const addQuestion = () => {
    setQuizQuestions([
      ...quizQuestions,
      { question: "", options: ["", ""], correctOption: 0, explanation: "" },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuizQuestions(quizQuestions.filter((_, i) => i !== index));
  };

  const getHeaderIcon = () => {
    switch (lessonForm.type) {
      case "VIDEO":
        return <Video className="size-5" />;
      case "QUIZ":
        return <FileQuestion className="size-5" />;
      case "WRITING":
        return <FilePenLine className="size-5" />;
      case "VOCABULARY":
        return <BookOpen className="size-5" />;
      default:
        return <FileText className="size-5" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <div className="flex items-center gap-3 pr-8">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              {getHeaderIcon()}
            </div>
            <div>
              <DialogTitle className="text-left">
                {isEditing ? "Chỉnh sửa bài học" : "Tạo bài học mới"}
              </DialogTitle>
              <DialogDescription className="text-left">
                {isEditing
                  ? "Cập nhật nội dung bài học hiện có."
                  : moduleTitle
                  ? `Tạo bài học mới trong "${moduleTitle}"`
                  : "Tạo bài học mới — nội dung sẽ ở trạng thái bản nháp."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 px-4 pb-2">
          {/* Basic Info */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Thông tin cơ bản
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Tên bài học *
              </label>
              <Input
                placeholder="VD: Bài 1 — Giới thiệu ngữ pháp"
                value={lessonForm.title}
                onChange={(e) =>
                  setLessonForm({ ...lessonForm, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">
                Loại nội dung
              </label>
              <select
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                value={lessonForm.type}
                onChange={(e) =>
                  setLessonForm({
                    ...lessonForm,
                    type: e.target.value as LessonType,
                  })
                }
                disabled={isEditing}
              >
                <option value="TEXT">📄 Text lesson</option>
                <option value="VIDEO">🎬 Video lesson</option>
                <option value="QUIZ">❓ Quiz</option>
                <option value="WRITING">✍️ Writing</option>
                <option value="VOCABULARY">📚 Vocabulary</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">
              Mô tả ngắn
            </label>
            <Textarea
              placeholder="Mô tả ngắn gọn nội dung bài học..."
              value={lessonForm.description}
              className="resize-none"
              onChange={(e) =>
                setLessonForm({ ...lessonForm, description: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {isEditing && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">
                  Trạng thái
                </label>
                <select
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                  value={lessonForm.status}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      status: e.target.value as StatusValue,
                    })
                  }
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="PAUSED">Paused</option>
                </select>
              </div>
            )}
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="size-4 rounded border-slate-300 text-indigo-600"
                  checked={lessonForm.isRequired}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, isRequired: e.target.checked })
                  }
                />
                <span className="text-sm font-medium text-slate-700">
                  Bắt buộc hoàn thành
                </span>
              </label>
            </div>
          </div>
        </div>

          {/* Text Content */}
          {lessonForm.type === "TEXT" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <FileText className="size-4" />
                </div>
                <p className="text-sm font-semibold text-slate-900">Nội dung Text</p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">
                    Tiêu đề bài text
                  </label>
                  <Input
                    placeholder="VD: Grammar Focus — Câu điều kiện loại 1"
                    value={textContent.title}
                    onChange={(e) =>
                      setTextContent({ ...textContent, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">
                    Nội dung bài học
                  </label>
                  <Textarea
                    placeholder="Nhập nội dung bài học tại đây..."
                    className="min-h-44 font-mono text-sm"
                    value={textContent.content}
                    onChange={(e) =>
                      setTextContent({ ...textContent, content: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">
                      Từ khóa
                    </label>
                    <Input
                      placeholder="VD: conditionals, if, when"
                      value={textContent.keywords}
                      onChange={(e) =>
                        setTextContent({ ...textContent, keywords: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">
                      Mục tiêu bài học
                    </label>
                    <Input
                      placeholder="VD: Hiểu cấu trúc câu điều kiện"
                      value={textContent.learningObjectives}
                      onChange={(e) =>
                        setTextContent({
                          ...textContent,
                          learningObjectives: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Video Content - Using VideoLessonEditor */}
          {lessonForm.type === "VIDEO" && (
            <VideoLessonEditor
              content={videoContent}
              onContentChange={setVideoContent}
            />
          )}

          {/* Writing Content - Using WritingLessonEditor */}
          {lessonForm.type === "WRITING" && (
            <WritingLessonEditor
              content={writingContent}
              onContentChange={setWritingContent}
              aiPrompts={aiPrompts}
            />
          )}

          {/* Vocabulary Content - Using VocabularyLessonEditor */}
          {lessonForm.type === "VOCABULARY" && (
            <VocabularyLessonEditor
              lessonId={initialData?.lessonForm && 'id' in initialData.lessonForm ? (initialData.lessonForm as { id?: string }).id : undefined}
              initialVocabulary={[]}
            />
          )}

          {/* Quiz Content */}
          {lessonForm.type === "QUIZ" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                  <FileQuestion className="size-4" />
                </div>
                <p className="text-sm font-semibold text-slate-900">Câu hỏi Quiz</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">
                    Tên quiz
                  </label>
                  <Input
                    placeholder="VD: Kiểm tra từ vựng bài 1"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">
                    Tỉ lệ đạt (%)
                  </label>
                  <Input
                    type="number"
                    placeholder="70"
                    value={quizPassingPercentage}
                    onChange={(e) => setQuizPassingPercentage(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                {quizQuestions.map((question, questionIndex) => (
                  <div
                    key={questionIndex}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800">
                        Câu {questionIndex + 1}
                      </p>
                      {quizQuestions.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 px-2"
                          onClick={() => removeQuestion(questionIndex)}
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
                        onChange={(e) =>
                          updateQuestion(questionIndex, "question", e.target.value)
                        }
                      />
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${questionIndex}`}
                              checked={question.correctOption === optionIndex}
                              onChange={() =>
                                updateQuestion(
                                  questionIndex,
                                  "correctOption",
                                  optionIndex
                                )
                              }
                              className="size-4"
                            />
                            <Input
                              placeholder={`Đáp án ${optionIndex + 1}`}
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...question.options];
                                newOptions[optionIndex] = e.target.value;
                                updateQuestion(
                                  questionIndex,
                                  "options",
                                  newOptions
                                );
                              }}
                              className="flex-1"
                            />
                            {question.options.length > 2 && (
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() =>
                                  removeOption(questionIndex, optionIndex)
                                }
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
                        onClick={() => addOption(questionIndex)}
                        className="w-full"
                      >
                        + Thêm đáp án
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Giải thích đáp án đúng..."
                      value={question.explanation}
                      onChange={(e) =>
                        updateQuestion(questionIndex, "explanation", e.target.value)
                      }
                      className="min-h-16 text-sm"
                    />
                  </div>
                ))}
                <Button variant="outline" onClick={addQuestion} className="w-full">
                  + Thêm câu hỏi
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-4 pb-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !lessonForm.title.trim()}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {submitting
              ? "Đang lưu..."
              : isEditing
              ? "Cập nhật"
              : "Tạo bài học"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Lesson Card with Drag Handle for Reordering
export function DraggableLessonCard({
  lesson,
  index,
  isDragging,
  dragHandleProps,
  onEdit,
  onDelete,
}: {
  lesson: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    isRequired: boolean;
    video?: unknown;
    quiz?: unknown;
    write?: unknown;
  };
  index: number;
  isDragging: boolean;
  dragHandleProps: Record<string, unknown>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const getLessonType = () => {
    if (lesson.video) return "VIDEO";
    if (lesson.quiz) return "QUIZ";
    if (lesson.write) return "WRITING";
    if ((lesson as Record<string, unknown>).vocabulary) return "VOCABULARY";
    return "TEXT";
  };

  const type = getLessonType();

  const typeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    TEXT: {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
          <path d="M10 9H8" />
        </svg>
      ),
      color: "bg-blue-100 text-blue-700",
      label: "Text",
    },
    VIDEO: {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      ),
      color: "bg-purple-100 text-purple-700",
      label: "Video",
    },
    QUIZ: {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      ),
      color: "bg-amber-100 text-amber-700",
      label: "Quiz",
    },
    WRITING: {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      ),
      color: "bg-emerald-100 text-emerald-700",
      label: "Writing",
    },
    VOCABULARY: {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
      color: "bg-teal-100 text-teal-700",
      label: "Vocabulary",
    },
  };

  const config = typeConfig[type];

  return (
    <div
      className={`group relative flex flex-col gap-2 rounded-xl border bg-white p-4 transition-all ${
        isDragging
          ? "border-indigo-300 shadow-lg ring-2 ring-indigo-200"
          : "border-slate-200 hover:border-indigo-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <GripVertical className="size-4" />
          </div>
          <span className="text-xs font-mono text-slate-400">{index + 1}</span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}>
            {config.icon}
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onEdit}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="size-3.5"
            >
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-red-500 hover:text-red-600"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <div>
        <h5 className="font-medium text-slate-900 line-clamp-2">{lesson.title}</h5>
        {lesson.description && (
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
            {lesson.description}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`text-xs px-2 py-0.5 rounded-full border ${
            lesson.status === "PUBLISHED"
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : "bg-slate-50 text-slate-500 border-slate-200"
          }`}
        >
          {lesson.status === "PUBLISHED" ? "Published" : "Draft"}
        </span>
        {lesson.isRequired && (
          <span className="text-xs px-2 py-0.5 rounded-full border text-orange-600 border-orange-200 bg-orange-50">
            Bắt buộc
          </span>
        )}
      </div>
    </div>
  );
}
