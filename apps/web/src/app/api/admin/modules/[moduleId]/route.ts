import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import * as adminService from "@/features/admin/services/admin-v2.service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ moduleId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { moduleId } = await context.params;
    const body = await request.json();
    const data = await adminService.updateAdminModule(moduleId, body);
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể cập nhật chương học");
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ moduleId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { moduleId } = await context.params;
    const data = await adminService.deleteAdminModule(moduleId);
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể xóa chương học");
  }
}
