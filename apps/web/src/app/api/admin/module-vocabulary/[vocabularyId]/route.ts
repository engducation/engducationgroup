import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import * as adminService from "@/features/admin/services/admin-v2.service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ vocabularyId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { vocabularyId } = await context.params;
    const body = await request.json();
    const data = await adminService.updateAdminModuleVocabulary(vocabularyId, body);
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể cập nhật vocabulary");
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ vocabularyId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { vocabularyId } = await context.params;
    const data = await adminService.deleteAdminModuleVocabulary(vocabularyId);
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể xóa vocabulary");
  }
}
