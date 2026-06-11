"use client";

import { useMemo, useState, useCallback } from "react";
import { toast } from "sonner";

import { adminApi } from "@/features/admin/api/admin-api";
import { useAdminCourseContentWorkspace } from "@/features/admin/hooks/use-admin-api";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  CourseHeaderBanner,
  ModuleAccordion,
  VocabularyFormDialog,
  ModuleFormDialog,
  DeleteConfirmDialog,
  CourseEditDialog,
} from "./components";
import { LessonFormDialog } from "./components/lesson-form-dialog";

import type {
  StatusValue,
  WorkspaceLesson,
  WorkspaceVocabulary,
  WorkspaceModule,
  WorkspaceCourse,
  LessonType,
} from "./components";

interface AiPromptOption {
  id: string;
  name: string;
  description?: string | null;
  systemPrompt: string;
  userPromptTemplate: string;
  temperature: number;
  maxTokens: number;
}

// Re-export LessonType for backward compatibility
export type { LessonType } from "./components";

// Type aliases for internal use
type FormLessonType = "TEXT" | "VIDEO" | "QUIZ" | "WRITING" | "VOCABULARY";

// Form State Constants
const EMPTY_LESSON_FORM = {
  title: "",
  description: "",
  type: "TEXT" as FormLessonType,
  status: "DRAFT" as StatusValue,
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

function normalizeLessonType(lesson: WorkspaceLesson): FormLessonType {
  if (lesson.video) return "VIDEO";
  if (lesson.quiz) return "QUIZ";
  if (lesson.write) return "WRITING";
  if ((lesson as Record<string, unknown>).vocabulary) return "VOCABULARY";
  return "TEXT";
}

export default function AdminCourseContentWorkspaceClient({
  courseId,
  aiPrompts = [],
}: {
  courseId: string;
  aiPrompts?: AiPromptOption[];
}) {
  const { data, isLoading, error, refetch } = useAdminCourseContentWorkspace(courseId);
  const course = data as WorkspaceCourse | null;
  const modules = useMemo((): WorkspaceModule[] => course?.modules ?? [], [course]);

  // Lesson dialog state
  const [editingLesson, setEditingLesson] = useState<WorkspaceLesson | null>(null);
  const [creatingLessonForModuleId, setCreatingLessonForModuleId] = useState<string | null>(null);
  const [openLessonDialog, setOpenLessonDialog] = useState(false);
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON_FORM);
  const [textContent, setTextContent] = useState(EMPTY_TEXT_CONTENT);
  const [videoContent, setVideoContent] = useState(EMPTY_VIDEO_CONTENT);
  const [writingContent, setWritingContent] = useState(EMPTY_WRITING_CONTENT);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizPassingPercentage, setQuizPassingPercentage] = useState("");
  const [quizQuestions, setQuizQuestions] = useState([
    { question: "", options: ["", ""], correctOption: 0, explanation: "" },
  ]);

  // Module form state
  const [openModuleDialog, setOpenModuleDialog] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");

  // Vocabulary form state
  const [editingVocabulary, setEditingVocabulary] = useState<{
    moduleId: string;
    item: WorkspaceVocabulary | null;
  } | null>(null);
  const [vocabularyForm, setVocabularyForm] = useState(EMPTY_VOCABULARY_FORM);

  // Module editing state
  const [editingModule, setEditingModule] = useState<WorkspaceModule | null>(null);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "lesson" | "module" | "vocabulary";
    id: string;
    name: string;
  } | null>(null);

  // Course editing state
  const [openCourseEditDialog, setOpenCourseEditDialog] = useState(false);
  const [courseEditForm, setCourseEditForm] = useState({
    title: "",
    description: "",
    shortDescription: "",
    thumbnail: "",
    level: "BEGINNER",
    language: "English",
  });

  // Submitting state
  const [submitting, setSubmitting] = useState(false);

  // Reset lesson forms
  const resetLessonForms = useCallback(() => {
    setLessonForm(EMPTY_LESSON_FORM);
    setTextContent(EMPTY_TEXT_CONTENT);
    setVideoContent(EMPTY_VIDEO_CONTENT);
    setWritingContent(EMPTY_WRITING_CONTENT);
    setQuizTitle("");
    setQuizPassingPercentage("");
    setQuizQuestions([
      { question: "", options: ["", ""], correctOption: 0, explanation: "" },
    ]);
  }, []);

  // Open lesson dialog for creating new lesson
  const openCreateLessonDialog = useCallback((moduleId: string) => {
    setEditingLesson(null);
    setCreatingLessonForModuleId(moduleId);
    resetLessonForms();
    setOpenLessonDialog(true);
  }, [resetLessonForms]);

  // Open lesson dialog for editing existing lesson
  const openEditLessonDialog = useCallback((lesson: WorkspaceLesson) => {
    const detectedType = normalizeLessonType(lesson);
    setLessonForm({
      title: lesson.title,
      description: lesson.description ?? "",
      type: detectedType,
      status: lesson.status,
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
      durationSeconds: lesson.video?.durationSeconds
        ? String(lesson.video.durationSeconds)
        : "",
      resourceNotes: "",
    });

    const [writeTitle, ...writePromptLines] = (lesson.write?.prompt ?? "").split(
      "\n\n"
    );
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
      submissionMode: lesson.write?.gradingCriteria?.includes(
        "Submission mode: CLOSED"
      )
        ? "CLOSED"
        : "OPEN",
    });

    setQuizTitle(
      lesson.description?.startsWith("Quiz: ")
        ? lesson.description.replace(/^Quiz:\s*/, "").split("\n")[0]
        : ""
    );
    setQuizPassingPercentage(
      lesson.description?.includes("Passing:")
        ? lesson.description.split("Passing:")[1]?.replace("%", "").trim() || ""
        : ""
    );
    setQuizQuestions(
      lesson.quiz?.questions?.length
        ? lesson.quiz.questions.map((item: { question: string; options?: string; correctOption?: number; explanation?: string }) => ({
            question: item.question ?? "",
            options: item.options
              ? (JSON.parse(item.options) as string[])
              : ["", ""],
            correctOption: item.correctOption ?? 0,
            explanation: item.explanation ?? "",
          }))
        : [{ question: "", options: ["", ""], correctOption: 0, explanation: "" }]
    );

    setEditingLesson(lesson);
    setCreatingLessonForModuleId(null);
    setOpenLessonDialog(true);
  }, []);

  // Close lesson dialog
  const closeLessonDialog = useCallback(() => {
    setOpenLessonDialog(false);
    setEditingLesson(null);
    setCreatingLessonForModuleId(null);
    resetLessonForms();
  }, [resetLessonForms]);

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
      });
      toast.success("Đã tạo chương học");
      setOpenModuleDialog(false);
      setModuleTitle("");
      setModuleDescription("");
      await refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể tạo chương học"
      );
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
      toast.error(
        err instanceof Error ? err.message : "Không thể publish khóa học"
      );
    }
  };

  const handleUnpublishCourse = async () => {
    try {
      await adminApi.unpublishCourse(courseId);
      toast.success("Đã hủy publish khóa học");
      await refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể hủy publish khóa học"
      );
    }
  };

  // Handle save lesson from dialog
  const handleSaveLessonFromDialog = async (data: {
    lessonForm: typeof EMPTY_LESSON_FORM;
    textContent: typeof EMPTY_TEXT_CONTENT;
    videoContent: typeof EMPTY_VIDEO_CONTENT;
    writingContent: typeof EMPTY_WRITING_CONTENT;
    quizTitle: string;
    quizPassingPercentage: string;
    quizQuestions: Array<{
      question: string;
      options: string[];
      correctOption: number;
      explanation: string;
    }>;
  }) => {
    if (!data.lessonForm.title.trim()) {
      toast.error("Vui lòng nhập tên bài học");
      return;
    }

    setSubmitting(true);
    try {
      const lessonPayload = {
        title: data.lessonForm.title,
        description: data.lessonForm.description || undefined,
        status: data.lessonForm.status,
        isRequired: data.lessonForm.isRequired,
        hasRead: data.lessonForm.type === "TEXT",
        hasVideo: data.lessonForm.type === "VIDEO",
        hasQuiz: data.lessonForm.type === "QUIZ",
        hasWrite: data.lessonForm.type === "WRITING",
        hasVocabulary: data.lessonForm.type === "VOCABULARY",
      };

      let lessonId: string;

      if (editingLesson) {
        const updated = (await adminApi.updateLesson(
          editingLesson.id,
          lessonPayload
        )) as { id: string };
        lessonId = updated.id;
      } else if (creatingLessonForModuleId) {
        const created = (await adminApi.createLesson({
          moduleId: creatingLessonForModuleId,
          ...lessonPayload,
        })) as { id: string };
        lessonId = created.id;
      } else {
        throw new Error("No module specified for new lesson");
      }

      if (data.lessonForm.type === "TEXT") {
        await adminApi.upsertLessonRead(lessonId, {
          title: data.textContent.title || data.lessonForm.title,
          content: data.textContent.content,
          keywords: data.textContent.keywords || undefined,
          learningObjectives: data.textContent.learningObjectives || undefined,
        });
      }

      if (data.lessonForm.type === "VIDEO") {
        await adminApi.upsertLessonVideo(lessonId, {
          title: data.videoContent.title || data.lessonForm.title,
          description: data.videoContent.description || undefined,
          cloudinaryPublicId: data.videoContent.cloudinaryPublicId,
          cloudinaryUrl: data.videoContent.cloudinaryUrl,
          durationSeconds: parseNumber(data.videoContent.durationSeconds),
          resourceNotes: data.videoContent.resourceNotes || undefined,
        });
      }

      if (data.lessonForm.type === "WRITING") {
        await adminApi.upsertLessonWrite(lessonId, {
          title: data.writingContent.title || data.lessonForm.title,
          prompt: data.writingContent.prompt,
          gradingCriteria: data.writingContent.gradingCriteria || undefined,
          wordCountGuidance: parseNumber(data.writingContent.wordCountGuidance),
          aiPromptId: data.writingContent.aiPromptId || undefined,
          maxAiRevisions: parseNumber(data.writingContent.maxAiRevisions),
          dueDate: data.writingContent.dueDate || undefined,
          submissionMode: data.writingContent.submissionMode,
        });
      }

      if (data.lessonForm.type === "QUIZ") {
        await adminApi.upsertLessonQuiz(lessonId, {
          title: data.quizTitle || data.lessonForm.title,
          passingPercentage: parseNumber(data.quizPassingPercentage) ?? null,
          questions: data.quizQuestions.map((item) => ({
            question: item.question,
            options: item.options,
            correctOption: item.correctOption,
            explanation: item.explanation,
          })),
        });
      }

      toast.success(
        editingLesson ? "Đã cập nhật bài học" : "Đã tạo bài học"
      );
      closeLessonDialog();
      await refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể lưu bài học"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle reorder lessons
  const handleReorderLessons = async (moduleId: string, lessons: WorkspaceLesson[]) => {
    try {
      await adminApi.reorderLessons(
        moduleId,
        lessons.map((l, index) => ({ id: l.id, orderIndex: index }))
      );
      toast.success("Đã lưu thứ tự bài học");
      await refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể lưu thứ tự"
      );
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
        await adminApi.updateModuleVocabulary(
          editingVocabulary.item.id,
          payload
        );
      } else {
        await adminApi.createModuleVocabulary(payload);
      }

      toast.success(
        editingVocabulary.item ? "Đã cập nhật từ vựng" : "Đã thêm từ vựng"
      );
      setEditingVocabulary(null);
      setVocabularyForm(EMPTY_VOCABULARY_FORM);
      await refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể lưu từ vựng"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditVocabulary = (
    moduleId: string,
    item: WorkspaceVocabulary | null
  ) => {
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

  const handleEditModule = (module: WorkspaceModule) => {
    setEditingModule(module);
    setModuleTitle(module.title);
    setModuleDescription(module.description ?? "");
  };

  const handleSaveEditModule = async () => {
    if (!editingModule) return;
    if (!moduleTitle.trim()) {
      toast.error("Vui lòng nhập tên chương học");
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.updateModule(editingModule.id, {
        title: moduleTitle,
        description: moduleDescription || undefined,
      });
      toast.success("Đã cập nhật chương học");
      setEditingModule(null);
      setModuleTitle("");
      setModuleDescription("");
      await refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể cập nhật chương học"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveCourseEdit = async () => {
    if (!courseEditForm.title.trim()) {
      toast.error("Vui lòng nhập tên khóa học");
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.updateCourse(courseId, {
        title: courseEditForm.title,
        description: courseEditForm.shortDescription || undefined,
        detailedDescription: courseEditForm.description || undefined,
        thumbnailUrl: courseEditForm.thumbnail || undefined,
        level: courseEditForm.level || "BEGINNER",
        language: courseEditForm.language || undefined,
      });
      toast.success("Đã cập nhật khóa học");
      setOpenCourseEditDialog(false);
      await refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể cập nhật khóa học"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Render helpers
  const renderLesson = (
    lesson: WorkspaceLesson,
    moduleIndex: number,
    lessonIndex: number
  ) => (
    <LessonCardWrapper
      key={lesson.id}
      lesson={lesson}
      lessonIndex={lessonIndex}
      onEdit={openEditLessonDialog}
      onDelete={() => setDeleteConfirm({ type: "lesson", id: lesson.id, name: lesson.title })}
    />
  );

  const renderVocabulary = (item: WorkspaceVocabulary, moduleId: string) => (
    <VocabularyCardWrapper
      key={item.id}
      item={item}
      onEdit={() =>
        handleEditVocabulary(moduleId, item)
      }
      onDelete={() => setDeleteConfirm({ type: "vocabulary", id: item.id, name: item.word })}
    />
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <CourseHeaderBanner
        courseId={courseId}
        courseTitle={course?.title}
        courseStatus={course?.status}
        onEditCourse={() => {
          if (course) {
            setCourseEditForm({
              title: course.title ?? "",
              description: (course as unknown as Record<string, unknown>).description as string ?? "",
              shortDescription: (course as unknown as Record<string, unknown>).shortDescription as string ?? "",
              thumbnail: (course as unknown as Record<string, unknown>).thumbnail as string ?? "",
              level: (course as unknown as Record<string, unknown>).level as string ?? "BEGINNER",
              language: (course as unknown as Record<string, unknown>).language as string ?? "English",
            });
            setOpenCourseEditDialog(true);
          }
        }}
        onPublish={handlePublishCourse}
        onUnpublish={handleUnpublishCourse}
        onAddModule={() => setOpenModuleDialog(true)}
      />

      {/* Error State */}
      {error ? (
        <Card className="border-red-200">
          <CardContent className="p-6 text-sm text-red-600">
            {error}
          </CardContent>
        </Card>
      ) : null}

      {/* Loading State */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="grid gap-4">
          {modules.map((moduleItem, moduleIndex) => (
            <ModuleAccordion
              key={moduleItem.id}
              module={moduleItem as WorkspaceModule}
              moduleIndex={moduleIndex}
              onCreateLesson={openCreateLessonDialog}
              onAddVocabulary={(moduleId) =>
                handleEditVocabulary(moduleId, null)
              }
              onEditVocabulary={handleEditVocabulary}
              onDeleteVocabulary={() => {}}
              onEditModule={handleEditModule}
              onDeleteModule={(moduleId) => {
                const mod = moduleItem;
                setDeleteConfirm({ type: "module", id: moduleId, name: mod.title });
              }}
              onEditLesson={openEditLessonDialog}
              onDeleteLesson={() => {}}
              onReorderLessons={handleReorderLessons}
              renderLesson={renderLesson}
              renderVocabulary={renderVocabulary}
            />
          ))}
        </div>
      )}

      {/* Module Form Dialog */}
      <ModuleFormDialog
        open={openModuleDialog}
        onOpenChange={setOpenModuleDialog}
        onSubmit={handleCreateModule}
        title={moduleTitle}
        onTitleChange={setModuleTitle}
        description={moduleDescription}
        onDescriptionChange={setModuleDescription}
        submitting={submitting}
      />

      {/* Lesson Form Dialog */}
      <LessonFormDialog
        open={openLessonDialog}
        onOpenChange={(open) => {
          if (!open) closeLessonDialog();
        }}
        onSubmit={handleSaveLessonFromDialog}
        submitting={submitting}
        isEditing={Boolean(editingLesson)}
        moduleTitle={modules.find((m) => m.id === creatingLessonForModuleId)?.title}
        aiPrompts={aiPrompts}
      />

      {/* Vocabulary Dialog */}
      <VocabularyFormDialog
        open={Boolean(editingVocabulary)}
        onOpenChange={(open) => !open && setEditingVocabulary(null)}
        onSubmit={handleSaveVocabulary}
        form={vocabularyForm}
        onFormChange={setVocabularyForm}
        submitting={submitting}
        isEditing={Boolean(editingVocabulary?.item)}
      />

      {/* Module Edit Dialog */}
      <ModuleFormDialog
        open={Boolean(editingModule)}
        onOpenChange={(open) => !open && setEditingModule(null)}
        onSubmit={handleSaveEditModule}
        title={moduleTitle}
        onTitleChange={setModuleTitle}
        description={moduleDescription}
        onDescriptionChange={setModuleDescription}
        submitting={submitting}
        isEditing={true}
        moduleId={editingModule?.id}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={Boolean(deleteConfirm)}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        onConfirm={async () => {
          if (!deleteConfirm) return;
          try {
            if (deleteConfirm.type === "lesson") {
              await adminApi.deleteLesson(deleteConfirm.id);
              toast.success("Đã xóa bài học");
            } else if (deleteConfirm.type === "module") {
              await adminApi.deleteModule(deleteConfirm.id);
              toast.success("Đã xóa chương học");
            } else if (deleteConfirm.type === "vocabulary") {
              await adminApi.deleteModuleVocabulary(deleteConfirm.id);
              toast.success("Đã xóa từ vựng");
            }
            setDeleteConfirm(null);
            await refetch();
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Không thể xóa"
            );
          }
        }}
        title="Xác nhận xóa"
        description="Hành động này không thể hoàn tác."
        itemName={deleteConfirm?.name}
      />

      {/* Course Edit Dialog */}
      <CourseEditDialog
        open={openCourseEditDialog}
        onOpenChange={setOpenCourseEditDialog}
        onSubmit={handleSaveCourseEdit}
        form={courseEditForm}
        onFormChange={setCourseEditForm}
        submitting={submitting}
        courseTitle={course?.title}
      />
    </div>
  );
}

// Wrapper Components
function LessonCardWrapper({
  lesson,
  lessonIndex,
  onEdit,
  onDelete,
}: {
  lesson: WorkspaceLesson;
  lessonIndex: number;
  onEdit: (lesson: WorkspaceLesson) => void;
  onDelete: (lessonId: string) => void;
}) {
  const type = lesson.video
    ? "VIDEO"
    : lesson.quiz
    ? "QUIZ"
    : lesson.write
    ? "WRITING"
    : (lesson as Record<string, unknown>).vocabulary
    ? "VOCABULARY"
    : "TEXT";

  const typeConfig: Record<string, { color: string; label: string }> = {
    TEXT: { color: "bg-blue-100 text-blue-700", label: "Text" },
    VIDEO: { color: "bg-purple-100 text-purple-700", label: "Video" },
    QUIZ: { color: "bg-amber-100 text-amber-700", label: "Quiz" },
    WRITING: { color: "bg-emerald-100 text-emerald-700", label: "Writing" },
    VOCABULARY: { color: "bg-teal-100 text-teal-700", label: "Vocabulary" },
  };

  const config = typeConfig[type];

  return (
    <div className="group relative flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-indigo-200 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">
            {lessonIndex + 1}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}
          >
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(lesson)}
            className="inline-flex size-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 opacity-0 group-hover:opacity-100"
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
          </button>
          <button
            onClick={() => onDelete(lesson.id)}
            className="inline-flex size-7 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="size-3.5"
            >
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>

      <div>
        <h5 className="font-medium text-slate-900 line-clamp-2">
          {lesson.title}
        </h5>
        {lesson.description && (
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
            {lesson.description}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge
          variant="outline"
          className={`text-xs ${
            lesson.status === "PUBLISHED"
              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
              : "bg-slate-50 text-slate-500 border-slate-200"
          }`}
        >
          {lesson.status === "PUBLISHED" ? "Published" : "Draft"}
        </Badge>
        {lesson.isRequired && (
          <Badge
            variant="outline"
            className="text-xs text-orange-600 border-orange-200"
          >
            Bắt buộc
          </Badge>
        )}
      </div>
    </div>
  );
}

function VocabularyCardWrapper({
  item,
  onEdit,
  onDelete,
}: {
  item: WorkspaceVocabulary;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3 transition-colors hover:border-slate-300 hover:bg-slate-50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900 truncate">
            {item.word}
          </span>
          <span className="text-xs text-slate-400 italic">{item.partOfSpeech}</span>
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">{item.meaning}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="inline-flex size-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
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
        </button>
        <button
          onClick={onDelete}
          className="inline-flex size-7 items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="size-3.5"
          >
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
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
