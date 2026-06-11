import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import * as adminService from "@/features/admin/services/admin-v2.service";

export async function GET(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { lessonId } = await context.params;
    const data = await adminService.getVocabulariesByLesson(lessonId);
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể lấy danh sách từ vựng");
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { lessonId } = await context.params;
    const body = await request.json();
    const data = await adminService.createLessonVocabulary(lessonId, body);
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể tạo từ vựng");
  }
}
