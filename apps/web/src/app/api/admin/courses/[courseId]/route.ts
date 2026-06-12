import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import * as adminService from "@/features/admin/services/admin-v2.service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { courseId } = await context.params;
    const data = await adminService.getAdminCourseById(courseId);
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể lấy thông tin khóa học");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { courseId } = await context.params;
    const body = await request.json();
    const data = await adminService.updateAdminCourse(courseId, body);
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể cập nhật khóa học");
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { courseId } = await context.params;
    const data = await adminService.deleteAdminCourse(courseId);
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể xóa khóa học");
  }
}
