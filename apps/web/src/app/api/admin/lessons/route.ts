import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import * as adminService from "@/features/admin/services/admin-v2.service";

export async function POST(request: Request) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const data = await adminService.createAdminLesson(body);
    return apiOk(data, { status: 201 });
  } catch (error) {
    return apiError(error, "Không thể tạo bài học");
  }
}
