import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import * as adminService from "@/features/admin/services/admin-v2.service";

export async function GET() {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const data = await adminService.getAdminOrderAnalytics();
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể lấy phân tích đơn hàng");
  }
}
