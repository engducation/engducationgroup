import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import * as adminService from "@/features/admin/services/admin-v2.service";

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const { errorResponse, admin } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { orderId } = await context.params;
    const body = await request.json();
    const data = await adminService.rejectAdminOrder(orderId, body.reason, admin!.id);
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể từ chối đơn hàng");
  }
}
