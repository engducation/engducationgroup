import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import {
  getSepayAdminAnalytics,
  listSepayOrdersForAdmin,
} from "@/features/payment/services/admin-order.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Backward-compatible admin orders list.
 * Trỏ sang SePay service thay vì packageOrder legacy.
 */

export async function GET(request: Request) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const url = new URL(request.url);
    const status = (url.searchParams.get("status") as "ALL" | "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED") || "ALL";
    const limit = Number(url.searchParams.get("limit") ?? 100);
    const [orders, analytics] = await Promise.all([
      listSepayOrdersForAdmin({ status, limit }),
      getSepayAdminAnalytics(),
    ]);
    return apiOk({ ...orders, analytics });
  } catch (error) {
    return apiError(error, "Không thể lấy danh sách đơn hàng");
  }
}
