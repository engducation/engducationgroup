import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import * as adminService from "@/features/admin/services/admin-v2.service";

const VALIDATION_ERROR_KEYWORDS = [
  "phải có",
  "không thể",
  "invalid",
  "not found",
  "already",
  "duplicate",
  "required",
  "must have",
];

function isValidationError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return VALIDATION_ERROR_KEYWORDS.some((keyword) => message.toLowerCase().includes(keyword));
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { courseId } = await context.params;
    const data = await adminService.archiveAdminCourse(courseId);
    return apiOk(data);
  } catch (error) {
    const status = isValidationError(error) ? 400 : 500;
    return apiError(error, "Không thể archive khóa học", status);
  }
}
