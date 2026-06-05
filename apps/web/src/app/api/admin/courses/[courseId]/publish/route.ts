import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import * as adminService from "@/features/admin/services/admin-v2.service";

export async function POST(
  _request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { courseId } = await context.params;
    const data = await adminService.publishAdminCourse(courseId);
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể publish khóa học");
  }
}
