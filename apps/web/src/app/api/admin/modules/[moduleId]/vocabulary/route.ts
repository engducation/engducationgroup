import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import * as adminService from "@/features/admin/services/admin-v2.service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ moduleId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { moduleId } = await context.params;
    const data = await adminService.getAdminModuleVocabulary(moduleId);
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể lấy vocabulary theo chương");
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ moduleId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { moduleId } = await context.params;
    const body = await request.json();
    const data = await adminService.createAdminModuleVocabulary({ ...body, moduleId });
    return apiOk(data, { status: 201 });
  } catch (error) {
    return apiError(error, "Không thể tạo vocabulary");
  }
}
