import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import { getSepayAdminAnalytics } from "@/features/payment/services/admin-order.service";

export async function GET() {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const analytics = await getSepayAdminAnalytics();
    return apiOk({
      totalRevenue: analytics.totalRevenue,
      successOrders: analytics.successCount,
      pendingOrders: analytics.pendingCount,
      failedOrders: analytics.failedCount,
    });
  } catch (error) {
    return apiError(error, "Không thể lấy phân tích đơn hàng");
  }
}
