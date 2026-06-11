import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user, course, module, lesson, enrollment } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { CoursesClient } from "./courses-client";

async function getData() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Get user subscription info
  const [currentUser] = await db
    .select({
      subscriptionPlan: user.subscriptionPlan,
      expiresAt: user.expiresAt,
    })
    .from(user)
    .where(eq(user.id, userId));

  const isPremium = Boolean(
    currentUser?.subscriptionPlan &&
    currentUser.subscriptionPlan !== "FREE" &&
    (currentUser.expiresAt ? new Date(currentUser.expiresAt) > new Date() : false)
  );

  // Get all published courses with module and lesson counts
  const courses = await db.query.course.findMany({
    where: eq(course.status, "PUBLISHED"),
    with: {
      modules: {
        with: {
          lessons: true,
        },
      },
    },
  });

  // Transform to simpler format
  const courseList = courses.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    level: c.level,
    thumbnailUrl: c.thumbnailUrl,
    totalModules: c.modules?.length ?? 0,
    totalLessons: c.modules?.reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0) ?? 0,
  }));

  // Get enrolled course IDs if premium
  let enrolledCourseIds: string[] = [];
  if (isPremium) {
    const enrollments = await db
      .select({ courseId: enrollment.courseId })
      .from(enrollment)
      .where(eq(enrollment.userId, userId));

    enrolledCourseIds = enrollments.map((e) => e.courseId);
  }

  return {
    courses: courseList,
    enrolledCourseIds,
    isPremium,
  };
}

export default async function CoursesPage() {
  const { courses, enrolledCourseIds, isPremium } = await getData();

  return (
    <CoursesClient
      initialCourses={courses}
      enrolledCourseIds={enrolledCourseIds}
      isPremium={isPremium}
    />
  );
}
