import { NextResponse } from "next/server";
import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import { reorderLessonsInDb } from "@/features/learning-content/services/order.service";

export async function POST(
  request: Request,
  context: { params: Promise<{ moduleId: string }> },
) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const { moduleId } = await context.params;
    const body = await request.json();
    const { lessons } = body as {
      lessons: Array<{ id: string; orderIndex: number }>;
    };

    if (!lessons || !Array.isArray(lessons) || lessons.length === 0) {
      return NextResponse.json(
        { error: "Danh sách bài học không hợp lệ" },
        { status: 400 }
      );
    }

    // Extract ordered IDs from the lessons array
    const orderedIds = lessons.map((item) => item.id);

    // Use the reorder function from order.service.ts
    await reorderLessonsInDb(moduleId, 0, "reorder", orderedIds);

    return apiOk({ success: true, moduleId, lessonCount: orderedIds.length });
  } catch (error) {
    return apiError(error, "Không thể cập nhật thứ tự bài học");
  }
}
