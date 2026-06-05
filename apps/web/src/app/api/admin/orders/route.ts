import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import * as adminService from "@/features/admin/services/admin-v2.service";

export async function GET() {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const data = await adminService.getAdminOrders();
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể lấy danh sách đơn hàng");
  }
}

export async function POST(request: Request) {
  const { errorResponse, admin } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const data = await adminService.createAdminManualOrder(body.userId, body.courseId, body.amount, admin!.id);
    return apiOk(data, { status: 201 });
  } catch (error) {
    return apiError(error, "Không thể tạo đơn hàng thủ công");
  }
}
