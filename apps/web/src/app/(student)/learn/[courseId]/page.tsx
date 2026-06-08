import { auth } from "@/lib/auth";
import { db } from "@/db";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { course, module, lesson, lessonVideo } from "@/db/schema/learning-content";
import { user } from "@/db/schema/auth";
import { eq, asc, and } from "drizzle-orm";
import {
  ArrowLeft,
  BookOpen,
  Video,
  PenLine,
  Play,
  Lock,
  AlertTriangle,
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
    .select({ expiresAt: user.expiresAt })
    .from(user)
    .where(eq(user.id, session.user.id));

  const now = new Date();
  const isSubscriptionActive = currentUser?.expiresAt && new Date(currentUser.expiresAt) > now;
  if (!isSubscriptionActive) {
    redirect("/dashboard?expired=true");
  }

  // Fetch course (must be published for access)
  const courses = await db
    .select()
    .from(course)
    .where(and(eq(course.id, courseId), eq(course.status, "PUBLISHED")))
    .limit(1);

  if (!courses.length) {
    notFound();
  }

  const courseData = courses[0];

  // Fetch modules
  const modules = await db
    .select()
    .from(module)
    .where(eq(module.courseId, courseId))
    .orderBy(asc(module.orderIndex));

  // Fetch all lessons for these modules
  const moduleIds = modules.map((m) => m.id);
  const allLessons =
    moduleIds.length > 0
      ? await db
          .select()
          .from(lesson)
          .where(eq(lesson.moduleId, moduleIds[0]!))
          .orderBy(asc(lesson.orderIndex))
      : [];

  // Group lessons by module
  const lessonsByModule: Record<string, typeof allLessons> = {};
  for (const m of modules) {
    const modLessons = allLessons.filter((l) => l.moduleId === m.id);
    lessonsByModule[m.id] = modLessons;
  }

  // Fetch video data
  const allVideos = await db.select().from(lessonVideo);
  const videoByLessonId: Record<string, (typeof allVideos)[0]> = {};
  for (const v of allVideos) {
    if (lessonsByModule[v.lessonId]) {
      videoByLessonId[v.lessonId] = v;
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back navigation */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition"
      >
        <ArrowLeft className="size-4" />
        Quay về danh sách khóa học
      </Link>

      {/* Course Header */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="h-40 bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center relative">
          {courseData.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={courseData.thumbnailUrl}
              alt={courseData.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-5xl font-bold text-white/50">
              {courseData.title.charAt(0)}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <span className="inline-flex items-center rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-0.5 text-xs font-bold text-indigo-600 shadow-sm mb-2">
              {courseData.level}
            </span>
            <h1 className="text-2xl font-bold text-white drop-shadow">
              {courseData.title}
            </h1>
          </div>
        </div>

        {courseData.description && (
          <div className="px-6 py-4 border-b">
            <p className="text-sm text-slate-600">{courseData.description}</p>
          </div>
        )}
      </div>

      {/* Modules & Lessons Tree */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
          <BookOpen className="size-4 text-indigo-500" />
          Nội dung khóa học
        </h2>

        {modules.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-white p-12 text-center">
            <BookOpen className="size-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">
              Khóa học này hiện chưa có nội dung. Quay lại sau nhé!
            </p>
          </div>
        ) : (
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden divide-y">
            {modules.map((mod, moduleIndex) => {
              const moduleLessons = lessonsByModule[mod.id] || [];
              return (
                <div key={mod.id} className="p-4">
                  {/* Module Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex size-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                      {moduleIndex + 1}
                    </div>
                    <h3 className="font-semibold text-slate-800">{mod.title}</h3>
                    {moduleLessons.length > 0 && (
                      <span className="ml-auto text-xs text-slate-400">
                        {moduleLessons.length} bài
                      </span>
                    )}
                  </div>

                  {/* Lessons */}
                  {moduleLessons.length === 0 ? (
                    <div className="ml-10 py-2 text-sm text-slate-400 italic">
                      Chưa có bài học nào trong chương này
                    </div>
                  ) : (
                    <div className="ml-10 space-y-1">
                      {moduleLessons.map((les, lessonIndex) => {
                        const video = videoByLessonId[les.id];
                        return (
                          <div
                            key={les.id}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 transition group"
                          >
                            <div className="flex size-6 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
                              {lessonIndex + 1}
                            </div>

                            {/* Type Icons */}
                            <div className="flex items-center gap-1.5">
                              {les.hasRead && (
                                <span title="Bài đọc">
                                  <BookOpen className="size-3.5 text-slate-400" />
                                </span>
                              )}
                              {les.hasVideo && (
                                <span title="Video bài giảng">
                                  <Video className="size-3.5 text-rose-400" />
                                </span>
                              )}
                              {les.hasWrite && (
                                <span title="Bài viết">
                                  <PenLine className="size-3.5 text-amber-500" />
                                </span>
                              )}
                            </div>

                            <span className="flex-1 text-sm text-slate-700 group-hover:text-slate-900 transition">
                              {les.title}
                            </span>

                            {/* Action Button */}
                            {les.hasVideo && video ? (
                              <a
                                href={video.cloudinaryUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100 transition"
                              >
                                <Play className="size-3" />
                                Xem video
                              </a>
                            ) : les.hasRead ? (
                              <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                                <BookOpen className="size-3" />
                                Đang phát triển
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-400">
                                <Lock className="size-3" />
                                Sắp ra mắt
                              </span>
                            )}
                          </div>
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
