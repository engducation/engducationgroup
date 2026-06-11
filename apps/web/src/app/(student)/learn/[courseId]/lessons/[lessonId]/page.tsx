import { auth } from "@/lib/auth";
import { db } from "@/db";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import {
  course,
  module,
  lesson,
  lessonVideo,
  read,
  write,
  quiz,
  quizQuestion,
  lessonVocabularyItem,
  studentProgress,
} from "@/db/schema/learning-content";
import { user } from "@/db/schema/auth";
import { eq, and, asc, inArray } from "drizzle-orm";
import { LessonViewerClient } from "./lesson-viewer-client";

interface PageProps {
  params: Promise<{ courseId: string; lessonId: string }>;
}

export default async function StudentLessonPage({ params }: PageProps) {
  const { courseId, lessonId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Verify subscription is active
  const [currentUser] = await db
    .select({
      expiresAt: user.expiresAt,
      subscriptionPlan: user.subscriptionPlan,
    })
    .from(user)
    .where(eq(user.id, session.user.id));

  const now = new Date();
  const hasPremium =
    currentUser?.subscriptionPlan && currentUser.subscriptionPlan !== "FREE";
  const isExpired = currentUser?.expiresAt
    ? new Date(currentUser.expiresAt) < now
    : true;

  if (!hasPremium || isExpired) {
    redirect("/dashboard?error=PREMIUM_REQUIRED");
  }

  // Fetch course
  const [courseData] = await db
    .select()
    .from(course)
    .where(and(eq(course.id, courseId), eq(course.status, "PUBLISHED")))
    .limit(1);

  if (!courseData) {
    notFound();
  }

  // Fetch all modules for sidebar
  const modules = await db
    .select()
    .from(module)
    .where(eq(module.courseId, courseId))
    .orderBy(asc(module.orderIndex));

  // Fetch all lessons with their data
  const moduleIds = modules.map((m) => m.id);
  const allLessons =
    moduleIds.length > 0
      ? await db
          .select()
          .from(lesson)
          .where(inArray(lesson.moduleId, moduleIds))
          .orderBy(asc(lesson.orderIndex))
      : [];

  // Fetch student progress for all lessons
  const lessonIds = allLessons.map((l) => l.id);
  const progressRecords =
    lessonIds.length > 0
      ? await db
          .select()
          .from(studentProgress)
          .where(
            and(
              eq(studentProgress.userId, session.user.id),
              inArray(studentProgress.lessonId, lessonIds)
            )
          )
      : [];

  const progressByLessonId: Record<string, (typeof progressRecords)[0]> = {};
  for (const p of progressRecords) {
    progressByLessonId[p.lessonId] = p;
  }

  // Build modules with lessons and progress
  const modulesWithLessons = modules.map((mod) => {
    const modLessons = allLessons
      .filter((l) => l.moduleId === mod.id)
      .map((l) => ({
        ...l,
        progress: progressByLessonId[l.id]
          ? {
              readCompleted: progressByLessonId[l.id].readCompleted,
              writeCompleted: progressByLessonId[l.id].writeCompleted,
              quizCompleted: progressByLessonId[l.id].quizCompleted,
              videoCompleted: progressByLessonId[l.id].videoCompleted,
              vocabularyReviewed: progressByLessonId[l.id].vocabularyReviewed,
            }
          : undefined,
      }));

    return {
      ...mod,
      lessons: modLessons,
    };
  });

  // Fetch current lesson
  const [currentLesson] = await db
    .select()
    .from(lesson)
    .where(eq(lesson.id, lessonId))
    .limit(1);

  if (!currentLesson) {
    notFound();
  }

  // Fetch lesson content based on type
  let lessonContent: Record<string, unknown> = {};

  if (currentLesson.hasVideo) {
    const [video] = await db
      .select()
      .from(lessonVideo)
      .where(eq(lessonVideo.lessonId, lessonId))
      .limit(1);
    lessonContent = video || {};
  }

  if (currentLesson.hasRead) {
    const [readContent] = await db
      .select()
      .from(read)
      .where(eq(read.lessonId, lessonId))
      .limit(1);
    lessonContent = readContent || {};
  }

  if (currentLesson.hasWrite) {
    const [writeContent] = await db
      .select()
      .from(write)
      .where(eq(write.lessonId, lessonId))
      .limit(1);
    lessonContent = writeContent || {};
  }

  if (currentLesson.hasQuiz) {
    const [quizData] = await db
      .select()
      .from(quiz)
      .where(eq(quiz.lessonId, lessonId))
      .limit(1);

    let questions: Array<{
      question: string;
      options: string[];
      correctOption: number;
      explanation: string;
    }> = [];

    if (quizData) {
      const quizQuestions = await db
        .select()
        .from(quizQuestion)
        .where(eq(quizQuestion.quizId, quizData.id))
        .orderBy(asc(quizQuestion.orderIndex));

      questions = quizQuestions.map((q) => ({
        question: q.question,
        options: JSON.parse(q.options) as string[],
        correctOption: q.correctOption,
        explanation: q.explanation,
      }));
    }

    lessonContent = {
      ...quizData,
      questions,
    };
  }

  if (currentLesson.hasVocabulary) {
    const vocabItems = await db
      .select()
      .from(lessonVocabularyItem)
      .where(eq(lessonVocabularyItem.lessonId, lessonId))
      .orderBy(asc(lessonVocabularyItem.orderIndex));

    lessonContent = {
      items: vocabItems.map((item) => ({
        id: item.id,
        word: item.word,
        phonetic: item.phonetic,
        partOfSpeech: item.partOfSpeech,
        meaning: item.meaning,
        example: item.example,
        notes: item.notes,
      })),
    };
  }

  // Get current lesson progress
  const currentProgress = progressByLessonId[lessonId];

  return (
    <LessonViewerClient
      courseId={courseId}
      courseTitle={courseData.title}
      modules={modulesWithLessons}
      currentLesson={{
        ...currentLesson,
        content: lessonContent,
      }}
      initialProgress={
        currentProgress
          ? {
              readCompleted: currentProgress.readCompleted,
              writeCompleted: currentProgress.writeCompleted,
              quizCompleted: currentProgress.quizCompleted,
              videoCompleted: currentProgress.videoCompleted,
              vocabularyReviewed: currentProgress.vocabularyReviewed,
            }
          : undefined
      }
    />
  );
}
