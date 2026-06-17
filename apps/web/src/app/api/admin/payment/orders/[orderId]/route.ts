import { NextRequest, NextResponse } from "next/server";
import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import { getSepayOrderDetailForAdmin } from "@/features/payment/services/admin-order.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ orderId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { orderId } = await context.params;
    const order = await getSepayOrderDetailForAdmin(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return apiOk(order);
  } catch (error) {
    return apiError(error, "Không thể lấy chi tiết đơn SePay");
  }
}
