import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import * as adminService from "@/features/admin/services/admin-v2.service";

export async function POST(
  request: Request,
  context: { params: Promise<{ reviewId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { reviewId } = await context.params;
    const body = await request.json();
    const data = await adminService.replyCourseReview(reviewId, body.reply);
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể phản hồi đánh giá");
  }
}
