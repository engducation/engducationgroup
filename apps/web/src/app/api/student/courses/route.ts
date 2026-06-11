import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getPublishedCoursesList, getEnrolledCourses, hasActivePremiumSubscription } from "@/features/enrollment/services/enrollment.service";

export async function GET(request: Request) {
  try {
    // Step 1: Authenticate user
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "all"; // "all" | "enrolled"

    // Get subscription status
    const isPremium = await hasActivePremiumSubscription(userId);

    // Get published courses
    const publishedCourses = await getPublishedCoursesList();

    // Get enrolled courses if user is premium
    let enrolledCourses: string[] = [];
    if (isPremium) {
      const enrolled = await getEnrolledCourses(userId);
      enrolledCourses = enrolled.map((e) => e.id);
    }

    // Filter based on mode
    let courses = publishedCourses;
    if (mode === "enrolled" && isPremium) {
      courses = publishedCourses.filter((c) => enrolledCourses.includes(c.id));
    }

    return NextResponse.json({
      success: true,
      courses,
      isPremium,
      enrolledCourseIds: enrolledCourses,
    });
  } catch (error) {
    console.error("Courses API error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi server khi xử lý yêu cầu" },
      { status: 500 }
    );
  }
}
