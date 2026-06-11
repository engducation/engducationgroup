"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { LessonSidebar } from "@/components/lesson-sidebar";
import { VideoLesson } from "@/components/lessons/video-lesson";
import { TextLesson } from "@/components/lessons/text-lesson";
import { QuizLesson } from "@/components/lessons/quiz-lesson";
import { VocabularyLesson } from "@/components/lessons/vocabulary-lesson";
import { WritingLesson } from "@/components/lessons/writing-lesson";

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
  const router = useRouter();
  const [progress, setProgress] = useState(initialProgress || {
    readCompleted: false,
    writeCompleted: false,
    quizCompleted: false,
    videoCompleted: false,
    vocabularyReviewed: false,
  });

  const markCompleted = useCallback(
    async (type: "video" | "read" | "quiz" | "writing" | "vocabulary") => {
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
          // Update local progress
          setProgress((prev) => ({
            ...prev,
            [`${type === "vocabulary" ? "vocabularyReviewed" : type + "Completed"}`]: true,
          }));
          toast.success("Đã đánh dấu hoàn thành!");
          router.refresh();
        } else {
          throw new Error(data.message || "Có lỗi xảy ra");
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Không thể cập nhật tiến độ"
        );
      }
    },
    [currentLesson.id, router]
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
            router.refresh();
          }
        })
        .catch(() => {
          toast.error("Không thể lưu kết quả quiz");
        });
    },
    [currentLesson.id, router]
  );

  const handleWritingComplete = useCallback(
    (content: string) => {
      markCompleted("writing");
    },
    [markCompleted]
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
