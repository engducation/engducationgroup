import { db } from "@/db";
import { courseReview } from "@/db/schema/learning-content";
import { eq, desc } from "drizzle-orm";

export async function getAdminReviews() {
  return db.query.courseReview.findMany({
    orderBy: [desc(courseReview.createdAt)],
    with: {
      user: true,
      course: true,
    },
  });
}

export async function getReviewById(reviewId: string) {
  return db.query.courseReview.findFirst({
    where: eq(courseReview.id, reviewId),
    with: {
      user: true,
      course: true,
    },
  });
}

export async function replyCourseReview(reviewId: string, reply: string) {
  await db
    .update(courseReview)
    .set({
      adminReply: reply,
      adminReplyAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(courseReview.id, reviewId));

  return db.query.courseReview.findFirst({ where: eq(courseReview.id, reviewId) });
}

export async function updateReviewStatus(reviewId: string, status: "VISIBLE" | "HIDDEN") {
  await db
    .update(courseReview)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(courseReview.id, reviewId));

  return db.query.courseReview.findFirst({ where: eq(courseReview.id, reviewId) });
}
