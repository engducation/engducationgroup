import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  cancelOrder,
  getOrderByIdAdmin,
} from "@/features/payment/services/order.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/payment/orders/[orderId]/cancel
//
// Học viên tự hủy đơn PENDING ngay trên UI thanh toán (không phải đợi hết
// 15 phút). Endpoint này set status = EXPIRED trong DB, sau đó client có
// thể navigate về /upgrade để tạo đơn mới.
//
// Auth: chỉ chủ sở hữu order mới được cancel (ownership check).
// Idempotent: nếu order không còn PENDING (đã SUCCESS / EXPIRED / FAILED)
// → trả về 200 với data.status hiện tại, KHÔNG throw lỗi.
export async function POST(
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

    // Ownership check: dùng getOrderByIdAdmin (no ownership) rồi so sánh userId.
    // Tránh race vì cancelOrder cũng check `status = PENDING` trong WHERE.
    const order = await getOrderByIdAdmin(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Đơn hàng không tồn tại" },
        { status: 404 },
      );
    }
    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Bạn không có quyền hủy đơn hàng này" },
        { status: 403 },
      );
    }

    const result = await cancelOrder(orderId);
    if (!result) {
      // Order không còn PENDING (đã SUCCESS/EXPIRED/FAILED) — idempotent OK.
      return NextResponse.json(
        {
          success: true,
          data: { orderId, status: order.status },
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, private",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );
    }

    return NextResponse.json(
      { success: true, data: { orderId: result.id, status: result.status } },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, private",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error("POST /api/payment/orders/[orderId]/cancel error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi server" },
      { status: 500 },
    );
  }
}
