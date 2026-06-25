import { auth } from "@/lib/auth";
import { db } from "@/db";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  course,
  module,
  lesson,
  lessonVideo,
  studentProgress,
} from "@/db/schema/learning-content";
import { user } from "@/db/schema/auth";
import { eq, asc, and, inArray } from "drizzle-orm";
import {
  ArrowLeft,
  BookOpen,
  Video,
  PenLine,
  CheckCircle2,
  Circle,
  Play,
  Clock,
  TrendingUp,
  Target,
} from "lucide-react";

interface PageProps {
  params: Promise<{ courseId: string }>;
}

export default async function StudentLearnPage({ params }: PageProps) {
  const { courseId } = await params;

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

  // Fetch modules
  const modules = await db
    .select()
    .from(module)
    .where(eq(module.courseId, courseId))
    .orderBy(asc(module.orderIndex));

  // Fetch all lessons
  const moduleIds = modules.map((m) => m.id);
  const allLessons =
    moduleIds.length > 0
      ? await db
          .select()
          .from(lesson)
          .where(inArray(lesson.moduleId, moduleIds))
          .orderBy(asc(lesson.orderIndex))
      : [];

  // Fetch student progress
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

  // Group lessons by module
  const lessonsByModule: Record<string, typeof allLessons> = {};
  for (const mod of modules) {
    lessonsByModule[mod.id] = allLessons.filter((l) => l.moduleId === mod.id);
  }

  // Calculate progress stats
  let totalLessons = 0;
  let completedLessons = 0;
  let completedRequired = 0;
  let totalRequired = 0;

  for (const les of allLessons) {
    totalLessons++;
    const prog = progressByLessonId[les.id];

    // Check if this lesson is completed
    const isLessonCompleted =
      (les.hasVideo && prog?.videoCompleted) ||
      (les.hasRead && prog?.readCompleted) ||
      (les.hasWrite && prog?.writeCompleted) ||
      (les.hasQuiz && prog?.quizCompleted) ||
      (les.hasVocabulary && prog?.vocabularyReviewed);

    if (isLessonCompleted) {
      completedLessons++;
      if (les.isRequired) {
        completedRequired++;
      }
    }

    if (les.isRequired) {
      totalRequired++;
    }
  }

  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const requiredProgress = totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;

  // Find the next lesson to continue
  let nextLesson: (typeof allLessons)[0] | null = null;
  for (const les of allLessons) {
    const prog = progressByLessonId[les.id];
    const isCompleted =
      (les.hasVideo && prog?.videoCompleted) ||
      (les.hasRead && prog?.readCompleted) ||
      (les.hasWrite && prog?.writeCompleted) ||
      (les.hasQuiz && prog?.quizCompleted) ||
      (les.hasVocabulary && prog?.vocabularyReviewed);

    if (!isCompleted) {
      nextLesson = les;
      break;
    }
  }

  // Fetch video data for lessons
  const allVideos = await db.select().from(lessonVideo);
  const videoByLessonId: Record<string, (typeof allVideos)[0]> = {};
  for (const v of allVideos) {
    if (lessonsByModule[v.lessonId]) {
      videoByLessonId[v.lessonId] = v;
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back navigation */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition"
      >
        <ArrowLeft className="size-4" />
        Quay về Trang chủ
      </Link>

      {/* Course Header */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center relative">
          {courseData.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={courseData.thumbnailUrl}
              alt={courseData.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-6xl font-bold text-white/30">
              {courseData.title.charAt(0)}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-6 left-8 right-8">
            <span className="inline-flex items-center rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-indigo-600 shadow-sm mb-3">
              {courseData.level}
            </span>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">
              {courseData.title}
            </h1>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Target className="size-5 text-indigo-500" />
              <span className="font-semibold text-slate-800">Tiến độ học tập</span>
            </div>
            <span className="text-2xl font-bold text-indigo-600">{overallProgress}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-sm text-slate-500">
            <span>{completedLessons}/{totalLessons} bài học hoàn thành</span>
            <span>{requiredProgress}% bắt buộc</span>
          </div>
        </div>

        {/* Continue Button */}
        {nextLesson && (
          <div className="p-6 bg-indigo-50/50">
            <Link
              href={`/learn/${courseId}/lessons/${nextLesson.id}`}
              className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
            >
              <Play className="size-5" />
              Tiếp tục học
            </Link>
          </div>
        )}

        {courseData.description && (
          <div className="px-6 py-4 border-t border-slate-100">
            <p className="text-sm text-slate-600 leading-relaxed">{courseData.description}</p>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-indigo-100 mx-auto mb-2">
            <BookOpen className="size-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{modules.length}</div>
          <div className="text-xs text-slate-500">Chương học</div>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-2">
            <TrendingUp className="size-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{completedLessons}</div>
          <div className="text-xs text-slate-500">Đã hoàn thành</div>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 mx-auto mb-2">
            <Clock className="size-5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalLessons - completedLessons}</div>
          <div className="text-xs text-slate-500">Còn lại</div>
        </div>
      </div>

      {/* Modules & Lessons Tree */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <BookOpen className="size-5 text-indigo-500" />
          Nội dung khóa học
        </h2>

        {modules.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white p-12 text-center">
            <BookOpen className="size-12 text-slate-300 mx-auto mb-4" />
            <p className="text-sm text-slate-500">
              Khóa học này hiện chưa có nội dung. Quay lại sau nhé!
            </p>
          </div>
        ) : (
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden divide-y">
            {modules.map((mod, moduleIndex) => {
              const moduleLessons = lessonsByModule[mod.id] || [];
              const moduleCompleted = moduleLessons.filter((les) => {
                const prog = progressByLessonId[les.id];
                return (
                  (les.hasVideo && prog?.videoCompleted) ||
                  (les.hasRead && prog?.readCompleted) ||
                  (les.hasWrite && prog?.writeCompleted) ||
                  (les.hasQuiz && prog?.quizCompleted) ||
                  (les.hasVocabulary && prog?.vocabularyReviewed)
                );
              }).length;
              const moduleProgress = moduleLessons.length > 0
                ? Math.round((moduleCompleted / moduleLessons.length) * 100)
                : 0;

              return (
                <div key={mod.id} className="p-5">
                  {/* Module Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-600">
                      {moduleIndex + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800">{mod.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[100px]">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${moduleProgress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">
                          {moduleCompleted}/{moduleLessons.length}
                        </span>
                      </div>
                    </div>
                    {moduleProgress === 100 && moduleLessons.length > 0 && (
                      <CheckCircle2 className="size-5 text-emerald-500" />
                    )}
                  </div>

                  {/* Lessons */}
                  {moduleLessons.length === 0 ? (
                    <div className="ml-11 py-3 text-sm text-slate-400 italic">
                      Chưa có bài học nào trong chương này
                    </div>
                  ) : (
                    <div className="space-y-1 ml-11">
                      {moduleLessons.map((les, lessonIndex) => {
                        const video = videoByLessonId[les.id];
                        const prog = progressByLessonId[les.id];
                        const isCompleted =
                          (les.hasVideo && prog?.videoCompleted) ||
                          (les.hasRead && prog?.readCompleted) ||
                          (les.hasWrite && prog?.writeCompleted) ||
                          (les.hasQuiz && prog?.quizCompleted) ||
                          (les.hasVocabulary && prog?.vocabularyReviewed);

                        return (
                          <Link
                            key={les.id}
                            href={`/learn/${courseId}/lessons/${les.id}`}
                            className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                              isCompleted
                                ? "bg-emerald-50 hover:bg-emerald-100"
                                : "hover:bg-slate-50"
                            }`}
                          >
                            <div className={`flex size-7 items-center justify-center rounded-full text-xs font-medium ${
                              isCompleted
                                ? "bg-emerald-200 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}>
                              {lessonIndex + 1}
                            </div>

                            {/* Type Icons */}
                            <div className="flex items-center gap-1.5">
                              {les.hasRead && (
                                <span title="Bài đọc" className="text-indigo-500">
                                  <BookOpen className="size-4" />
                                </span>
                              )}
                              {les.hasVideo && (
                                <span title="Video bài giảng" className="text-rose-500">
                                  <Video className="size-4" />
                                </span>
                              )}
                              {les.hasWrite && (
                                <span title="Bài viết" className="text-emerald-500">
                                  <PenLine className="size-4" />
                                </span>
                              )}
                              {les.hasQuiz && (
                                <span title="Bài Quiz" className="text-amber-500">
                                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </span>
                              )}
                              {les.hasVocabulary && (
                                <span title="Từ vựng" className="text-teal-500">
                                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                  </svg>
                                </span>
                              )}
                            </div>

                            <span className={`flex-1 text-sm font-medium ${
                              isCompleted ? "text-emerald-700" : "text-slate-700"
                            }`}>
                              {les.title}
                            </span>

                            {les.isRequired && (
                              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                                Bắt buộc
                              </span>
                            )}

                            {/* Action */}
                            {isCompleted ? (
                              <CheckCircle2 className="size-5 text-emerald-500" />
                            ) : (
                              <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                <Play className="size-3" />
                                Học
                              </div>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
