"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { LessonSidebar } from "@/components/lesson-sidebar";
import { VideoLesson } from "@/components/lessons/video-lesson";
import { TextLesson } from "@/components/lessons/text-lesson";
import { QuizLesson } from "@/components/lessons/quiz-lesson";
import { VocabularyLesson } from "@/components/lessons/vocabulary-lesson";
import { WritingLesson } from "@/components/lessons/writing-lesson";
import { useVocabulary } from "@/features/vocabulary/hooks/useVocabulary";

interface Module {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Array<{
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
  }>;
}

interface LessonContent {
  title?: string;
  content?: string;
  keywords?: string | null;
  learningObjectives?: string | null;
  cloudinaryUrl?: string;
  durationSeconds?: number | null;
  description?: string | null;
  prompt?: string;
  gradingCriteria?: string | null;
  wordCountGuidance?: number | null;
  passingPercentage?: number;
  questions?: Array<{
    question: string;
    options: string[];
    correctOption: number;
    explanation: string;
  }>;
  items?: Array<{
    id: string;
    word: string;
    phonetic?: string | null;
    partOfSpeech: string;
    meaning: string;
    example?: string | null;
    notes?: string | null;
  }>;
}

interface LessonViewerClientProps {
  courseId: string;
  courseTitle: string;
  modules: Module[];
  currentLesson: {
    id: string;
    title: string;
    hasRead: boolean;
    hasWrite: boolean;
    hasQuiz: boolean;
    hasVideo: boolean;
    hasVocabulary: boolean;
    content: LessonContent;
  };
  initialProgress?: {
    readCompleted: boolean;
    writeCompleted: boolean;
    quizCompleted: boolean;
    videoCompleted: boolean;
    vocabularyReviewed: boolean;
  };
}

export function LessonViewerClient({
  courseId,
  courseTitle,
  modules,
  currentLesson,
  initialProgress,
}: LessonViewerClientProps) {
  const [progress, setProgress] = useState(initialProgress || {
    readCompleted: false,
    writeCompleted: false,
    quizCompleted: false,
    videoCompleted: false,
    vocabularyReviewed: false,
  });

  // Avoid duplicate POSTs if a user double-clicks an "Hoàn thành" button
  // while the network request is still in flight.
  const inFlightRef = useRef<Set<string>>(new Set());

  // Notebook state for vocabulary lessons: tracks which inline lesson items
  // are already saved to the user's notebook, so the flashcard can show a
  // "Đã lưu" state without an extra round-trip per card.
  const { notebook, loadNotebook, saveLessonItemToNotebook } = useVocabulary();

  const savedWordKeys = useMemo(() => {
    const set = new Set<string>();
    for (const entry of notebook) {
      const v = entry.vocabulary;
      set.add(`${v.word.trim().toLowerCase()}|${v.partOfSpeech.trim().toLowerCase()}`);
    }
    return set;
  }, [notebook]);

  const isLessonVocabSaved = useCallback(
    (item: { word: string; partOfSpeech: string }) =>
      savedWordKeys.has(
        `${item.word.trim().toLowerCase()}|${item.partOfSpeech.trim().toLowerCase()}`,
      ),
    [savedWordKeys],
  );

  // Track which flashcard the user has just saved so the UI flips to
  // "Đã lưu" without waiting for `loadNotebook` to complete.
  const [locallySavedIds, setLocallySavedIds] = useState<Set<string>>(
    () => new Set(),
  );

  const handleAddLessonVocabToNotebook = useCallback(
    async (item: {
      id: string;
      word: string;
      partOfSpeech: string;
    }) => {
      if (locallySavedIds.has(item.id) || isLessonVocabSaved(item)) {
        toast.info(`"${item.word}" đã có trong sổ từ vựng`);
        return;
      }

      // Optimistic: flip the UI immediately.
      setLocallySavedIds((prev) => {
        const next = new Set(prev);
        next.add(item.id);
        return next;
      });

      try {
        const ok = await saveLessonItemToNotebook(item.id);
        if (ok) {
          toast.success(`Đã lưu "${item.word}" vào sổ từ vựng`);
          // Refresh the notebook list so subsequent cards reflect the save
          // and the dedupe key set is up to date.
          await loadNotebook();
        } else {
          // Revert optimistic update on failure.
          setLocallySavedIds((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
          toast.error("Không thể lưu từ vựng. Vui lòng thử lại.");
        }
      } catch (err) {
        setLocallySavedIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        toast.error(
          err instanceof Error ? err.message : "Đã xảy ra lỗi khi lưu từ vựng",
        );
      }
    },
    [
      isLessonVocabSaved,
      loadNotebook,
      locallySavedIds,
      saveLessonItemToNotebook,
    ],
  );

  // Load notebook once when the lesson viewer mounts so the saved-state
  // indicator is accurate even on cold navigation.
  useEffect(() => {
    void loadNotebook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markCompleted = useCallback(
    async (type: "video" | "read" | "quiz" | "writing" | "vocabulary") => {
      const dedupeKey = `${currentLesson.id}:${type}`;
      if (inFlightRef.current.has(dedupeKey)) return;
      inFlightRef.current.add(dedupeKey);

      try {
        const response = await fetch("/api/student/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId: currentLesson.id,
            type,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Update local progress — no router.refresh() needed.
          // The local React state already drives the lesson UI, and the
          // sidebar re-fetches on its own via the LessonSidebar's
          // per-mount data flow. Calling router.refresh() here would
          // re-execute the entire Server Component tree (page.tsx runs
          // 6-8 DB queries), so we skip it during the test period to
          // keep API usage low.
          setProgress((prev) => ({
            ...prev,
            [`${type === "vocabulary" ? "vocabularyReviewed" : type + "Completed"}`]: true,
          }));
          toast.success("Đã đánh dấu hoàn thành!");
        } else {
          throw new Error(data.message || "Có lỗi xảy ra");
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Không thể cập nhật tiến độ"
        );
      } finally {
        inFlightRef.current.delete(dedupeKey);
      }
    },
    [currentLesson.id]
  );

  const handleVideoComplete = useCallback(() => {
    markCompleted("video");
  }, [markCompleted]);

  const handleReadComplete = useCallback(() => {
    markCompleted("read");
  }, [markCompleted]);

  const handleQuizComplete = useCallback(
    (score: number, totalQuestions: number, answers: number[]) => {
      // Save quiz attempt first
      fetch("/api/student/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: currentLesson.id,
          type: "quiz",
          score,
          totalQuestions,
          answers,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setProgress((prev) => ({ ...prev, quizCompleted: true }));
            toast.success("Quiz đã được lưu!");
          }
        })
        .catch(() => {
          toast.error("Không thể lưu kết quả quiz");
        });
    },
    [currentLesson.id]
  );

  const handleWritingComplete = useCallback(
    (_content: string) => {
      // Intentionally a no-op: the server action `submitWritingAction`
      // already calls `upsertWriteProgress` inside the writing service,
      // so calling `/api/student/progress` here would double-write.
      // The local progress UI in `WritingLesson` already shows the
      // completed state via the hook's `isCompleted` flag.
    },
    []
  );

  const handleVocabularyComplete = useCallback(() => {
    markCompleted("vocabulary");
  }, [markCompleted]);

  // Determine lesson type and render appropriate component
  const renderLessonContent = () => {
    if (currentLesson.hasVideo) {
      return (
        <VideoLesson
          lessonId={currentLesson.id}
          title={currentLesson.content.title || currentLesson.title}
          description={currentLesson.content.description}
          cloudinaryUrl={currentLesson.content.cloudinaryUrl || ""}
          durationSeconds={currentLesson.content.durationSeconds}
          isCompleted={progress.videoCompleted}
          onComplete={handleVideoComplete}
        />
      );
    }

    if (currentLesson.hasRead) {
      return (
        <TextLesson
          lessonId={currentLesson.id}
          title={currentLesson.content.title || currentLesson.title}
          content={currentLesson.content.content || ""}
          keywords={currentLesson.content.keywords}
          learningObjectives={currentLesson.content.learningObjectives}
          isCompleted={progress.readCompleted}
          onComplete={handleReadComplete}
        />
      );
    }

    if (currentLesson.hasQuiz) {
      return (
        <QuizLesson
          lessonId={currentLesson.id}
          title={currentLesson.content.title || currentLesson.title}
          passingPercentage={currentLesson.content.passingPercentage}
          questions={currentLesson.content.questions || []}
          isCompleted={progress.quizCompleted}
          onComplete={handleQuizComplete}
        />
      );
    }

    if (currentLesson.hasVocabulary) {
      return (
        <VocabularyLesson
          lessonId={currentLesson.id}
          title={currentLesson.content.title || currentLesson.title}
          items={currentLesson.content.items || []}
          isCompleted={progress.vocabularyReviewed}
          onComplete={handleVocabularyComplete}
          onAddToNotebook={handleAddLessonVocabToNotebook}
          isItemSaved={(item) =>
            locallySavedIds.has(item.id) || isLessonVocabSaved(item)
          }
        />
      );
    }

    if (currentLesson.hasWrite) {
      return (
        <WritingLesson
          lessonId={currentLesson.id}
          title={currentLesson.content.title || currentLesson.title}
          prompt={currentLesson.content.prompt || ""}
          gradingCriteria={currentLesson.content.gradingCriteria}
          wordCountGuidance={currentLesson.content.wordCountGuidance}
          isCompleted={progress.writeCompleted}
          onComplete={handleWritingComplete}
        />
      );
    }

    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Nội dung bài học đang được phát triển.</p>
      </div>
    );
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Main Content */}
      <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              href={`/learn/${courseId}`}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition"
            >
              <span>←</span>
              {courseTitle}
            </Link>
          </div>

          {renderLessonContent()}
        </div>
      </main>

      {/* Sidebar */}
      <LessonSidebar
        courseId={courseId}
        modules={modules}
        currentLessonId={currentLesson.id}
      />
    </div>
  );
}
