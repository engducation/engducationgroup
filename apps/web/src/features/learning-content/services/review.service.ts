/**
 * Student Review Service
 * Handles review submission from students after completing courses
 */

import { db } from "@/db";
import { courseReview } from "@/db/schema/learning-content";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface CreateReviewInput {
  userId: string;
  courseId: string;
  rating: number;
  comment?: string;
}

export interface ReviewResponse {
  id: string;
  courseId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

/**
 * Check if a user has already reviewed a course
 */
export async function getUserReviewForCourse(userId: string, courseId: string) {
  const [review] = await db
    .select()
    .from(courseReview)
    .where(
      and(
        eq(courseReview.userId, userId),
        eq(courseReview.courseId, courseId)
      )
    );
  return review ?? null;
}

/**
 * Create a new review for a course
 */
export async function createCourseReview(input: CreateReviewInput): Promise<ReviewResponse> {
  // Check if user already reviewed this course
  const existing = await getUserReviewForCourse(input.userId, input.courseId);
  if (existing) {
    // Update existing review
    await db
      .update(courseReview)
      .set({
        rating: input.rating,
        comment: input.comment ?? null,
        updatedAt: new Date(),
      })
      .where(eq(courseReview.id, existing.id));

    const [updated] = await db
      .select()
      .from(courseReview)
      .where(eq(courseReview.id, existing.id));

    return {
      id: updated.id,
      courseId: updated.courseId,
      userId: updated.userId,
      rating: updated.rating,
      comment: updated.comment,
      createdAt: updated.createdAt,
    };
  }

  // Create new review
  const id = nanoid();
  await db.insert(courseReview).values({
    id,
    userId: input.userId,
    courseId: input.courseId,
    rating: input.rating,
    comment: input.comment ?? null,
    status: "VISIBLE",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [review] = await db
    .select()
    .from(courseReview)
    .where(eq(courseReview.id, id));

  return {
    id: review.id,
    courseId: review.courseId,
    userId: review.userId,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  };
}

/**
 * Get all reviews for a course
 */
export async function getCourseReviews(courseId: string) {
  return db.query.courseReview.findMany({
    where: eq(courseReview.courseId, courseId),
    orderBy: (review, { desc }) => [desc(review.createdAt)],
    with: {
      user: true,
    },
  });
}

/**
 * Get user's reviews
 */
export async function getUserReviews(userId: string) {
  return db.query.courseReview.findMany({
    where: eq(courseReview.userId, userId),
    orderBy: (review, { desc }) => [desc(review.createdAt)],
    with: {
      course: true,
    },
  });
}
