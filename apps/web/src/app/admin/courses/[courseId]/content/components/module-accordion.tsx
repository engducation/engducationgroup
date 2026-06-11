"use client";

import { useState, useCallback } from "react";
import { ChevronRight, Pencil, Plus, Trash2, BookOpenText, MoreVertical, GripVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type StatusValue = "DRAFT" | "PUBLISHED" | "PAUSED";

export type WorkspaceLesson = {
  id: string;
  moduleId: string;
  title: string;
  description?: string | null;
  status: StatusValue;
  orderIndex: number;
  isRequired: boolean;
  hasVocabulary?: boolean;
  read?: { title?: string | null; content?: string | null; keywords?: string | null; learningObjectives?: string | null } | null;
  write?: { prompt?: string | null; gradingCriteria?: string | null; wordCountGuidance?: number | null; aiPromptId?: string | null; maxAiRevisions?: number | null } | null;
  video?: { title?: string | null; description?: string | null; cloudinaryPublicId?: string | null; cloudinaryUrl?: string | null; durationSeconds?: number | null } | null;
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

interface ModuleAccordionProps {
  module: WorkspaceModule;
  moduleIndex: number;
  onCreateLesson: (moduleId: string) => void;
  onAddVocabulary: (moduleId: string) => void;
  onEditModule: (module: WorkspaceModule) => void;
  onDeleteModule: (moduleId: string) => void;
  onEditLesson: (lesson: WorkspaceLesson) => void;
  onDeleteLesson: (lessonId: string) => void;
  onReorderLessons?: (moduleId: string, lessons: WorkspaceLesson[]) => void;
  onEditVocabulary: (moduleId: string, item: WorkspaceVocabulary | null) => void;
  onDeleteVocabulary: (vocabularyId: string) => void;
  renderLesson?: (lesson: WorkspaceLesson, moduleIndex: number, lessonIndex: number) => React.ReactNode;
  renderVocabulary?: (item: WorkspaceVocabulary, moduleId: string) => React.ReactNode;
}

export function ModuleAccordion({
  module,
  moduleIndex,
  onCreateLesson,
  onAddVocabulary,
  onEditModule,
  onDeleteModule,
  onEditLesson,
  onDeleteLesson,
  onReorderLessons,
  onEditVocabulary,
  onDeleteVocabulary,
  renderLesson,
  renderVocabulary,
}: ModuleAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [localLessons, setLocalLessons] = useState<WorkspaceLesson[]>(module.lessons || []);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Sync local lessons when module changes
  const lessons = module.lessons || [];
  const vocabularies = module.vocabularies || [];
  const isPublished = module.status === "PUBLISHED";

  // Start reordering mode
  const startReordering = useCallback(() => {
    setLocalLessons([...lessons]);
    setIsReordering(true);
  }, [lessons]);

  // Cancel reordering
  const cancelReordering = useCallback(() => {
    setIsReordering(false);
    setLocalLessons([...lessons]);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [lessons]);

  // Save new order
  const saveReorder = useCallback(() => {
    if (onReorderLessons) {
      onReorderLessons(module.id, localLessons);
    }
    setIsReordering(false);
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [module.id, localLessons, onReorderLessons]);

  // Handle drag start
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  // Handle drop
  const handleDrop = useCallback((targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newLessons = [...localLessons];
    const [draggedItem] = newLessons.splice(draggedIndex, 1);
    newLessons.splice(targetIndex, 0, draggedItem);

    setLocalLessons(newLessons);
    setDraggedIndex(targetIndex);
    setDragOverIndex(null);
  }, [draggedIndex, localLessons]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // Display lessons - either from state (reordering) or from props
  const displayLessons = isReordering ? localLessons : lessons;

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        className="flex w-full items-center justify-between gap-4 p-5 text-left cursor-pointer transition-colors hover:bg-slate-50/50"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-transform duration-200"
            style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            <ChevronRight className="size-4" />
          </div>

          <span className="text-xs font-mono font-medium text-slate-400 shrink-0">
            Chương {moduleIndex + 1}
          </span>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">
              {module.title}
            </h3>
            {module.description && (
              <p className="text-sm text-slate-500 truncate mt-0.5">
                {module.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="outline"
              className={
                isPublished
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"
              }
            >
              {isPublished ? "Published" : "Draft"}
            </Badge>

            {lessons.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {lessons.length} bài học
              </Badge>
            )}

            {vocabularies.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {vocabularies.length} từ vựng
              </Badge>
            )}
          </div>
        </div>
      </div>

      {isExpanded ? (
        <div className="border-t border-slate-100">
          <div className="flex items-center justify-between gap-4 px-5 py-3 bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCreateLesson(module.id)}
                className="gap-1.5"
              >
                <Plus className="size-3.5" />
                Thêm bài học
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddVocabulary(module.id)}
                className="gap-1.5"
              >
                <BookOpenText className="size-3.5" />
                Thêm từ vựng
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex shrink-0 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 size-8 p-0 border-0 bg-transparent cursor-pointer">
                <MoreVertical className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onEditModule(module)}>
                  <Pencil className="size-4 mr-2" />
                  Chỉnh sửa chương
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDeleteModule(module.id)}
                >
                  <Trash2 className="size-4 mr-2" />
                  Xóa chương
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="p-5 space-y-6">
            {vocabularies.length > 0 ? (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <BookOpenText className="size-4 text-emerald-500" />
                  Từ vựng ({vocabularies.length})
                </h4>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {vocabularies.map((item) =>
                    renderVocabulary ? (
                      renderVocabulary(item, module.id)
                    ) : (
                      <VocabularyItem
                        key={item.id}
                        item={item}
                        onEdit={() => onEditVocabulary(module.id, item)}
                        onDelete={() => onDeleteVocabulary(item.id)}
                      />
                    )
                  )}
                </div>
              </div>
            ) : null}

            {displayLessons.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4 text-indigo-500">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                    </svg>
                    Bài học ({displayLessons.length})
                  </h4>
                  {!isReordering && displayLessons.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={startReordering}
                      className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 gap-1.5"
                    >
                      <GripVertical className="size-3.5" />
                      Sắp xếp
                    </Button>
                  )}
                  {isReordering && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelReordering}
                        className="text-slate-500"
                      >
                        Hủy
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveReorder}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        Lưu thứ tự
                      </Button>
                    </div>
                  )}
                </div>
                {isReordering ? (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 mb-3">
                      Kéo và thả để sắp xếp lại thứ tự bài học
                    </p>
                    {localLessons.map((lesson, lessonIndex) => (
                      <DraggableLessonItem
                        key={lesson.id}
                        lesson={lesson}
                        index={lessonIndex}
                        isDragging={draggedIndex === lessonIndex}
                        isDragOver={dragOverIndex === lessonIndex}
                        onDragStart={() => handleDragStart(lessonIndex)}
                        onDragOver={(e) => handleDragOver(e, lessonIndex)}
                        onDrop={() => handleDrop(lessonIndex)}
                        onDragEnd={handleDragEnd}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {displayLessons.map((lesson, lessonIndex) =>
                      renderLesson ? (
                        renderLesson(lesson, moduleIndex, lessonIndex)
                      ) : (
                        <LessonItem
                          key={lesson.id}
                          lesson={lesson}
                          moduleIndex={moduleIndex}
                          lessonIndex={lessonIndex}
                          onEdit={() => onEditLesson(lesson)}
                          onDelete={() => onDeleteLesson(lesson.id)}
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {lessons.length === 0 && vocabularies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-6">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                    <path d="M12 6v7M9 10l3-3 3 3" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-600 mb-1">
                  Chương học trống
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  Thêm bài học hoặc từ vựng để bắt đầu xây dựng nội dung
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCreateLesson(module.id)}
                  >
                    <Plus className="size-3.5 mr-1.5" />
                    Thêm bài học
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddVocabulary(module.id)}
                  >
                    <BookOpenText className="size-3.5 mr-1.5" />
                    Thêm từ vựng
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DraggableLessonItem({
  lesson,
  index,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  lesson: WorkspaceLesson;
  index: number;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  const getLessonType = () => {
    if (lesson.video) return "VIDEO";
    if (lesson.quiz?.questions?.length) return "QUIZ";
    if (lesson.write) return "WRITING";
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
  };

  const config = typeConfig[type];

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      onDragEnd={onDragEnd}
      className={`group relative flex flex-col gap-2 rounded-xl border bg-white p-4 transition-all cursor-grab active:cursor-grabbing ${
        isDragging
          ? "opacity-50 border-indigo-300 shadow-lg"
          : isDragOver
          ? "border-indigo-400 bg-indigo-50/50 ring-2 ring-indigo-200"
          : "border-slate-200 hover:border-indigo-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 -ml-1 rounded text-slate-400">
            <GripVertical className="size-4" />
          </div>
          <span className="text-xs font-mono text-slate-400">{index + 1}</span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}>
            {config.icon}
            {config.label}
          </span>
        </div>
      </div>

      <div>
        <h5 className="font-medium text-slate-900 line-clamp-2">{lesson.title}</h5>
        {lesson.description && (
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{lesson.description}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`text-xs px-2 py-0.5 rounded-full border ${
          lesson.status === "PUBLISHED"
            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
            : "bg-slate-50 text-slate-500 border-slate-200"
        }`}>
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

function VocabularyItem({
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
          <span className="font-medium text-slate-900 truncate">{item.word}</span>
          <span className="text-xs text-slate-400 italic">{item.partOfSpeech}</span>
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">{item.meaning}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="size-7" onClick={onEdit}>
          <Pencil className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="size-7 text-red-500 hover:text-red-600" onClick={onDelete}>
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function LessonItem({
  lesson,
  moduleIndex,
  lessonIndex,
  onEdit,
  onDelete,
}: {
  lesson: WorkspaceLesson;
  moduleIndex: number;
  lessonIndex: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const getLessonType = () => {
    if (lesson.video) return "VIDEO";
    if (lesson.quiz?.questions?.length) return "QUIZ";
    if (lesson.write) return "WRITING";
    return "TEXT";
  };

  const type = getLessonType();

  const typeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    TEXT: { icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>, color: "bg-blue-100 text-blue-700", label: "Text" },
    VIDEO: { icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>, color: "bg-purple-100 text-purple-700", label: "Video" },
    QUIZ: { icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>, color: "bg-amber-100 text-amber-700", label: "Quiz" },
    WRITING: { icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>, color: "bg-emerald-100 text-emerald-700", label: "Writing" },
  };

  const config = typeConfig[type];

  return (
    <div className="group relative flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-indigo-200 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">
            {lessonIndex + 1}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}>
            {config.icon}
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="size-7" onClick={onEdit}>
            <Pencil className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7 text-red-500 hover:text-red-600" onClick={onDelete}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      <div>
        <h5 className="font-medium text-slate-900 line-clamp-2">{lesson.title}</h5>
        {lesson.description && (
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{lesson.description}</p>
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
          <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
            Bắt buộc
          </Badge>
        )}
      </div>
    </div>
  );
}
