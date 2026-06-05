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
  Sparkles,
  TrendingUp,
  Flame,
} from "lucide-react";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getGreeting(name: string) {
  const firstName = name.split(" ")[0] ?? name;
  const hour = new Date().getHours();
  if (hour < 12)
    return `Chào buổi sáng, ${firstName}! 🌅 Tiếp tục phong độ nhé.`;
  if (hour < 18)
    return `Chiều tốt, ${firstName}! ☀️ Một buổi chiều học hiệu quả.`;
  return `Chào buổi tối, ${firstName}! 🌙 Giờ ôn tập tuyệt vời.`;
}

export default async function StudentDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

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

  const courseIds = enrolledCourses.map((c) => c.id);
  const modulesData =
    courseIds.length > 0
      ? await db
          .select({ courseId: module.courseId, moduleId: module.id })
          .from(module)
          .where(eq(module.courseId, courseIds[0]!))
      : [];

  const moduleIds = modulesData.map((m) => m.moduleId);
  const lessonsData =
    moduleIds.length > 0
      ? await db
          .select({ moduleId: lesson.moduleId, lessonId: lesson.id })
          .from(lesson)
      : [];

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

  const sampleProgress: Record<string, number> = {};
  for (const c of enrolledCourses) {
    sampleProgress[c.id] = Math.floor(Math.random() * 100);
  }

  const initials = getInitials(session.user.name ?? "HV");
  const avgProgress =
    enrolledCourses.length > 0
      ? Math.round(
          enrolledCourses.reduce(
            (acc, c) => acc + (sampleProgress[c.id] || 0),
            0
          ) / enrolledCourses.length
        )
      : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* ─── PAGE HEADER ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-7 shadow-xl shadow-indigo-500/15">
        {/* Decorative circles */}
        <div className="absolute -right-8 -top-8 size-40 rounded-full bg-white/5" />
        <div className="absolute -right-4 top-12 size-24 rounded-full bg-white/5" />
        <div className="absolute -bottom-6 -left-6 size-32 rounded-full bg-white/5" />

        <div className="relative flex items-start justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white/80">
              <Flame className="size-3 text-amber-300" />
              7 ngày học liên tiếp
            </div>
            <h1 className="text-2xl font-bold text-white">
              {getGreeting(session.user.name ?? "bạn")}
            </h1>
            <p className="text-sm text-white/60 max-w-md">
              Mỗi bài học hoàn thành là một bước tiến. Bạn đang làm rất tốt —
              hãy giữ vững phong độ!
            </p>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5">
                <Trophy className="size-3.5 text-amber-300" />
                <span className="text-xs font-semibold text-white">
                  {avgProgress}% hoàn thành
                </span>
              </div>
            </div>
            <div className="flex size-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-lg font-bold text-white shadow-lg">
              {initials}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative mt-5">
          <div className="h-2 rounded-full bg-white/20" />
          <div
            className="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-amber-300 to-yellow-300 transition-all"
            style={{ width: `${avgProgress}%` }}
          />
        </div>
      </div>

      {/* ─── STATS ROW ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Enrolled courses */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 transition-colors group-hover:bg-indigo-100">
                <BookOpen className="size-4 text-indigo-600" />
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold tracking-tight text-slate-900">
                  {enrolledCourses.length}
                </div>
                <div className="mt-0.5 text-xs text-slate-500 font-medium">
                  Khóa học đã đăng ký
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-indigo-50/50 px-2.5 py-1">
              <TrendingUp className="size-4 text-indigo-400" />
            </div>
          </div>
        </div>

        {/* Card 2: Total lessons */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 transition-colors group-hover:bg-emerald-100">
                <Play className="size-4 text-emerald-600" />
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold tracking-tight text-slate-900">
                  {Object.values(lessonsMap).reduce((a, b) => a + b, 0)}
                </div>
                <div className="mt-0.5 text-xs text-slate-500 font-medium">
                  Bài học có sẵn
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-emerald-50/50 px-2.5 py-1">
              <Sparkles className="size-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Card 3: Average progress */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 transition-colors group-hover:bg-amber-100">
                <CheckCircle2 className="size-4 text-amber-600" />
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold tracking-tight text-slate-900">
                  {avgProgress}
                  <span className="text-lg text-slate-400 font-medium">%</span>
                </div>
                <div className="mt-0.5 text-xs text-slate-500 font-medium">
                  Tiến độ trung bình
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-5 w-1 rounded-full bg-amber-200"
                  style={{
                    height: `${12 + i * 4}px`,
                    backgroundColor: i < Math.ceil(avgProgress / 33) ? "#f59e0b" : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── COURSES SECTION ─── */}
      {enrolledCourses.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-24 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-100 mb-5 shadow-inner">
            <BookOpen className="size-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-700 mb-1.5">
            Bạn chưa đăng ký khóa học nào
          </h2>
          <p className="text-sm text-slate-500 mb-8 max-w-xs">
            Khám phá các khóa học của chúng tôi để bắt đầu hành trình học
            tiếng Anh ngay hôm nay.
          </p>
          <Link
            href="/#features"
            className="inline-flex items-center gap-2.5 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/30 active:translate-y-0"
          >
            Khám phá khóa học
            <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-100">
                <BookOpen className="size-3.5 text-indigo-600" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Khóa học của tôi</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {enrolledCourses.length}
              </span>
            </div>
            <Link
              href="/#features"
              className="flex items-center gap-1 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700"
            >
              Xem thêm
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Course grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {enrolledCourses.map((courseItem) => {
              const progress = sampleProgress[courseItem.id] || 0;
              const modules = modulesMap[courseItem.id] || 0;
              const lessons = lessonsMap[courseItem.id] || 0;

              return (
                <Link
                  key={courseItem.id}
                  href={`/learn/${courseItem.id}` as any}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/8 block"
                >
                  {/* Thumbnail */}
                  <div className="relative h-36 overflow-hidden">
                    {courseItem.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={courseItem.thumbnailUrl}
                        alt={courseItem.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-100 via-violet-100 to-purple-100 flex items-center justify-center">
                        <span className="text-5xl font-bold text-indigo-200/80">
                          {courseItem.title.charAt(0)}
                        </span>
                      </div>
                    )}

                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                    {/* Level badge */}
                    <span className="absolute top-3 left-3 rounded-lg bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-bold text-indigo-600 shadow-sm">
                      {courseItem.level}
                    </span>

                    {/* Progress pill */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-white/30 backdrop-blur-sm overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-300 to-yellow-300 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="rounded-lg bg-black/40 backdrop-blur-sm px-2 py-0.5 text-xs font-semibold text-white">
                        {progress}%
                      </span>
                    </div>
                  </div>

                  {/* Course info */}
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-indigo-700 transition-colors line-clamp-1">
                      {courseItem.title}
                    </h3>
                    {courseItem.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {courseItem.description}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <BookOpen className="size-3.5" />
                          {modules} chương
                        </span>
                        <span className="text-slate-200">·</span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock className="size-3.5" />
                          {lessons} bài
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-bold text-indigo-600 transition-transform group-hover:translate-x-0.5">
                        Tiếp tục
                        <ArrowRight className="size-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
