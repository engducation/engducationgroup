import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import * as adminService from "@/features/admin/services/admin-v2.service";

export async function POST(
  request: Request,
  context: { params: Promise<{ lessonId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { lessonId } = await context.params;
    const body = await request.json();
    const vocabularyList = body.vocabulary || [];
    const data = await adminService.syncLessonVocabulary(lessonId, vocabularyList);
    return apiOk(data);
  } catch (error) {
    return apiError(error, "Không thể đồng bộ từ vựng");
  }
}
