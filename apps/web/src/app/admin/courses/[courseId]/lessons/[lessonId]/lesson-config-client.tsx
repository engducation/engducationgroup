"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  FileText,
  Video,
  FileQuestion,
  FilePenLine,
  BookOpen,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";
import { adminApi } from "@/features/admin/api/admin-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  TextLessonConfig,
  VideoLessonConfig,
  QuizLessonConfig,
  WritingLessonConfig,
  VocabularyLessonConfig,
  type VocabularyLessonConfigRef,
} from "./components";

// Types
type StatusValue = "DRAFT" | "PUBLISHED" | "PAUSED";

type LessonType = "TEXT" | "VIDEO" | "QUIZ" | "WRITING" | "VOCABULARY";

interface WorkspaceLesson {
  id: string;
  moduleId: string;
  title: string;
  description?: string | null;
  status: StatusValue;
  orderIndex: number;
  isRequired: boolean;
  // Lesson type flags (determine lesson type - priority order matters)
  hasRead?: boolean;
  hasWrite?: boolean;
  hasQuiz?: boolean;
  hasVideo?: boolean;
  hasVocabulary?: boolean;
  // Content
  read?: {
    title?: string | null;
    content?: string | null;
    keywords?: string | null;
    learningObjectives?: string | null;
  } | null;
  write?: {
    prompt?: string | null;
    gradingCriteria?: string | null;
    wordCountGuidance?: number | null;
    aiPromptId?: string | null;
    maxAiRevisions?: number | null;
  } | null;
  video?: {
    title?: string | null;
    description?: string | null;
    cloudinaryPublicId?: string | null;
    cloudinaryUrl?: string | null;
    durationSeconds?: number | null;
  } | null;
  quiz?: {
    questions?: Array<{
      question: string;
      options?: string;
      correctOption?: number;
      explanation?: string;
    }>;
  } | null;
}

interface AiPromptOption {
  id: string;
  name: string;
  description?: string | null;
  systemPrompt: string;
  userPromptTemplate: string;
  temperature: number;
  maxTokens: number;
}

// Lesson content state types
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

// Empty states
const EMPTY_TEXT: TextContent = {
  title: "",
  content: "",
  keywords: "",
  learningObjectives: "",
};

const EMPTY_VIDEO: VideoContent = {
  title: "",
  description: "",
  cloudinaryPublicId: "",
  cloudinaryUrl: "",
  durationSeconds: "",
  resourceNotes: "",
};

const EMPTY_WRITING: WritingContent = {
  title: "",
  prompt: "",
  gradingCriteria: "",
  wordCountGuidance: "",
  aiPromptId: "",
  maxAiRevisions: "5",
  dueDate: "",
  submissionMode: "OPEN",
};

const EMPTY_QUESTIONS: QuizQuestion[] = [
  { question: "", options: ["", ""], correctOption: 0, explanation: "" },
];

function parseNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export default function LessonConfigClient({
  courseId,
  lessonId,
}: {
  courseId: string;
  lessonId: string;
}) {
  const router = useRouter();
  const [lesson, setLesson] = useState<WorkspaceLesson | null>(null);
  const [aiPrompts, setAiPrompts] = useState<AiPromptOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Content states
  const [textContent, setTextContent] = useState<TextContent>(EMPTY_TEXT);
  const [videoContent, setVideoContent] = useState<VideoContent>(EMPTY_VIDEO);
  const [writingContent, setWritingContent] = useState<WritingContent>(EMPTY_WRITING);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizPassingPercentage, setQuizPassingPercentage] = useState("");
  const [quizQuestions, setQuizQuestions] =
    useState<QuizQuestion[]>(EMPTY_QUESTIONS);

  // Refs for components
  const vocabularyRef = useRef<VocabularyLessonConfigRef>(null);

  // Fetch lesson data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch lesson details - include flags for lesson type determination
        const lessonData = (await adminApi.getLessonById(lessonId)) as {
          id: string;
          moduleId: string;
          title: string;
          description?: string | null;
          status: StatusValue;
          orderIndex: number;
          isRequired: boolean;
          // Lesson type flags
          hasRead?: boolean;
          hasWrite?: boolean;
          hasQuiz?: boolean;
          hasVideo?: boolean;
          hasVocabulary?: boolean;
          // Content
          read?: Record<string, unknown> | null;
          write?: Record<string, unknown> | null;
          video?: Record<string, unknown> | null;
          quiz?: Record<string, unknown> | null;
        };

        setLesson(lessonData as unknown as WorkspaceLesson);

        // Initialize content from lesson data
        if (lessonData.read) {
          setTextContent({
            title: (lessonData.read.title as string) ?? lessonData.title,
            content: (lessonData.read.content as string) ?? "",
            keywords: (lessonData.read.keywords as string) ?? "",
            learningObjectives:
              (lessonData.read.learningObjectives as string) ?? "",
          });
        } else {
          setTextContent({ ...EMPTY_TEXT, title: lessonData.title });
        }

        if (lessonData.video) {
          setVideoContent({
            title: (lessonData.video.title as string) ?? lessonData.title,
            description: (lessonData.video.description as string) ?? "",
            cloudinaryPublicId:
              (lessonData.video.cloudinaryPublicId as string) ?? "",
            cloudinaryUrl: (lessonData.video.cloudinaryUrl as string) ?? "",
            durationSeconds: lessonData.video.durationSeconds
              ? String(lessonData.video.durationSeconds)
              : "",
            resourceNotes: (lessonData.video.resourceNotes as string) ?? "",
          });
        } else {
          setVideoContent({ ...EMPTY_VIDEO, title: lessonData.title });
        }

        if (lessonData.write) {
          const writeData = lessonData.write as Record<string, unknown>;
          const prompt = (writeData.prompt as string) ?? "";
          const [writeTitle, ...writePromptLines] = prompt.split("\n\n");
          setWritingContent({
            title: prompt ? writeTitle : lessonData.title,
            prompt: writePromptLines.join("\n\n") || prompt,
            gradingCriteria: (writeData.gradingCriteria as string) ?? "",
            wordCountGuidance: writeData.wordCountGuidance
              ? String(writeData.wordCountGuidance)
              : "",
            aiPromptId: (writeData.aiPromptId as string) ?? "",
            maxAiRevisions: String(writeData.maxAiRevisions ?? 5),
            dueDate: "",
            submissionMode:
              (writeData.gradingCriteria as string)?.includes(
                "Submission mode: CLOSED"
              )
                ? "CLOSED"
                : "OPEN",
          });
        } else {
          setWritingContent({ ...EMPTY_WRITING, title: lessonData.title });
        }

        if (lessonData.quiz) {
          const quizData = lessonData.quiz as Record<string, unknown>;
          setQuizTitle(
            lessonData.description?.startsWith("Quiz: ")
              ? (lessonData.description as string)
                  .replace(/^Quiz:\s*/, "")
                  .split("\n")[0]
              : ""
          );
          setQuizPassingPercentage(
            (lessonData.description as string)?.includes("Passing:")
              ? (lessonData.description as string)
                  .split("Passing:")[1]
                  ?.replace("%", "")
                  .trim() || ""
              : ""
          );
          setQuizQuestions(
            Array.isArray(quizData.questions) && quizData.questions.length > 0
              ? (quizData.questions as QuizQuestion[]).map((item) => ({
                  question: item.question ?? "",
                  options: item.options ?? ["", ""],
                  correctOption: item.correctOption ?? 0,
                  explanation: item.explanation ?? "",
                }))
              : EMPTY_QUESTIONS
          );
        }

        // Fetch AI prompts
        try {
          const prompts = (await adminApi.getAiPrompts()) as AiPromptOption[];
          setAiPrompts(prompts);
        } catch {
          // AI prompts are optional
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Không thể tải dữ liệu bài học"
        );
      } finally {
        setIsLoading(false);
      }
    }

    void fetchData();
  }, [lessonId]);

  // Determine lesson type - check flags first (priority order)
  const lessonType = ((): LessonType => {
    if (!lesson) return "TEXT";
    if (lesson.hasVocabulary) return "VOCABULARY";
    if (lesson.hasVideo || lesson.video) return "VIDEO";
    if (lesson.hasQuiz || lesson.quiz) return "QUIZ";
    if (lesson.hasWrite || lesson.write) return "WRITING";
    return "TEXT";
  })();

  // Track changes
  const markChanged = useCallback(() => {
    setHasChanges(true);
  }, []);

  // Save handlers
  const handleSaveText = async () => {
    if (!lesson) return;
    setIsSaving(true);
    try {
      await adminApi.upsertLessonRead(lesson.id, {
        title: textContent.title || lesson.title,
        content: textContent.content,
        keywords: textContent.keywords || undefined,
        learningObjectives: textContent.learningObjectives || undefined,
      });
      toast.success("Đã lưu nội dung text");
      setLastSaved(new Date());
      setHasChanges(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể lưu nội dung"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVideo = async () => {
    if (!lesson) return;
    setIsSaving(true);
    try {
      await adminApi.upsertLessonVideo(lesson.id, {
        title: videoContent.title || lesson.title,
        description: videoContent.description || undefined,
        cloudinaryPublicId: videoContent.cloudinaryPublicId,
        cloudinaryUrl: videoContent.cloudinaryUrl,
        durationSeconds: parseNumber(videoContent.durationSeconds),
      });
      toast.success("Đã lưu nội dung video");
      setLastSaved(new Date());
      setHasChanges(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể lưu nội dung"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWriting = async () => {
    if (!lesson) return;
    setIsSaving(true);
    try {
      await adminApi.upsertLessonWrite(lesson.id, {
        title: writingContent.title || lesson.title,
        prompt: writingContent.prompt,
        gradingCriteria: writingContent.gradingCriteria || undefined,
        wordCountGuidance: parseNumber(writingContent.wordCountGuidance),
        aiPromptId: writingContent.aiPromptId || undefined,
        maxAiRevisions: parseNumber(writingContent.maxAiRevisions),
        dueDate: writingContent.dueDate || undefined,
        submissionMode: writingContent.submissionMode,
      });
      toast.success("Đã lưu nội dung writing");
      setLastSaved(new Date());
      setHasChanges(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể lưu nội dung"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (!lesson) return;
    setIsSaving(true);
    try {
      await adminApi.upsertLessonQuiz(lesson.id, {
        title: quizTitle || lesson.title,
        passingPercentage: parseNumber(quizPassingPercentage) ?? null,
        questions: quizQuestions.map((item) => ({
          question: item.question,
          options: item.options,
          correctOption: item.correctOption,
          explanation: item.explanation,
        })),
      });
      toast.success("Đã lưu câu hỏi quiz");
      setLastSaved(new Date());
      setHasChanges(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể lưu nội dung"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Lesson type config
  const typeConfig: Record<
    LessonType,
    { icon: React.ReactNode; color: string; label: string }
  > = {
    TEXT: {
      icon: <FileText className="size-5" />,
      color: "bg-blue-100 text-blue-600",
      label: "Bài học Text",
    },
    VIDEO: {
      icon: <Video className="size-5" />,
      color: "bg-purple-100 text-purple-600",
      label: "Bài học Video",
    },
    QUIZ: {
      icon: <FileQuestion className="size-5" />,
      color: "bg-amber-100 text-amber-600",
      label: "Bài tập Quiz",
    },
    WRITING: {
      icon: <FilePenLine className="size-5" />,
      color: "bg-emerald-100 text-emerald-600",
      label: "Bài viết Writing",
    },
    VOCABULARY: {
      icon: <BookOpen className="size-5" />,
      color: "bg-teal-100 text-teal-600",
      label: "Bài học Từ vựng",
    },
  };

  const config = typeConfig[lessonType];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="mb-8 flex items-center gap-4">
            <Skeleton className="size-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Không thể tải dữ liệu
          </h2>
          <p className="text-slate-500 mb-4">{error || "Bài học không tồn tại"}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="size-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/admin/courses/${courseId}/content`)}
                className="gap-2"
              >
                <ArrowLeft className="size-4" />
                Quay lại khóa học
              </Button>

              <div className="h-6 w-px bg-slate-200" />

              <div className="flex items-center gap-3">
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${config.color}`}
                >
                  {config.icon}
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-slate-900 line-clamp-1">
                    {lesson.title}
                  </h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      variant="outline"
                      className={
                        lesson.status === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                      }
                    >
                      {lesson.status === "PUBLISHED" ? "Published" : "Draft"}
                    </Badge>
                    {lastSaved && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="size-3" />
                        Đã lưu {lastSaved.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasChanges && (
                <span className="text-sm text-amber-600 flex items-center gap-1">
                  <Circle className="size-2 fill-current" />
                  Chưa lưu
                </span>
              )}
              <Button
                variant="outline"
                onClick={() => router.push(`/admin/courses/${courseId}/content`)}
              >
                Hủy
              </Button>
              <Button
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    switch (lessonType) {
                      case "TEXT":
                        await handleSaveText();
                        break;
                      case "VIDEO":
                        await handleSaveVideo();
                        break;
                      case "WRITING":
                        await handleSaveWriting();
                        break;
                      case "QUIZ":
                        await handleSaveQuiz();
                        break;
                      case "VOCABULARY":
                        if (vocabularyRef.current) {
                          await vocabularyRef.current.save();
                          setLastSaved(new Date());
                          setHasChanges(false);
                        }
                        break;
                    }
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving || !hasChanges}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        {lessonType === "TEXT" && (
          <TextLessonConfig
            content={textContent}
            onContentChange={(newContent: TextContent) => {
              setTextContent(newContent);
              markChanged();
            }}
          />
        )}

        {lessonType === "VIDEO" && (
          <VideoLessonConfig
            content={videoContent}
            onContentChange={(newContent: VideoContent) => {
              setVideoContent(newContent);
              markChanged();
            }}
          />
        )}

        {lessonType === "WRITING" && (
          <WritingLessonConfig
            content={writingContent}
            onContentChange={(newContent: WritingContent) => {
              setWritingContent(newContent);
              markChanged();
            }}
            aiPrompts={aiPrompts}
          />
        )}

        {lessonType === "QUIZ" && (
          <QuizLessonConfig
            title={quizTitle}
            passingPercentage={quizPassingPercentage}
            questions={quizQuestions}
            onTitleChange={(title: string) => {
              setQuizTitle(title);
              markChanged();
            }}
            onPassingPercentageChange={(percentage: string) => {
              setQuizPassingPercentage(percentage);
              markChanged();
            }}
            onQuestionsChange={(questions: QuizQuestion[]) => {
              setQuizQuestions(questions);
              markChanged();
            }}
          />
        )}

        {lessonType === "VOCABULARY" && (
          <VocabularyLessonConfig ref={vocabularyRef} lessonId={lessonId} />
        )}
      </main>
    </div>
  );
}
