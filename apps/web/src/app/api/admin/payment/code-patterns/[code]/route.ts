import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { paymentCodePatterns } from "@/db/schema";
import {
  apiError,
  apiOk,
  requireAdminRequest,
} from "@/features/admin/api/route-helpers";
import { invalidatePatternCache } from "@/features/payment/services/order-code-pattern.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ code: string }>;
}

// PATCH /api/admin/payment/code-patterns/[code]
// Cập nhật 1 pattern. Cho phép đổi description / randomLength / isActive.
// KHÔNG cho đổi `code` (vì nếu đã có orders dùng code cũ sẽ bị gãy).
const updateSchema = z.object({
  description: z.string().trim().max(500).optional().nullable(),
  randomLength: z
    .number()
    .int()
    .min(6, "Tối thiểu 6 số")
    .max(10, "Tối đa 10 số")
    .optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  const { code } = await context.params;
  const codeUpper = code.toUpperCase();

  try {
    const body = (await request.json().catch(() => null)) as unknown;
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const updates: Partial<{
      description: string | null;
      randomLength: number;
      isActive: number;
    }> = {};
    if (parsed.data.description !== undefined) {
      updates.description = parsed.data.description;
    }
    if (parsed.data.randomLength !== undefined) {
      updates.randomLength = parsed.data.randomLength;
    }
    if (parsed.data.isActive !== undefined) {
      updates.isActive = parsed.data.isActive ? 1 : 0;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Không có trường nào để cập nhật" },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(paymentCodePatterns)
      .set(updates)
      .where(eq(paymentCodePatterns.code, codeUpper))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: `Pattern "${codeUpper}" không tồn tại` },
        { status: 404 },
      );
    }

    invalidatePatternCache();
    return apiOk({
      code: updated.code,
      description: updated.description,
      randomLength: updated.randomLength,
      isActive: updated.isActive === 1,
    });
  } catch (err) {
    return apiError(err, "Failed to update payment code pattern");
  }
}

// DELETE /api/admin/payment/code-patterns/[code]
// Soft-delete: set isActive = 0. KHÔNG xóa cứng để giữ audit cho orders cũ.
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  const { code } = await context.params;
  const codeUpper = code.toUpperCase();

  try {
    const [updated] = await db
      .update(paymentCodePatterns)
      .set({ isActive: 0 })
      .where(eq(paymentCodePatterns.code, codeUpper))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: `Pattern "${codeUpper}" không tồn tại` },
        { status: 404 },
      );
    }

    invalidatePatternCache();
    return apiOk({ code: updated.code, isActive: false });
  } catch (err) {
    return apiError(err, "Failed to soft-delete payment code pattern");
  }
}
