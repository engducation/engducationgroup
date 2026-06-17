import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getOrderById } from "@/features/payment/services/order.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/payment/orders/[orderId]
// Trả về OrderSummary cho client polling. Có ownership check.
export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { orderId } = await context.params;
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId là bắt buộc" },
        { status: 400 },
      );
    }

    const order = await getOrderById(orderId, session.user.id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Đơn hàng không tồn tại" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, data: order },
      {
        // Triple defense cho Vercel Edge/CDN:
        //   1. dynamic = "force-dynamic" (đã có) — không cache ở data cache
        //   2. no-store — không lưu bất kỳ layer nào (browser, proxy, CDN)
        //   3. no-cache + must-revalidate — buộc revalidate ngay cả khi có stale entry
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, private",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error("GET /api/payment/orders/[orderId] error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi server" },
      { status: 500 },
    );
  }
}
