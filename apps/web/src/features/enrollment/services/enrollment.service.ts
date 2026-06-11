import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { enrollment, course, module, lesson } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EnrollmentResult {
  success: boolean;
  error?: string;
  enrollmentId?: string;
}

export interface EnrolledCourseInfo {
  id: string;
  title: string;
  description: string | null;
  level: string;
  thumbnailUrl: string | null;
  totalModules: number;
  totalLessons: number;
  enrolledAt: Date;
}

export interface PublishedCourseInfo {
  id: string;
  title: string;
  description: string | null;
  level: string;
  thumbnailUrl: string | null;
  totalModules: number;
  totalLessons: number;
}

// ─── Helper: Check if user has active Premium subscription ─────────────────────

export async function hasActivePremiumSubscription(userId: string): Promise<boolean> {
  const [currentUser] = await db
    .select({
      subscriptionPlan: user.subscriptionPlan,
      expiresAt: user.expiresAt,
    })
    .from(user)
    .where(eq(user.id, userId));

  if (!currentUser) return false;

  const isPremium = Boolean(currentUser.subscriptionPlan) && currentUser.subscriptionPlan !== "FREE";
  const isNotExpired = currentUser.expiresAt ? new Date(currentUser.expiresAt) > new Date() : false;

  return Boolean(isPremium && isNotExpired);
}

// ─── Helper: Get user's enrollment status for a course ────────────────────────

export async function getUserEnrollmentStatus(
  userId: string,
  courseId: string
): Promise<boolean> {
  const [existing] = await db
    .select({ id: enrollment.id })
    .from(enrollment)
    .where(
      and(
        eq(enrollment.userId, userId),
        eq(enrollment.courseId, courseId)
      )
    );

  return !!existing;
}

// ─── Helper: Get all enrolled courses for a user ───────────────────────────────

export async function getEnrolledCourses(userId: string): Promise<EnrolledCourseInfo[]> {
  const enrollments = await db.query.enrollment.findMany({
    where: eq(enrollment.userId, userId),
    with: {
      course: {
        with: {
          modules: {
            with: {
              lessons: true,
            },
          },
        },
      },
    },
  });

  return enrollments.map((e) => ({
    id: e.courseId,
    title: e.course.title,
    description: e.course.description,
    level: e.course.level,
    thumbnailUrl: e.course.thumbnailUrl,
    totalModules: e.course.modules?.length ?? 0,
    totalLessons: (e.course.modules ?? []).reduce((acc, m) => acc + ((m.lessons as unknown as { length: number }[] | undefined)?.length ?? 0), 0),
    enrolledAt: e.enrolledAt,
  }));
}

// ─── Helper: Get all published courses ────────────────────────────────────────

export async function getPublishedCoursesList(): Promise<PublishedCourseInfo[]> {
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

  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    level: c.level,
    thumbnailUrl: c.thumbnailUrl,
    totalModules: c.modules?.length ?? 0,
    totalLessons: (c.modules ?? []).reduce((acc, m) => acc + ((m.lessons as unknown as { length: number }[] | undefined)?.length ?? 0), 0),
  }));
}

// ─── Main: Enroll in a course ──────────────────────────────────────────────────

export async function enrollInCourse(
  userId: string,
  courseId: string
): Promise<EnrollmentResult> {
  // Step 1: Verify user exists
  const [currentUser] = await db
    .select({
      id: user.id,
      subscriptionPlan: user.subscriptionPlan,
      expiresAt: user.expiresAt,
    })
    .from(user)
    .where(eq(user.id, userId));

  if (!currentUser) {
    return { success: false, error: "Người dùng không tồn tại" };
  }

  // Step 2: Verify course exists and is published
  const [targetCourse] = await db
    .select({ id: course.id, status: course.status })
    .from(course)
    .where(eq(course.id, courseId));

  if (!targetCourse) {
    return { success: false, error: "Khóa học không tồn tại" };
  }

  if (targetCourse.status !== "PUBLISHED") {
    return { success: false, error: "Khóa học chưa được xuất bản" };
  }

  // Step 3: Check subscription plan
  const isPremium = Boolean(currentUser.subscriptionPlan) && currentUser.subscriptionPlan !== "FREE";
  const isNotExpired = currentUser.expiresAt ? new Date(currentUser.expiresAt) > new Date() : false;

  if (!isPremium || !isNotExpired) {
    return {
      success: false,
      error: "PREMIUM_REQUIRED",
    };
  }

  // Step 4: Check if already enrolled
  const [existingEnrollment] = await db
    .select({ id: enrollment.id })
    .from(enrollment)
    .where(
      and(
        eq(enrollment.userId, userId),
        eq(enrollment.courseId, courseId)
      )
    );

  if (existingEnrollment) {
    return { success: true, enrollmentId: existingEnrollment.id };
  }

  // Step 5: Create enrollment
  const enrollmentId = nanoid();
  await db.insert(enrollment).values({
    id: enrollmentId,
    userId,
    courseId,
  });

  return { success: true, enrollmentId };
}

// ─── Get enrollment by course ───────────────────────────────────────────────────

export async function getEnrollmentByCourse(
  userId: string,
  courseId: string
): Promise<EnrolledCourseInfo | null> {
  const [existing] = await db
    .select({
      id: enrollment.id,
      courseId: enrollment.courseId,
      enrolledAt: enrollment.enrolledAt,
    })
    .from(enrollment)
    .innerJoin(course, eq(enrollment.courseId, course.id))
    .where(
      and(
        eq(enrollment.userId, userId),
        eq(enrollment.courseId, courseId)
      )
    );

  if (!existing) return null;

  const courseData = await db.query.course.findFirst({
    where: eq(course.id, courseId),
    with: {
      modules: {
        with: {
          lessons: true,
        },
      },
    },
  });

  if (!courseData) return null;

  const modules = courseData.modules ?? [];

  return {
    id: courseData.id,
    title: courseData.title,
    description: courseData.description,
    level: courseData.level,
    thumbnailUrl: courseData.thumbnailUrl,
    totalModules: modules.length,
    totalLessons: modules.reduce((acc, m) => acc + ((m.lessons as unknown as { length: number }[] | undefined)?.length ?? 0), 0),
    enrolledAt: existing.enrolledAt,
  };
}
