import { auth } from "@/lib/auth";
import { db } from "@/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { course, module, lesson } from "@/db/schema/learning-content";
import { user } from "@/db/schema/auth";
import { eq, desc } from "drizzle-orm";
import {
  BookOpen,
  Trophy,
  ArrowRight,
  Play,
  Sparkles,
  TrendingUp,
  Flame,
  Clock,
  AlertTriangle,
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

  // Check subscription status
  const [currentUser] = await db
    .select({
      expiresAt: user.expiresAt,
      activatedAt: user.activatedAt,
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
  const isSubscriptionActive = hasPremium && !isExpired;
  const expiresAt = currentUser?.expiresAt ? new Date(currentUser.expiresAt) : null;

  // Days remaining
  let daysRemaining = 0;
  if (expiresAt && isSubscriptionActive) {
    const diffMs = expiresAt.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  const planLabels: Record<string, string> = {
    MONTHLY: "Monthly",
    "6_MONTH": "6 Tháng",
    YEAR: "Năm",
  };

  // Fetch all published courses (accessible with active subscription)
  const publishedCourses = await db
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
    .where(eq(course.status, "PUBLISHED"))
    .orderBy(desc(course.createdAt));

  // Fetch modules and lessons for each course to show stats
  const courseIds = publishedCourses.map((c) => c.id);

  const modulesData = courseIds.length > 0
    ? await db
        .select({ courseId: module.courseId, moduleId: module.id })
        .from(module)
        .where(eq(module.courseId, courseIds[0]!))
    : [];

  const moduleIds = modulesData.map((m) => m.moduleId);
  const lessonsData = moduleIds.length > 0
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
      lessonsMap[parentModule.courseId] = (lessonsMap[parentModule.courseId] || 0) + 1;
    }
  }

  // Sample progress (random for now, replace with real studentProgress data when implemented)
  const sampleProgress: Record<string, number> = {};
  for (const c of publishedCourses) {
    sampleProgress[c.id] = Math.floor(Math.random() * 100);
  }

  const initials = getInitials(session.user.name ?? "HV");
  const avgProgress = publishedCourses.length > 0
    ? Math.round(
        publishedCourses.reduce(
          (acc, c) => acc + (sampleProgress[c.id] || 0),
          0
        ) / publishedCourses.length
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
              {isSubscriptionActive ? (
                <span>{planLabels[currentUser?.subscriptionPlan ?? ""] ?? currentUser?.subscriptionPlan} · {daysRemaining} ngày còn lại</span>
              ) : (
                <span>Tài khoản Free</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white">
              {getGreeting(session.user.name ?? "bạn")}
            </h1>
            <p className="text-sm text-white/60 max-w-md">
              {isSubscriptionActive
                ? "Bạn có quyền truy cập toàn bộ khóa học. Mỗi bài học hoàn thành là một bước tiến!"
                : "Gói hội viên của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục học."}
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
        {/* Card 1: Available courses */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 transition-colors group-hover:bg-indigo-100">
                <BookOpen className="size-4 text-indigo-600" />
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold tracking-tight text-slate-900">
                  {publishedCourses.length}
                </div>
                <div className="mt-0.5 text-xs text-slate-500 font-medium">
                  Khóa học có sẵn
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

        {/* Card 3: Subscription status */}
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 transition-colors group-hover:bg-amber-100">
                {isSubscriptionActive ? (
                  <Clock className="size-4 text-amber-600" />
                ) : (
                  <AlertTriangle className="size-4 text-red-600" />
                )}
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold tracking-tight text-slate-900">
                  {isSubscriptionActive ? `${daysRemaining}` : "Hết hạn"}
                  {isSubscriptionActive && (
                    <span className="text-lg text-slate-400 font-medium"> ngày</span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-slate-500 font-medium">
                  {isSubscriptionActive ? "Còn hiệu lực" : "Cần gia hạn"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-5 w-1 rounded-full"
                  style={{
                    height: `${12 + i * 4}px`,
                    backgroundColor: isSubscriptionActive
                      ? (i < Math.ceil(daysRemaining / 30) ? "#f59e0b" : "#e2e8f0")
                      : "#ef4444",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── COURSES SECTION ─── */}
      {publishedCourses.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-24 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-100 mb-5 shadow-inner">
            <BookOpen className="size-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-700 mb-1.5">
            Chưa có khóa học nào được xuất bản
          </h2>
          <p className="text-sm text-slate-500 mb-8 max-w-xs">
            Hiện tại chưa có khóa học nào trên hệ thống. Hãy quay lại sau nhé.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Section header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-100">
                <BookOpen className="size-3.5 text-indigo-600" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Khóa học có sẵn</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {publishedCourses.length}
              </span>
            </div>
            {isSubscriptionActive ? (
              <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Premium {planLabels[currentUser?.subscriptionPlan ?? ""] ?? currentUser?.subscriptionPlan} · {daysRemaining} ngày còn lại
              </span>
            ) : (
              <span
                className="rounded-lg bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
              >
                Tài khoản Free — Cần mua gói Premium
              </span>
            )}
          </div>

          {/* Course grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publishedCourses.map((courseItem) => {
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
