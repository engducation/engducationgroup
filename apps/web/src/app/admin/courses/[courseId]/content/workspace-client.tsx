"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { adminApi } from "@/features/admin/api/admin-api";
import { useAdminCourseContentWorkspace } from "@/features/admin/hooks/use-admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LessonCard,
  VocabularyCard,
  ModuleCard,
  ModuleFormDialog,
  VocabularyFormDialog,
  LessonFormDialog,
} from "./components";

// Shared types
export type StatusValue = "DRAFT" | "PUBLISHED" | "PAUSED";

export type WorkspaceLesson = {
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
      options?: string;
      correctOption?: number;
      explanation?: string;
    }>;
  } | null;
};

export type WorkspaceVocabulary = {
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

export type WorkspaceModule = {
  id: string;
  courseId: string;
  title: string;
  description?: string | null;
  status: StatusValue;
  orderIndex: number;
  lessons?: WorkspaceLesson[];
  vocabularies?: WorkspaceVocabulary[];
};

export type WorkspaceCourse = {
  id: string;
  title?: string;
  status?: StatusValue;
  modules?: WorkspaceModule[];
};

type LessonType = "TEXT" | "VIDEO" | "QUIZ" | "WRITING";

// Form State Constants
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

const EMPTY_VOCABULARY_FORM: {
  word: string;
  meaning: string;
  partOfSpeech: string;
  phonetic: string;
  example: string;
  notes: string;
  orderIndex: string;
  status: StatusValue;
} = {
  word: "",
  meaning: "",
  partOfSpeech: "noun",
  phonetic: "",
  example: "",
  notes: "",
  orderIndex: "",
  status: "DRAFT",
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

export default function AdminCourseContentWorkspaceClient({
  courseId,
}: {
  courseId: string;
}) {
  const { data, isLoading, error, refetch } = useAdminCourseContentWorkspace(courseId);
  const course = data as WorkspaceCourse | null;
  const modules = useMemo(() => course?.modules ?? [], [course]);

  // Module form state
  const [openModuleDialog, setOpenModuleDialog] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [moduleOrderIndex, setModuleOrderIndex] = useState("");

  // Lesson form state
  const [openLessonDialogForModule, setOpenLessonDialogForModule] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<WorkspaceLesson | null>(null);
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON_FORM);
  const [textContent, setTextContent] = useState(EMPTY_TEXT_CONTENT);
  const [videoContent, setVideoContent] = useState(EMPTY_VIDEO_CONTENT);
  const [writingContent, setWritingContent] = useState(EMPTY_WRITING_CONTENT);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizPassingPercentage, setQuizPassingPercentage] = useState("");
  const [quizQuestions, setQuizQuestions] = useState([
    { question: "", options: ["", ""], correctOption: 0, explanation: "" },
  ]);

  // Vocabulary form state
  const [editingVocabulary, setEditingVocabulary] = useState<{ moduleId: string; item: WorkspaceVocabulary | null } | null>(null);
  const [vocabularyForm, setVocabularyForm] = useState(EMPTY_VOCABULARY_FORM);

  // Submitting state
  const [submitting, setSubmitting] = useState(false);

  // Reset lesson forms
  const resetLessonForms = () => {
    setLessonForm(EMPTY_LESSON_FORM);
    setTextContent(EMPTY_TEXT_CONTENT);
    setVideoContent(EMPTY_VIDEO_CONTENT);
    setWritingContent(EMPTY_WRITING_CONTENT);
    setQuizTitle("");
    setQuizPassingPercentage("");
    setQuizQuestions([{ question: "", options: ["", ""], correctOption: 0, explanation: "" }]);
  };

  // Open create lesson dialog
  const openCreateLessonDialog = (moduleId: string) => {
    resetLessonForms();
    setEditingLesson(null);
    setOpenLessonDialogForModule(moduleId);
  };

  // Open edit lesson dialog
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
        ? lesson.quiz.questions.map((item) => ({
            question: item.question ?? "",
            options: item.options ? JSON.parse(item.options) as string[] : ["", ""],
            correctOption: item.correctOption ?? 0,
            explanation: item.explanation ?? "",
          }))
        : [{ question: "", options: ["", ""], correctOption: 0, explanation: "" }],
    );

    setEditingLesson(lesson);
    setOpenLessonDialogForModule(lesson.moduleId);
  };

  // Handlers
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
        status: "DRAFT",
        orderIndex: parseNumber(moduleOrderIndex),
      });
      toast.success("Đã tạo chương học");
      setOpenModuleDialog(false);
      setModuleTitle("");
      setModuleDescription("");
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

  const handleEditVocabulary = (moduleId: string, item: WorkspaceVocabulary | null) => {
    setEditingVocabulary({ moduleId, item });
    if (item) {
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
    } else {
      setVocabularyForm(EMPTY_VOCABULARY_FORM);
    }
  };

  // Render helpers
  const renderLesson = (lesson: WorkspaceLesson, moduleIndex: number, lessonIndex: number) => (
    <LessonCard
      lesson={lesson}
      moduleIndex={moduleIndex}
      lessonIndex={lessonIndex}
      onEdit={openEditLessonDialog}
      onDelete={handleDeleteLesson}
    />
  );

  const renderVocabulary = (item: WorkspaceVocabulary) => (
    <VocabularyCard
      item={item}
      onEdit={(vocab) => handleEditVocabulary(item.id, vocab)}
      onDelete={handleDeleteVocabulary}
    />
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <HeaderSection
        course={course}
        onPublish={handlePublishCourse}
        onOpenModuleDialog={() => setOpenModuleDialog(true)}
      />

      {/* Error State */}
      {error ? (
        <Card className="border-red-200">
          <CardContent className="p-6 text-sm text-red-600">{error}</CardContent>
        </Card>
      ) : null}

      {/* Loading State */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        /* Modules List */
        <div className="grid gap-4">
          {modules.map((moduleItem, moduleIndex) => (
            <ModuleCard
              key={moduleItem.id}
              module={moduleItem as WorkspaceModule}
              moduleIndex={moduleIndex}
              onCreateLesson={openCreateLessonDialog}
              onAddVocabulary={(moduleId) => handleEditVocabulary(moduleId, null)}
              onEditVocabulary={handleEditVocabulary}
              onDeleteVocabulary={handleDeleteVocabulary}
              onEditLesson={openEditLessonDialog}
              onDeleteLesson={handleDeleteLesson}
              renderLesson={renderLesson}
              renderVocabulary={renderVocabulary}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <ModuleFormDialog
        open={openModuleDialog}
        onOpenChange={setOpenModuleDialog}
        onSubmit={handleCreateModule}
        title={moduleTitle}
        onTitleChange={setModuleTitle}
        description={moduleDescription}
        onDescriptionChange={setModuleDescription}
        orderIndex={moduleOrderIndex}
        onOrderIndexChange={setModuleOrderIndex}
        submitting={submitting}
      />

      <LessonFormDialog
        open={Boolean(openLessonDialogForModule)}
        onOpenChange={(open) => !open && setOpenLessonDialogForModule(null)}
        onSubmit={handleSaveLesson}
        lessonForm={lessonForm}
        onLessonFormChange={setLessonForm}
        textContent={textContent}
        onTextContentChange={setTextContent}
        videoContent={videoContent}
        onVideoContentChange={setVideoContent}
        writingContent={writingContent}
        onWritingContentChange={setWritingContent}
        quizTitle={quizTitle}
        onQuizTitleChange={setQuizTitle}
        quizPassingPercentage={quizPassingPercentage}
        onQuizPassingPercentageChange={setQuizPassingPercentage}
        quizQuestions={quizQuestions}
        onQuizQuestionsChange={setQuizQuestions}
        submitting={submitting}
        isEditing={Boolean(editingLesson)}
      />

      <VocabularyFormDialog
        open={Boolean(editingVocabulary)}
        onOpenChange={(open) => !open && setEditingVocabulary(null)}
        onSubmit={handleSaveVocabulary}
        form={vocabularyForm}
        onFormChange={setVocabularyForm}
        submitting={submitting}
        isEditing={Boolean(editingVocabulary?.item)}
      />
    </div>
  );
}

// Sub-components

function HeaderSection({
  course,
  onPublish,
  onOpenModuleDialog,
}: {
  course: WorkspaceCourse | null;
  onPublish: () => void;
  onOpenModuleDialog: () => void;
}) {
  return (
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
        <Button onClick={onOpenModuleDialog} className="bg-indigo-600 hover:bg-indigo-700">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4 mr-1">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Thêm chương học
        </Button>
        <Button variant="outline" onClick={onPublish}>
          <Sparkles data-icon="inline-start" />
          Publish toàn khóa
        </Button>
      </div>
    </section>
  );
}

function LoadingSkeleton() {
  return (
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
  );
}
