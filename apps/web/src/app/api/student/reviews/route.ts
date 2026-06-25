import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createCourseReview, getUserReviewForCourse } from "@/features/learning-content/services/review.service";

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { courseId, rating, comment } = body;

    if (!courseId || !rating) {
      return Response.json(
        { error: "courseId and rating are required" },
        { status: 400 }
      );
    }

    // Validate rating
    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return Response.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const review = await createCourseReview({
      userId: session.user.id,
      courseId,
      rating: ratingNum,
      comment: comment?.trim() || undefined,
    });

    return Response.json({ success: true, review });
  } catch (error) {
    console.error("Error creating review:", error);
    return Response.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");

  try {
    if (courseId) {
      // Get user's review for a specific course
      const review = await getUserReviewForCourse(session.user.id, courseId);
      return Response.json({ review });
    }

    // Get all user's reviews
    const { getUserReviews } = await import("@/features/learning-content/services/review.service");
    const reviews = await getUserReviews(session.user.id);
    return Response.json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return Response.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
