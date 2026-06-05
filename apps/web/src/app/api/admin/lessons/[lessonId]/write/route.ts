import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import * as adminService from "@/features/admin/services/admin-v2.service";

export async function PUT(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { lessonId } = await context.params;
    const body = await request.json();
    const data = await adminService.upsertAdminLessonWrite(lessonId, body);
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể lưu bài viết");
  }
}
