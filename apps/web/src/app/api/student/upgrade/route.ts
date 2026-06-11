import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { simulatePremiumUpgrade, PACKAGE_TYPES } from "@/features/enrollment/services/upgrade.service";

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
    const { packageType } = body;

    // Default to MONTHLY if not specified
    const selectedPackage = PACKAGE_TYPES.includes(packageType) ? packageType : "MONTHLY";

    // Step 3: Process upgrade (Action 1 + 2 + 3)
    const result = await simulatePremiumUpgrade(userId, selectedPackage);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      transactionId: result.transactionId,
      newExpiresAt: result.newExpiresAt,
      message: "Nâng cấp tài khoản Premium thành công!",
    });
  } catch (error) {
    console.error("Upgrade API error:", error);
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

    // Get current subscription info
    const { getCurrentSubscriptionInfo } = await import("@/features/enrollment/services/upgrade.service");
    const info = await getCurrentSubscriptionInfo(userId);

    return NextResponse.json({
      success: true,
      subscriptionPlan: info.subscriptionPlan,
      expiresAt: info.expiresAt,
      isActive: info.isActive,
    });
  } catch (error) {
    console.error("Subscription info API error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi server khi xử lý yêu cầu" },
      { status: 500 }
    );
  }
}
