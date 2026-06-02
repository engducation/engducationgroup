import { auth } from "@/lib/auth";
import { db } from "@/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { course, module, lesson } from "@/db/schema/learning-content";
import { courseOrder } from "@/db/schema/admin";
import { eq, desc } from "drizzle-orm";
import {
  BookOpen,
  Clock,
  Trophy,
  ArrowRight,
  Play,
  CheckCircle2,
} from "lucide-react";

export default async function StudentDashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch enrolled courses
  const enrolledCourses = await db
    .select({
      id: course.id,
      title: course.title,
      description: course.description,
      level: course.level,
      status: course.status,
      thumbnailUrl: course.thumbnailUrl,
      createdAt: course.createdAt,
    })
    .from(course)
    .innerJoin(courseOrder, eq(courseOrder.courseId, course.id))
    .where(eq(courseOrder.userId, session.user.id))
    .orderBy(desc(course.createdAt));

  // Fetch modules for enrolled courses
  const courseIds = enrolledCourses.map((c) => c.id);
  const modulesData =
    courseIds.length > 0
      ? await db
          .select({ courseId: module.courseId, moduleId: module.id })
          .from(module)
          .where(eq(module.courseId, courseIds[0]!))
      : [];

  // Fetch lessons for all modules
  const moduleIds = modulesData.map((m) => m.moduleId);
  const lessonsData =
    moduleIds.length > 0
      ? await db
          .select({ moduleId: lesson.moduleId, lessonId: lesson.id })
          .from(lesson)
      : [];

  // Build counts
  const modulesMap: Record<string, number> = {};
  const lessonsMap: Record<string, number> = {};
  for (const m of modulesData) {
    modulesMap[m.courseId] = (modulesMap[m.courseId] || 0) + 1;
  }
  for (const l of lessonsData) {
    const parentModule = modulesData.find((m) => m.moduleId === l.moduleId);
    if (parentModule) {
      lessonsMap[parentModule.courseId] =
        (lessonsMap[parentModule.courseId] || 0) + 1;
    }
  }

  // Sample progress data (replace with real progress query when studentProgress table is populated)
  const sampleProgress: Record<string, number> = {};
  for (const c of enrolledCourses) {
    sampleProgress[c.id] = Math.floor(Math.random() * 100);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Xin chào, {session.user.name} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tiếp tục hành trình học tiếng Anh của bạn hôm nay
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <Trophy className="size-4" />
            7 ngày liên tiếp
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-50">
              <BookOpen className="size-4 text-indigo-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {enrolledCourses.length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Khóa học đã đăng ký
          </div>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-50">
              <Play className="size-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {Object.values(lessonsMap).reduce((a, b) => a + b, 0)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Bài học có sẵn</div>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-50">
              <CheckCircle2 className="size-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {Math.round(
              enrolledCourses.length > 0
                ? enrolledCourses.reduce(
                    (acc, c) => acc + (sampleProgress[c.id] || 0),
                    0
                  ) / enrolledCourses.length
                : 0
            )}
            %
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Tiến độ trung bình
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {enrolledCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <BookOpen className="size-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-700 mb-1">
            Bạn chưa đăng ký khóa học nào
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Khám phá các khóa học của chúng tôi để bắt đầu học ngay hôm nay
          </p>
          <Link
            href="/#features"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            Xem khóa học
            <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
            <BookOpen className="size-4 text-indigo-500" />
            Khóa học của tôi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrolledCourses.map((courseItem) => (
              <Link
                key={courseItem.id}
                href={`/learn/${courseItem.id}` as any}
                className="group rounded-xl border bg-white shadow-sm hover:shadow-md hover:border-indigo-200 transition-all overflow-hidden block"
              >
                {/* Course Thumbnail */}
                <div className="h-32 bg-gradient-to-br from-indigo-100 to-sky-100 flex items-center justify-center relative overflow-hidden">
                  {courseItem.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={courseItem.thumbnailUrl}
                      alt={courseItem.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-4xl font-bold text-indigo-300">
                      {courseItem.title.charAt(0)}
                    </div>
                  )}
                  {/* Level badge */}
                  <span className="absolute top-3 left-3 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-0.5 text-xs font-bold text-indigo-600 shadow-sm">
                    {courseItem.level}
                  </span>
                  {/* Progress overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-200">
                    <div
                      className="h-full bg-indigo-600 transition-all"
                      style={{
                        width: `${sampleProgress[courseItem.id] || 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Course Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition line-clamp-1">
                    {courseItem.title}
                  </h3>
                  {courseItem.description && (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                      {courseItem.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <BookOpen className="size-3" />
                        {modulesMap[courseItem.id] || 0} chương
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {lessonsMap[courseItem.id] || 0} bài
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition">
                      Tiếp tục →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
