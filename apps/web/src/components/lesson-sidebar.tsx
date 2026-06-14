"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Video,
  FilePenLine,
  FileQuestion,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Home,
  Menu,
  X,
} from "lucide-react";

interface Module {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  orderIndex: number;
  hasRead: boolean;
  hasWrite: boolean;
  hasQuiz: boolean;
  hasVideo: boolean;
  hasVocabulary: boolean;
  status: string;
  progress?: {
    readCompleted: boolean;
    writeCompleted: boolean;
    quizCompleted: boolean;
    videoCompleted: boolean;
    vocabularyReviewed: boolean;
  };
}

interface LessonSidebarProps {
  courseId: string;
  modules: Module[];
  currentLessonId: string;
}

function getLessonIcon(lesson: Lesson) {
  if (lesson.hasVideo) return <Video className="size-3.5" />;
  if (lesson.hasQuiz) return <FileQuestion className="size-3.5" />;
  if (lesson.hasWrite) return <FilePenLine className="size-3.5" />;
  if (lesson.hasVocabulary) return <BookOpen className="size-3.5" />;
  if (lesson.hasRead) return <BookOpen className="size-3.5" />;
  return <Circle className="size-3.5" />;
}

function getLessonColor(lesson: Lesson) {
  if (lesson.hasVideo) return "text-rose-500";
  if (lesson.hasQuiz) return "text-amber-500";
  if (lesson.hasWrite) return "text-emerald-500";
  if (lesson.hasVocabulary) return "text-teal-500";
  if (lesson.hasRead) return "text-indigo-500";
  return "text-slate-400";
}

function isLessonCompleted(lesson: Lesson): boolean {
  if (!lesson.progress) return false;
  const { hasRead, hasWrite, hasQuiz, hasVideo, hasVocabulary } = lesson;
  if (hasVideo && !lesson.progress.videoCompleted) return false;
  if (hasRead && !lesson.progress.readCompleted) return false;
  if (hasWrite && !lesson.progress.writeCompleted) return false;
  if (hasQuiz && !lesson.progress.quizCompleted) return false;
  if (hasVocabulary && !lesson.progress.vocabularyReviewed) return false;
  return true;
}

function ModuleAccordion({
  module,
  courseId,
  currentLessonId,
  defaultOpen = false,
}: {
  module: Module;
  courseId: string;
  currentLessonId: string;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const currentModuleId = module.id;

  // Auto-open if current lesson is in this module
  useEffect(() => {
    if (module.lessons.some((l) => l.id === currentLessonId)) {
      setIsOpen(true);
    }
  }, [currentLessonId, module.lessons]);

  const completedCount = module.lessons.filter(isLessonCompleted).length;
  const totalCount = module.lessons.length;

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex size-6 items-center justify-center rounded-md bg-indigo-100 text-[10px] font-bold text-indigo-600">
          {module.orderIndex + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 truncate">{module.title}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {completedCount}/{totalCount} hoàn thành
          </p>
        </div>
        {isOpen ? (
          <ChevronDown className="size-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronRight className="size-4 text-slate-400 shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="pb-2">
          {module.lessons.map((lesson) => {
            const isActive = lesson.id === currentLessonId;
            const isCompleted = isLessonCompleted(lesson);

            return (
              <Link
                key={lesson.id}
                href={`/learn/${courseId}/lessons/${lesson.id}`}
                className={`flex items-center gap-2.5 px-4 py-2.5 pl-10 text-sm transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className={getLessonColor(lesson)}>{getLessonIcon(lesson)}</span>
                <span className="flex-1 truncate">{lesson.title}</span>
                {isCompleted ? (
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                ) : isActive ? (
                  <Circle className="size-4 text-indigo-500 fill-indigo-100 shrink-0" />
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LessonSidebar({ courseId, modules, currentLessonId }: LessonSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Find current lesson info
  let currentLesson: Lesson | undefined;
  let currentModuleIndex = -1;
  let currentLessonIndex = -1;
  let prevLesson: Lesson | undefined;
  let nextLesson: Lesson | undefined;

  for (let mi = 0; mi < modules.length; mi++) {
    for (let li = 0; li < modules[mi].lessons.length; li++) {
      if (modules[mi].lessons[li].id === currentLessonId) {
        currentLesson = modules[mi].lessons[li];
        currentModuleIndex = mi;
        currentLessonIndex = li;
      } else if (!prevLesson) {
        prevLesson = modules[mi].lessons[li];
      }
    }
  }

  // Find next lesson
  if (currentModuleIndex >= 0) {
    // Next in same module
    if (currentLessonIndex < modules[currentModuleIndex].lessons.length - 1) {
      nextLesson = modules[currentModuleIndex].lessons[currentLessonIndex + 1];
    } else if (currentModuleIndex < modules.length - 1) {
      // First lesson of next module
      nextLesson = modules[currentModuleIndex + 1].lessons[0];
    }
  }

  // Calculate overall progress
  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessons = modules.reduce(
    (acc, m) => acc + m.lessons.filter(isLessonCompleted).length,
    0
  );
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <Link
          href={`/learn/${courseId}`}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-3"
        >
          <ArrowLeft className="size-4" />
          Quay về tổng quan
        </Link>

        {/* Overall Progress */}
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600">Tiến độ khóa học</span>
            <span className="text-xs font-bold text-indigo-600">{progressPercent}%</span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">
            {completedLessons}/{totalLessons} bài học
          </p>
        </div>
      </div>

      {/* Modules & Lessons */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-2">
          {modules.map((module) => (
            <ModuleAccordion
              key={module.id}
              module={module}
              courseId={courseId}
              currentLessonId={currentLessonId}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          {prevLesson ? (
            <Link
              href={`/learn/${courseId}/lessons/${prevLesson.id}`}
              className="flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span className="truncate">Bài trước</span>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          {nextLesson ? (
            <Link
              href={`/learn/${courseId}/lessons/${nextLesson.id}`}
              className="flex-1 flex items-center justify-end gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              <span className="truncate">Bài tiếp</span>
              <ArrowRight className="size-3.5" />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 flex size-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-colors"
      >
        {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 right-0 lg:right-auto h-screen w-72 bg-white border-l border-slate-200 z-50 transform transition-transform lg:transform-none ${
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
