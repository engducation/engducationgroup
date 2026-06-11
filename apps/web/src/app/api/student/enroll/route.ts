import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { enrollInCourse, hasActivePremiumSubscription } from "@/features/enrollment/services/enrollment.service";

export async function POST(request: Request) {
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

    // Step 2: Parse request body
    const body = await request.json();
    const { courseId } = body;

    if (!courseId || typeof courseId !== "string") {
      return NextResponse.json(
        { success: false, error: "courseId là bắt buộc" },
        { status: 400 }
      );
    }

    // Step 3: Check subscription plan FIRST (before enrollment)
    const isPremium = await hasActivePremiumSubscription(userId);
    if (!isPremium) {
      return NextResponse.json(
        {
          success: false,
          error: "PREMIUM_REQUIRED",
          message: "Khóa học này chỉ dành cho thành viên Premium. Vui lòng nâng cấp tài khoản để bắt đầu học tập.",
        },
        { status: 403 }
      );
    }

    // Step 4: Proceed with enrollment
    const result = await enrollInCourse(userId, courseId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      enrollmentId: result.enrollmentId,
      message: "Đăng ký khóa học thành công!",
    });
  } catch (error) {
    console.error("Enrollment API error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi server khi xử lý yêu cầu" },
      { status: 500 }
    );
  }
}

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
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "courseId là bắt buộc" },
        { status: 400 }
      );
    }

    // Check enrollment status
    const { getUserEnrollmentStatus } = await import("@/features/enrollment/services/enrollment.service");
    const isEnrolled = await getUserEnrollmentStatus(userId, courseId);

    // Check subscription status
    const isPremium = await hasActivePremiumSubscription(userId);

    return NextResponse.json({
      success: true,
      isEnrolled,
      isPremium,
    });
  } catch (error) {
    console.error("Enrollment check API error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi server khi xử lý yêu cầu" },
      { status: 500 }
    );
  }
}
