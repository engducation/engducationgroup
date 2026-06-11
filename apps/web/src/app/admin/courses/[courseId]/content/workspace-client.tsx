"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Pencil,
  Trash2,
  FileText,
  Video,
  FileQuestion,
  FilePenLine,
  BookOpen,
} from "lucide-react";

import { adminApi } from "@/features/admin/api/admin-api";
import { useAdminCourseContentWorkspace } from "@/features/admin/hooks/use-admin-api";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  CourseHeaderBanner,
  ModuleAccordion,
  ModuleSheet,
  DeleteConfirmDialog,
  LessonCreateSheet,
} from "./components";

import type { WorkspaceLesson, WorkspaceModule, WorkspaceCourse } from "./components";

type LessonType = "TEXT" | "VIDEO" | "QUIZ" | "WRITING" | "VOCABULARY";

interface AiPromptOption {
  id: string;
  name: string;
  description?: string | null;
  systemPrompt: string;
  userPromptTemplate: string;
  temperature: number;
  maxTokens: number;
}

export default function AdminCourseContentWorkspaceClient({
  courseId,
  aiPrompts = [],
}: {
  courseId: string;
  aiPrompts?: AiPromptOption[];
}) {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useAdminCourseContentWorkspace(courseId);
  const course = data as WorkspaceCourse | null;
  const modules = useMemo((): WorkspaceModule[] => {
    return course?.modules ?? [];
  }, [course]);

  // Module sheet state
  const [openModuleSheet, setOpenModuleSheet] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [editingModule, setEditingModule] = useState<WorkspaceModule | null>(null);

  // Lesson create sheet state
  const [openLessonCreateSheet, setOpenLessonCreateSheet] = useState(false);
  const [creatingLessonForModuleId, setCreatingLessonForModuleId] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "lesson" | "module";
    id: string;
    name: string;
  } | null>(null);

  // Submitting state
  const [submitting, setSubmitting] = useState(false);

  // Publishing/Unpublishing state
  const [isPublishing, setIsPublishing] = useState(false);

  // Reordering state (per module)
  const [reorderingModules, setReorderingModules] = useState<Record<string, boolean>>({});

  // Navigation to lesson config page
  const navigateToLesson = useCallback(
    (lesson: WorkspaceLesson) => {
      router.push(`/admin/courses/${courseId}/lessons/${lesson.id}` as `string` as Parameters<typeof router.push>[0]);
    },
    [courseId, router]
  );

  // Open lesson create sheet
  const openCreateLessonDialog = useCallback((moduleId: string) => {
    setCreatingLessonForModuleId(moduleId);
    setOpenLessonCreateSheet(true);
  }, []);

  // Create lesson handler
  const handleCreateLesson = async (title: string, type: LessonType) => {
    if (!creatingLessonForModuleId) return;

    setSubmitting(true);
    try {
      const result = await adminApi.createLesson({
        moduleId: creatingLessonForModuleId,
        title,
        status: "DRAFT",
        isRequired: false,
        hasRead: type === "TEXT",
        hasVideo: type === "VIDEO",
        hasQuiz: type === "QUIZ",
        hasWrite: type === "WRITING",
        hasVocabulary: type === "VOCABULARY",
      }) as { id: string };

      toast.success("Đã tạo bài học");
      setOpenLessonCreateSheet(false);
      setCreatingLessonForModuleId(null);
      await refetch();

      // Navigate to lesson config page
      router.push(`/admin/courses/${courseId}/lessons/${result.id}` as `string` as Parameters<typeof router.push>[0]);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể tạo bài học"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Module handlers
  const handleOpenAddModule = () => {
    setEditingModule(null);
    setModuleTitle("");
    setModuleDescription("");
    setOpenModuleSheet(true);
  };

  const handleEditModule = (module: WorkspaceModule) => {
    setEditingModule(module);
    setModuleTitle(module.title);
    setModuleDescription(module.description ?? "");
    setOpenModuleSheet(true);
  };

  const handleSubmitModule = async () => {
    if (!moduleTitle.trim()) {
      toast.error("Vui lòng nhập tên chương học");
      return;
    }

    setSubmitting(true);
    try {
      if (editingModule) {
        await adminApi.updateModule(editingModule.id, {
          title: moduleTitle,
          description: moduleDescription || undefined,
        });
        toast.success("Đã cập nhật chương học");
      } else {
        await adminApi.createModule({
          courseId,
          title: moduleTitle,
          description: moduleDescription || undefined,
          status: "DRAFT",
        });
        toast.success("Đã tạo chương học");
      }
      setOpenModuleSheet(false);
      setEditingModule(null);
      setModuleTitle("");
      setModuleDescription("");
      await refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể lưu chương học"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Course handlers
  const handlePublishCourse = async () => {
    setIsPublishing(true);
    try {
      await adminApi.publishCourse(courseId);
      toast.success("Đang xuất bản khóa học...");
      await refetch();
      toast.success("Đã xuất bản toàn bộ khóa học");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể xuất bản khóa học"
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublishCourse = async () => {
    setIsPublishing(true);
    try {
      await adminApi.unpublishCourse(courseId);
      toast.success("Đang hủy xuất bản khóa học...");
      await refetch();
      toast.success("Đã hủy xuất bản khóa học");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể hủy xuất bản khóa học"
      );
    } finally {
      setIsPublishing(false);
    }
  };

  // Reorder lessons
  const handleReorderLessons = async (
    moduleId: string,
    lessons: WorkspaceLesson[]
  ) => {
    setReorderingModules((prev) => ({ ...prev, [moduleId]: true }));
    try {
      await adminApi.reorderLessons(
        moduleId,
        lessons.map((l, index) => ({ id: l.id, orderIndex: index }))
      );
      toast.success("Đang lưu thứ tự bài học...");
      await refetch();
      toast.success("Đã lưu thứ tự bài học");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Không thể lưu thứ tự"
      );
    } finally {
      setReorderingModules((prev) => ({ ...prev, [moduleId]: false }));
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === "lesson") {
        await adminApi.deleteLesson(deleteConfirm.id);
        toast.success("Đã xóa bài học");
      } else if (deleteConfirm.type === "module") {
        await adminApi.deleteModule(deleteConfirm.id);
        toast.success("Đã xóa chương học");
      }
      setDeleteConfirm(null);
      await refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể xóa");
    }
  };

  // Render lesson as card
  const renderLesson = (
    lesson: WorkspaceLesson,
    _moduleIndex: number,
    lessonIndex: number
  ) => (
    <LessonCard
      key={lesson.id}
      lesson={lesson}
      lessonIndex={lessonIndex}
      onClick={() => navigateToLesson(lesson)}
      onDelete={() =>
        setDeleteConfirm({ type: "lesson", id: lesson.id, name: lesson.title })
      }
    />
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <CourseHeaderBanner
        courseId={courseId}
        courseTitle={course?.title}
        courseStatus={course?.status}
        onEditCourse={() => router.push(`/admin/courses/${courseId}` as `string` as Parameters<typeof router.push>[0])}
        onPublish={handlePublishCourse}
        onUnpublish={handleUnpublishCourse}
        onAddModule={handleOpenAddModule}
        isPublishing={isPublishing}
      />

      {/* Error State */}
      {error ? (
        <Card className="border-red-200">
          <CardContent className="p-6 text-sm text-red-600">{error}</CardContent>
        </Card>
      ) : null}

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="grid gap-4">
          {modules.map((moduleItem, moduleIndex) => (
            <ModuleAccordion
              key={moduleItem.id}
              module={moduleItem}
              moduleIndex={moduleIndex}
              onCreateLesson={openCreateLessonDialog}
              onEditModule={handleEditModule}
              onDeleteModule={(moduleId) => {
                setDeleteConfirm({
                  type: "module",
                  id: moduleId,
                  name: moduleItem.title,
                });
              }}
              onEditLesson={(lesson) => navigateToLesson(lesson)}
              onDeleteLesson={() => {}}
              onReorderLessons={handleReorderLessons}
              onNavigateToLesson={navigateToLesson}
              renderLesson={renderLesson}
              isReordering={reorderingModules[moduleItem.id] ?? false}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && modules.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="size-8"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">
              Chưa có chương học nào
            </h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm">
              Bắt đầu xây dựng nội dung khóa học bằng cách thêm chương học đầu tiên
            </p>
            <Button onClick={handleOpenAddModule} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="size-4"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Thêm chương học
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Module Sheet */}
      <ModuleSheet
        open={openModuleSheet}
        onOpenChange={setOpenModuleSheet}
        onSubmit={handleSubmitModule}
        title={moduleTitle}
        onTitleChange={setModuleTitle}
        description={moduleDescription}
        onDescriptionChange={setModuleDescription}
        submitting={submitting}
        isEditing={Boolean(editingModule)}
        moduleId={editingModule?.id}
      />

      {/* Lesson Create Sheet */}
      <LessonCreateSheet
        open={openLessonCreateSheet}
        onOpenChange={setOpenLessonCreateSheet}
        onSubmit={handleCreateLesson}
        moduleId={creatingLessonForModuleId ?? ""}
        submitting={submitting}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={Boolean(deleteConfirm)}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Xác nhận xóa"
        description="Hành động này không thể hoàn tác."
        itemName={deleteConfirm?.name}
      />
    </div>
  );
}

// Lesson Card Component
function LessonCard({
  lesson,
  lessonIndex,
  onClick,
  onDelete,
}: {
  lesson: WorkspaceLesson;
  lessonIndex: number;
  onClick: () => void;
  onDelete: (lessonId: string) => void;
}) {
  // Determine lesson type by flags first, then by content existence
  const type = lesson.hasVocabulary
    ? "VOCABULARY"
    : lesson.hasVideo
    ? "VIDEO"
    : lesson.hasQuiz || lesson.quiz
    ? "QUIZ"
    : lesson.hasWrite || lesson.write
    ? "WRITING"
    : "TEXT";

  const typeConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    TEXT: {
      color: "bg-blue-100 text-blue-700",
      label: "Text",
      icon: <FileText className="size-3.5" />,
    },
    VIDEO: {
      color: "bg-purple-100 text-purple-700",
      label: "Video",
      icon: <Video className="size-3.5" />,
    },
    QUIZ: {
      color: "bg-amber-100 text-amber-700",
      label: "Quiz",
      icon: <FileQuestion className="size-3.5" />,
    },
    WRITING: {
      color: "bg-emerald-100 text-emerald-700",
      label: "Writing",
      icon: <FilePenLine className="size-3.5" />,
    },
    VOCABULARY: {
      color: "bg-teal-100 text-teal-700",
      label: "Từ vựng",
      icon: <BookOpen className="size-3.5" />,
    },
  };

  const config = typeConfig[type];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-indigo-200 hover:shadow-sm cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">
            {lessonIndex + 1}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}
          >
            {config.icon}
            {config.label}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(lesson.id);
          }}
        >
          <Trash2 className="size-3.5" />
        </Button>
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
