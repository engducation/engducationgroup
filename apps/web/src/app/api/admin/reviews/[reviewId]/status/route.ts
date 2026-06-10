import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import * as adminService from "@/features/admin/services/admin-v2.service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ reviewId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { reviewId } = await context.params;
    const body = await request.json();
    const data = await adminService.updateReviewStatus(reviewId, body.status);
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể cập nhật trạng thái đánh giá");
  }
}
