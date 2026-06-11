import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import * as adminService from "@/features/admin/services/admin-v2.service";

export async function GET(
  request: Request,
  context: { params: Promise<{ vocabularyId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { vocabularyId } = await context.params;
    const data = await adminService.updateLessonVocabulary(vocabularyId, {});
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể lấy thông tin từ vựng");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ vocabularyId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { vocabularyId } = await context.params;
    const body = await request.json();
    const data = await adminService.updateLessonVocabulary(vocabularyId, body);
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể cập nhật từ vựng");
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ vocabularyId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { vocabularyId } = await context.params;
    const data = await adminService.deleteLessonVocabulary(vocabularyId);
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể xóa từ vựng");
  }
}
