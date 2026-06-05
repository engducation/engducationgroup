"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpenText,
  BookText,
  FilePenLine,
  FileQuestion,
  FileText,
  Layers3,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import { adminApi } from "@/features/admin/api/admin-api";
import { useAdminCourseContentWorkspace } from "@/features/admin/hooks/use-admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

type WorkspaceCourse = Awaited<ReturnType<typeof adminApi.getCourseContentWorkspace>> & {
  title?: string;
  status?: StatusValue;
  modules?: WorkspaceModule[];
};
type WorkspaceModule = {
  id: string;
  title: string;
  description?: string | null;
  status: StatusValue;
  orderIndex: number;
  lessons?: WorkspaceLesson[];
  vocabularies?: WorkspaceVocabulary[];
};
type WorkspaceLesson = {
  id: string;
  moduleId: string;
  title: string;
  description?: string | null;
  status: StatusValue;
  orderIndex: number;
  isRequired: boolean;
  hasVocabulary?: boolean;
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
      options: string;
      correctOption: number;
      explanation: string;
    }>;
  } | null;
};
type WorkspaceVocabulary = {
  id: string;
  word: string;
  meaning: string;
  partOfSpeech: string;
  phonetic?: string | null;
  example?: string | null;
  notes?: string | null;
  orderIndex: number;
  status: StatusValue;
};
type StatusValue = "DRAFT" | "PUBLISHED" | "PAUSED";

type LessonType = "TEXT" | "VIDEO" | "QUIZ" | "WRITING";

const STATUS_OPTIONS: { value: StatusValue; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "PAUSED", label: "Paused" },
];

const EMPTY_LESSON_FORM = {
  title: "",
  description: "",
  type: "TEXT" as LessonType,
  status: "DRAFT" as StatusValue,
  orderIndex: "",
  isRequired: true,
};

const EMPTY_TEXT_CONTENT = {
  title: "",
  content: "",
  keywords: "",
  learningObjectives: "",
};

const EMPTY_VIDEO_CONTENT = {
  title: "",
  description: "",
  cloudinaryPublicId: "",
  cloudinaryUrl: "",
  durationSeconds: "",
  resourceNotes: "",
};

const EMPTY_WRITING_CONTENT = {
  title: "",
  prompt: "",
  gradingCriteria: "",
  wordCountGuidance: "",
  aiPromptId: "",
  maxAiRevisions: "5",
  dueDate: "",
  submissionMode: "OPEN" as "OPEN" | "CLOSED",
};

const EMPTY_VOCABULARY_FORM = {
  word: "",
  meaning: "",
  partOfSpeech: "noun",
  phonetic: "",
  example: "",
  notes: "",
  orderIndex: "",
  status: "DRAFT" as StatusValue,
};

function parseNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function normalizeLessonType(lesson: WorkspaceLesson): LessonType {
  if (lesson.video) return "VIDEO";
  if (lesson.quiz) return "QUIZ";
  if (lesson.write) return "WRITING";
  return "TEXT";
}

function getLessonBadges(lesson: WorkspaceLesson) {
  return [
    lesson.read ? { key: "read", label: "Text", icon: FileText } : null,
    lesson.video ? { key: "video", label: "Video", icon: Video } : null,
    lesson.quiz
      ? {
          key: "quiz",
          label: `Quiz (${lesson.quiz.questions?.length ?? 0})`,
          icon: FileQuestion,
        }
      : null,
    lesson.write ? { key: "write", label: "Writing", icon: FilePenLine } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; icon: typeof FileText }>;
}

export default function AdminCourseContentWorkspaceClient({
  courseId,
}: {
  courseId: string;
}) {
  const { data, isLoading, error, refetch } = useAdminCourseContentWorkspace(courseId);
  const course = data as WorkspaceCourse | null;
  const modules = useMemo(() => course?.modules ?? [], [course]);

  const [openModuleDialog, setOpenModuleDialog] = useState(false);
  const [openLessonDialogForModule, setOpenLessonDialogForModule] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<WorkspaceLesson | null>(null);
  const [editingVocabulary, setEditingVocabulary] = useState<{ moduleId: string; item: WorkspaceVocabulary | null } | null>(null);

  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [moduleStatus, setModuleStatus] = useState<StatusValue>("DRAFT");
  const [moduleOrderIndex, setModuleOrderIndex] = useState("");

  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON_FORM);
  const [textContent, setTextContent] = useState(EMPTY_TEXT_CONTENT);
  const [videoContent, setVideoContent] = useState(EMPTY_VIDEO_CONTENT);
  const [writingContent, setWritingContent] = useState(EMPTY_WRITING_CONTENT);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizPassingPercentage, setQuizPassingPercentage] = useState("");
  const [quizQuestions, setQuizQuestions] = useState([
    { question: "", options: ["", ""], correctOption: 0, explanation: "" },
  ]);
  const [vocabularyForm, setVocabularyForm] = useState(EMPTY_VOCABULARY_FORM);

  const [submitting, setSubmitting] = useState(false);

  const resetLessonForms = () => {
    setLessonForm(EMPTY_LESSON_FORM);
    setTextContent(EMPTY_TEXT_CONTENT);
    setVideoContent(EMPTY_VIDEO_CONTENT);
    setWritingContent(EMPTY_WRITING_CONTENT);
    setQuizTitle("");
    setQuizPassingPercentage("");
    setQuizQuestions([{ question: "", options: ["", ""], correctOption: 0, explanation: "" }]);
  };

  const openCreateLessonDialog = (moduleId: string) => {
    resetLessonForms();
    setEditingLesson(null);
    setOpenLessonDialogForModule(moduleId);
  };

  const openEditLessonDialog = (lesson: WorkspaceLesson) => {
    const detectedType = normalizeLessonType(lesson);
    setLessonForm({
      title: lesson.title,
      description: lesson.description ?? "",
      type: detectedType,
      status: lesson.status,
      orderIndex: String(lesson.orderIndex ?? ""),
      isRequired: lesson.isRequired,
    });

    setTextContent({
      title: lesson.read?.title ?? lesson.title,
      content: lesson.read?.content ?? "",
      keywords: lesson.read?.keywords ?? "",
      learningObjectives: lesson.read?.learningObjectives ?? "",
    });

    setVideoContent({
      title: lesson.video?.title ?? lesson.title,
      description: lesson.video?.description ?? "",
      cloudinaryPublicId: lesson.video?.cloudinaryPublicId ?? "",
      cloudinaryUrl: lesson.video?.cloudinaryUrl ?? "",
      durationSeconds: lesson.video?.durationSeconds ? String(lesson.video.durationSeconds) : "",
      resourceNotes: "",
    });

    const [writeTitle, ...writePromptLines] = (lesson.write?.prompt ?? "").split("\n\n");
    setWritingContent({
      title: lesson.write?.prompt ? writeTitle : lesson.title,
      prompt: writePromptLines.join("\n\n") || lesson.write?.prompt || "",
      gradingCriteria: lesson.write?.gradingCriteria ?? "",
      wordCountGuidance: lesson.write?.wordCountGuidance
        ? String(lesson.write.wordCountGuidance)
        : "",
      aiPromptId: lesson.write?.aiPromptId ?? "",
      maxAiRevisions: String(lesson.write?.maxAiRevisions ?? 5),
      dueDate: "",
      submissionMode: lesson.write?.gradingCriteria?.includes("Submission mode: CLOSED")
        ? "CLOSED"
        : "OPEN",
    });

    setQuizTitle(lesson.description?.startsWith("Quiz: ") ? lesson.description.replace(/^Quiz:\s*/, "").split("\n")[0] : "");
    setQuizPassingPercentage(
      lesson.description?.includes("Passing:")
        ? lesson.description.split("Passing:")[1]?.replace("%", "").trim() || ""
        : "",
    );
    setQuizQuestions(
      lesson.quiz?.questions?.length
        ? lesson.quiz.questions.map((item: { question: string; options: string; correctOption: number; explanation: string }) => ({
            question: item.question,
            options: JSON.parse(item.options) as string[],
            correctOption: item.correctOption,
            explanation: item.explanation,
          }))
        : [{ question: "", options: ["", ""], correctOption: 0, explanation: "" }],
    );

    setEditingLesson(lesson);
    setOpenLessonDialogForModule(lesson.moduleId);
  };

  const handleCreateModule = async () => {
    if (!moduleTitle.trim()) {
      toast.error("Vui lòng nhập tên chương học");
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.createModule({
        courseId,
        title: moduleTitle,
        description: moduleDescription || undefined,
        status: moduleStatus,
        orderIndex: parseNumber(moduleOrderIndex),
      });
      toast.success("Đã tạo chương học");
      setOpenModuleDialog(false);
      setModuleTitle("");
      setModuleDescription("");
      setModuleStatus("DRAFT");
      setModuleOrderIndex("");
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể tạo chương học");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishCourse = async () => {
    try {
      await adminApi.publishCourse(courseId);
      toast.success("Đã publish toàn bộ khóa học");
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể publish khóa học");
    }
  };

  const handleSaveLesson = async () => {
    if (!openLessonDialogForModule) return;
    if (!lessonForm.title.trim()) {
      toast.error("Vui lòng nhập tên bài học");
      return;
    }

    setSubmitting(true);
    try {
      const lessonPayload = {
        title: lessonForm.title,
        description: lessonForm.description || undefined,
        status: lessonForm.status,
        orderIndex: parseNumber(lessonForm.orderIndex),
        isRequired: lessonForm.isRequired,
        hasRead: lessonForm.type === "TEXT",
        hasVideo: lessonForm.type === "VIDEO",
        hasQuiz: lessonForm.type === "QUIZ",
        hasWrite: lessonForm.type === "WRITING",
      };

    const savedLesson = (editingLesson
      ? await adminApi.updateLesson(editingLesson.id, lessonPayload)
      : await adminApi.createLesson({ moduleId: openLessonDialogForModule, ...lessonPayload })) as {
      id: string;
    };

      const lessonId = savedLesson.id as string;

      if (lessonForm.type === "TEXT") {
        await adminApi.upsertLessonRead(lessonId, {
          title: textContent.title || lessonForm.title,
          content: textContent.content,
          keywords: textContent.keywords || undefined,
          learningObjectives: textContent.learningObjectives || undefined,
        });
      }

      if (lessonForm.type === "VIDEO") {
        await adminApi.upsertLessonVideo(lessonId, {
          title: videoContent.title || lessonForm.title,
          description: videoContent.description || undefined,
          cloudinaryPublicId: videoContent.cloudinaryPublicId,
          cloudinaryUrl: videoContent.cloudinaryUrl,
          durationSeconds: parseNumber(videoContent.durationSeconds),
          resourceNotes: videoContent.resourceNotes || undefined,
        });
      }

      if (lessonForm.type === "WRITING") {
        await adminApi.upsertLessonWrite(lessonId, {
          title: writingContent.title || lessonForm.title,
          prompt: writingContent.prompt,
          gradingCriteria: writingContent.gradingCriteria || undefined,
          wordCountGuidance: parseNumber(writingContent.wordCountGuidance),
          aiPromptId: writingContent.aiPromptId || undefined,
          maxAiRevisions: parseNumber(writingContent.maxAiRevisions),
          dueDate: writingContent.dueDate || undefined,
          submissionMode: writingContent.submissionMode,
        });
      }

      if (lessonForm.type === "QUIZ") {
        await adminApi.upsertLessonQuiz(lessonId, {
          title: quizTitle || lessonForm.title,
          passingPercentage: parseNumber(quizPassingPercentage) ?? null,
          questions: quizQuestions.map((item) => ({
            question: item.question,
            options: item.options,
            correctOption: item.correctOption,
            explanation: item.explanation,
          })),
        });
      }

      toast.success(editingLesson ? "Đã cập nhật bài học" : "Đã tạo bài học");
      setOpenLessonDialogForModule(null);
      setEditingLesson(null);
      resetLessonForms();
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể lưu bài học");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      await adminApi.deleteLesson(lessonId);
      toast.success("Đã xóa bài học");
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể xóa bài học");
    }
  };

  const handleSaveVocabulary = async () => {
    if (!editingVocabulary?.moduleId) return;
    if (!vocabularyForm.word.trim() || !vocabularyForm.meaning.trim()) {
      toast.error("Từ vựng và nghĩa là bắt buộc");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        moduleId: editingVocabulary.moduleId,
        word: vocabularyForm.word,
        meaning: vocabularyForm.meaning,
        partOfSpeech: vocabularyForm.partOfSpeech,
        phonetic: vocabularyForm.phonetic || undefined,
        example: vocabularyForm.example || undefined,
        notes: vocabularyForm.notes || undefined,
        orderIndex: parseNumber(vocabularyForm.orderIndex),
        status: vocabularyForm.status,
      };

      if (editingVocabulary.item) {
        await adminApi.updateModuleVocabulary(editingVocabulary.item.id, payload);
      } else {
        await adminApi.createModuleVocabulary(payload);
      }

      toast.success(editingVocabulary.item ? "Đã cập nhật từ vựng" : "Đã thêm từ vựng");
      setEditingVocabulary(null);
      setVocabularyForm(EMPTY_VOCABULARY_FORM);
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể lưu từ vựng");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVocabulary = async (vocabularyId: string) => {
    try {
      await adminApi.deleteModuleVocabulary(vocabularyId);
      toast.success("Đã xóa từ vựng");
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể xóa từ vựng");
    }
  };

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600"
          >
            <ArrowLeft className="size-4" />
            Quay lại danh sách khóa học
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              {course?.title ?? "Course content workspace"}
            </h1>
            {course?.status ? <Badge variant="outline">{course.status}</Badge> : null}
          </div>
          <p className="text-sm text-slate-600">
            Quản trị nội dung theo từng chương: text, video, quiz, writing và vocabulary.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={openModuleDialog} onOpenChange={setOpenModuleDialog}>
            <DialogTrigger
              render={
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus data-icon="inline-start" />
                  Thêm chương học
                </Button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo chương học</DialogTitle>
                <DialogDescription>
                  Chương học có thể tạo ở draft/published/paused và sắp xếp thứ tự ngay từ đầu.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 px-4 pb-2">
                <div className="grid gap-2">
                  <Label>Tên chương học</Label>
                  <Input value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Mô tả</Label>
                  <Textarea value={moduleDescription} onChange={(e) => setModuleDescription(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <label className="grid gap-2">
                      <span className="text-sm font-medium text-slate-900">Trạng thái</span>
                      <select
                        className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                        value={moduleStatus}
                        onChange={(e) => setModuleStatus(e.target.value as StatusValue)}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  <div className="grid gap-2">
                    <Label>Thứ tự</Label>
                    <Input
                      type="number"
                      value={moduleOrderIndex}
                      onChange={(e) => setModuleOrderIndex(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenModuleDialog(false)} disabled={submitting}>
                  Hủy
                </Button>
                <Button onClick={handleCreateModule} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus data-icon="inline-start" />
                  {submitting ? "Đang tạo..." : "Tạo chương học"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handlePublishCourse}>
            <Sparkles data-icon="inline-start" />
            Publish toàn khóa
          </Button>
        </div>
      </section>

      {error ? (
        <Card className="border-red-200">
          <CardContent className="p-6 text-sm text-red-600">{error}</CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="border-slate-200">
              <CardContent className="space-y-3 p-6">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <section className="grid gap-4">
          {modules.map((module, moduleIndex) => (
            <Card key={module.id} className="border-slate-200">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>
                        {moduleIndex + 1}. {module.title}
                      </CardTitle>
                      <Badge variant="outline">{module.status}</Badge>
                    </div>
                    <CardDescription>{module.description || "Chưa có mô tả"}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                      {module.lessons?.length ?? 0} lessons
                    </Badge>
                    <Button size="sm" onClick={() => openCreateLessonDialog(module.id)}>
                      <Plus data-icon="inline-start" />
                      Tạo bài học
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingVocabulary({ moduleId: module.id, item: null });
                        setVocabularyForm(EMPTY_VOCABULARY_FORM);
                      }}
                    >
                      <BookOpenText data-icon="inline-start" />
                      Thêm từ vựng
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <BookText className="size-4 text-emerald-600" />
                    Vocabulary theo chương
                  </div>
                  {module.vocabularies?.length ? (
                    <div className="grid gap-2">
                      {module.vocabularies.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                          <div className="space-y-1 text-sm">
                            <p className="font-medium text-slate-900">
                              {item.word} · {item.meaning}
                            </p>
                            <p className="text-slate-500">
                              {item.partOfSpeech}
                              {item.example ? ` · ${item.example}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{item.status}</Badge>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              onClick={() => {
                                setEditingVocabulary({ moduleId: module.id, item });
                                setVocabularyForm({
                                  word: item.word,
                                  meaning: item.meaning,
                                  partOfSpeech: item.partOfSpeech,
                                  phonetic: item.phonetic ?? "",
                                  example: item.example ?? "",
                                  notes: item.notes ?? "",
                                  orderIndex: String(item.orderIndex ?? ""),
                                  status: item.status,
                                });
                              }}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button size="icon-sm" variant="outline" onClick={() => handleDeleteVocabulary(item.id)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Chưa có từ vựng nào trong chương này.</p>
                  )}
                </div>

                <div className="space-y-3">
                  {module.lessons?.length ? (
                    module.lessons.map((lesson, lessonIndex) => {
                      const badges = getLessonBadges(lesson);
                      return (
                        <div key={lesson.id} className="rounded-2xl border border-slate-200 p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-semibold text-slate-950">
                                  {moduleIndex + 1}.{lessonIndex + 1} {lesson.title}
                                </p>
                                <Badge variant="outline">{lesson.status}</Badge>
                                {!lesson.isRequired ? <Badge variant="outline">Optional</Badge> : null}
                              </div>
                              <p className="text-sm text-slate-600">{lesson.description || "Chưa có mô tả"}</p>
                              <div className="flex flex-wrap gap-2">
                                {badges.length ? (
                                  badges.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                      <Badge key={item.key} variant="outline">
                                        <Icon className="mr-1 size-3.5" />
                                        {item.label}
                                      </Badge>
                                    );
                                  })
                                ) : (
                                  <Badge variant="outline">Chưa có content</Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                                <Layers3 className="mr-1 size-3.5" />
                                Thứ tự {lesson.orderIndex}
                              </Badge>
                              <Button size="icon-sm" variant="outline" onClick={() => openEditLessonDialog(lesson)}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button size="icon-sm" variant="outline" onClick={() => handleDeleteLesson(lesson.id)}>
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                      Chưa có bài học trong chương này. Hãy tạo text, video, quiz hoặc writing.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <Dialog open={Boolean(openLessonDialogForModule)} onOpenChange={(open) => !open && setOpenLessonDialogForModule(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingLesson ? "Chỉnh sửa bài học" : "Tạo bài học mới"}</DialogTitle>
            <DialogDescription>
              Tạo trực tiếp nội dung text, video, quiz hoặc writing trong chương học.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 px-4 pb-2">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Tên bài học</Label>
                <Input
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Loại nội dung</Label>
                <select
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                  value={lessonForm.type}
                  onChange={(e) => setLessonForm((prev) => ({ ...prev, type: e.target.value as LessonType }))}
                >
                  <option value="TEXT">Text lesson</option>
                  <option value="VIDEO">Video lesson</option>
                  <option value="QUIZ">Quiz</option>
                  <option value="WRITING">Writing</option>
                </select>
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label>Mô tả ngắn</Label>
                <Textarea
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Trạng thái</Label>
                <select
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                  value={lessonForm.status}
                  onChange={(e) => setLessonForm((prev) => ({ ...prev, status: e.target.value as StatusValue }))}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Thứ tự trong chương</Label>
                <Input
                  type="number"
                  value={lessonForm.orderIndex}
                  onChange={(e) => setLessonForm((prev) => ({ ...prev, orderIndex: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-3 md:col-span-2">
                <input
                  type="checkbox"
                  checked={lessonForm.isRequired}
                  onChange={(e) => setLessonForm((prev) => ({ ...prev, isRequired: e.target.checked }))}
                />
                <span className="text-sm font-medium text-slate-900">Bắt buộc hoàn thành</span>
              </label>
            </div>

            {lessonForm.type === "TEXT" ? (
              <div className="grid gap-4 rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">Nội dung text</p>
                <Input
                  placeholder="Tiêu đề bài text"
                  value={textContent.title}
                  onChange={(e) => setTextContent((prev) => ({ ...prev, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Nội dung text"
                  className="min-h-40"
                  value={textContent.content}
                  onChange={(e) => setTextContent((prev) => ({ ...prev, content: e.target.value }))}
                />
                <Input
                  placeholder="Keywords"
                  value={textContent.keywords}
                  onChange={(e) => setTextContent((prev) => ({ ...prev, keywords: e.target.value }))}
                />
                <Textarea
                  placeholder="Learning objectives"
                  value={textContent.learningObjectives}
                  onChange={(e) =>
                    setTextContent((prev) => ({ ...prev, learningObjectives: e.target.value }))
                  }
                />
              </div>
            ) : null}

            {lessonForm.type === "VIDEO" ? (
              <div className="grid gap-4 rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">Nội dung video</p>
                <Input
                  placeholder="Tiêu đề video"
                  value={videoContent.title}
                  onChange={(e) => setVideoContent((prev) => ({ ...prev, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Mô tả video"
                  value={videoContent.description}
                  onChange={(e) => setVideoContent((prev) => ({ ...prev, description: e.target.value }))}
                />
                <Input
                  placeholder="Cloudinary public id"
                  value={videoContent.cloudinaryPublicId}
                  onChange={(e) =>
                    setVideoContent((prev) => ({ ...prev, cloudinaryPublicId: e.target.value }))
                  }
                />
                <Input
                  placeholder="Cloudinary URL"
                  value={videoContent.cloudinaryUrl}
                  onChange={(e) => setVideoContent((prev) => ({ ...prev, cloudinaryUrl: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Duration (seconds)"
                  value={videoContent.durationSeconds}
                  onChange={(e) =>
                    setVideoContent((prev) => ({ ...prev, durationSeconds: e.target.value }))
                  }
                />
                <Textarea
                  placeholder="Tài nguyên đi kèm / ghi chú"
                  value={videoContent.resourceNotes}
                  onChange={(e) => setVideoContent((prev) => ({ ...prev, resourceNotes: e.target.value }))}
                />
              </div>
            ) : null}

            {lessonForm.type === "WRITING" ? (
              <div className="grid gap-4 rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">Bài tập writing</p>
                <Input
                  placeholder="Tiêu đề bài writing"
                  value={writingContent.title}
                  onChange={(e) => setWritingContent((prev) => ({ ...prev, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Đề bài / prompt"
                  className="min-h-32"
                  value={writingContent.prompt}
                  onChange={(e) => setWritingContent((prev) => ({ ...prev, prompt: e.target.value }))}
                />
                <Textarea
                  placeholder="Tiêu chí chấm / hướng dẫn"
                  value={writingContent.gradingCriteria}
                  onChange={(e) =>
                    setWritingContent((prev) => ({ ...prev, gradingCriteria: e.target.value }))
                  }
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    type="number"
                    placeholder="Word count guidance"
                    value={writingContent.wordCountGuidance}
                    onChange={(e) =>
                      setWritingContent((prev) => ({ ...prev, wordCountGuidance: e.target.value }))
                    }
                  />
                  <Input
                    type="date"
                    value={writingContent.dueDate}
                    onChange={(e) => setWritingContent((prev) => ({ ...prev, dueDate: e.target.value }))}
                  />
                  <Input
                    placeholder="AI prompt id"
                    value={writingContent.aiPromptId}
                    onChange={(e) => setWritingContent((prev) => ({ ...prev, aiPromptId: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Max AI revisions"
                    value={writingContent.maxAiRevisions}
                    onChange={(e) =>
                      setWritingContent((prev) => ({ ...prev, maxAiRevisions: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Trạng thái nhận bài</Label>
                  <select
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                    value={writingContent.submissionMode}
                    onChange={(e) =>
                      setWritingContent((prev) => ({
                        ...prev,
                        submissionMode: e.target.value as "OPEN" | "CLOSED",
                      }))
                    }
                  >
                    <option value="OPEN">Open</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>
            ) : null}

            {lessonForm.type === "QUIZ" ? (
              <div className="grid gap-4 rounded-2xl border border-slate-200 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    placeholder="Tên quiz"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Tỉ lệ đạt (%)"
                    value={quizPassingPercentage}
                    onChange={(e) => setQuizPassingPercentage(e.target.value)}
                  />
                </div>
                <div className="space-y-4">
                  {quizQuestions.map((question, questionIndex) => (
                    <div key={questionIndex} className="rounded-xl border border-slate-200 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900">Câu hỏi {questionIndex + 1}</p>
                        {quizQuestions.length > 1 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setQuizQuestions((prev) => prev.filter((_, index) => index !== questionIndex))
                            }
                          >
                            Xóa câu hỏi
                          </Button>
                        ) : null}
                      </div>
                      <div className="grid gap-3">
                        <Textarea
                          placeholder="Nội dung câu hỏi"
                          value={question.question}
                          onChange={(e) =>
                            setQuizQuestions((prev) =>
                              prev.map((item, index) =>
                                index === questionIndex ? { ...item, question: e.target.value } : item,
                              ),
                            )
                          }
                        />
                        {question.options.map((option, optionIndex) => (
                          <Input
                            key={optionIndex}
                            placeholder={`Đáp án ${optionIndex + 1}`}
                            value={option}
                            onChange={(e) =>
                              setQuizQuestions((prev) =>
                                prev.map((item, index) =>
                                  index === questionIndex
                                    ? {
                                        ...item,
                                        options: item.options.map((opt, idx) =>
                                          idx === optionIndex ? e.target.value : opt,
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                        ))}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setQuizQuestions((prev) =>
                                  prev.map((item, index) =>
                                    index === questionIndex
                                      ? { ...item, options: [...item.options, ""] }
                                      : item,
                                  ),
                                )
                              }
                            >
                              Thêm đáp án
                            </Button>
                            <select
                              className="h-10 w-48 rounded-md border border-slate-200 bg-white px-3 text-sm"
                              value={String(question.correctOption)}
                              onChange={(e) =>
                                setQuizQuestions((prev) =>
                                  prev.map((item, index) =>
                                    index === questionIndex
                                      ? { ...item, correctOption: Number(e.target.value) }
                                      : item,
                                  ),
                                )
                              }
                            >
                              {question.options.map((_, optionIndex) => (
                                <option key={optionIndex} value={String(optionIndex)}>
                                  Đáp án đúng {optionIndex + 1}
                                </option>
                              ))}
                            </select>
                          </div>
                        <Textarea
                          placeholder="Giải thích đáp án"
                          value={question.explanation}
                          onChange={(e) =>
                            setQuizQuestions((prev) =>
                              prev.map((item, index) =>
                                index === questionIndex ? { ...item, explanation: e.target.value } : item,
                              ),
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() =>
                    setQuizQuestions((prev) => [
                      ...prev,
                      { question: "", options: ["", ""], correctOption: 0, explanation: "" },
                    ])
                  }
                >
                  <Plus data-icon="inline-start" />
                  Thêm câu hỏi
                </Button>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenLessonDialogForModule(null)} disabled={submitting}>
              Hủy
            </Button>
            <Button onClick={handleSaveLesson} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700">
              {submitting ? "Đang lưu..." : editingLesson ? "Cập nhật bài học" : "Tạo bài học"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingVocabulary)} onOpenChange={(open) => !open && setEditingVocabulary(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVocabulary?.item ? "Chỉnh sửa từ vựng" : "Thêm từ vựng"}</DialogTitle>
            <DialogDescription>Quản lý từ vựng riêng theo từng chương học.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 px-4 pb-2">
            <Input
              placeholder="Word"
              value={vocabularyForm.word}
              onChange={(e) => setVocabularyForm((prev) => ({ ...prev, word: e.target.value }))}
            />
            <Input
              placeholder="Meaning"
              value={vocabularyForm.meaning}
              onChange={(e) => setVocabularyForm((prev) => ({ ...prev, meaning: e.target.value }))}
            />
            <Input
              placeholder="Part of speech"
              value={vocabularyForm.partOfSpeech}
              onChange={(e) => setVocabularyForm((prev) => ({ ...prev, partOfSpeech: e.target.value }))}
            />
            <Input
              placeholder="Phonetic"
              value={vocabularyForm.phonetic}
              onChange={(e) => setVocabularyForm((prev) => ({ ...prev, phonetic: e.target.value }))}
            />
            <Textarea
              placeholder="Example"
              value={vocabularyForm.example}
              onChange={(e) => setVocabularyForm((prev) => ({ ...prev, example: e.target.value }))}
            />
            <Textarea
              placeholder="Notes"
              value={vocabularyForm.notes}
              onChange={(e) => setVocabularyForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Order index"
                value={vocabularyForm.orderIndex}
                onChange={(e) => setVocabularyForm((prev) => ({ ...prev, orderIndex: e.target.value }))}
              />
              <select
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                value={vocabularyForm.status}
                onChange={(e) => setVocabularyForm((prev) => ({ ...prev, status: e.target.value as StatusValue }))}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingVocabulary(null)} disabled={submitting}>
              Hủy
            </Button>
            <Button onClick={handleSaveVocabulary} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700">
              {submitting ? "Đang lưu..." : editingVocabulary?.item ? "Cập nhật" : "Thêm từ vựng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
