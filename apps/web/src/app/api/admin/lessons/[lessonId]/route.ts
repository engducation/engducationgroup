import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import * as adminService from "@/features/admin/services/admin-v2.service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { lessonId } = await context.params;
    // Use getLessonContent to include all related records (read, write, video, quiz, vocabulary)
    const data = await adminService.getLessonContent(lessonId);
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể lấy thông tin bài học");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { lessonId } = await context.params;
    const body = await request.json();
    const data = await adminService.updateAdminLesson(lessonId, body);
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể cập nhật bài học");
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { lessonId } = await context.params;
    const data = await adminService.deleteAdminLesson(lessonId);
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể xóa bài học");
  }
}
