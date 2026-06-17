import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { paymentCodePatterns } from "@/db/schema";
import {
  apiError,
  apiOk,
  requireAdminRequest,
} from "@/features/admin/api/route-helpers";
import {
  getActivePatterns,
  invalidatePatternCache,
  isValidPatternCode,
} from "@/features/payment/services/order-code-pattern.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/payment/code-patterns
// Trả về toàn bộ patterns (cả active lẫn inactive) cho admin UI.
export async function GET() {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const rows = await db
      .select()
      .from(paymentCodePatterns)
      .orderBy(paymentCodePatterns.code);

    return apiOk({
      items: rows.map((r) => ({
        code: r.code,
        description: r.description,
        randomLength: r.randomLength,
        isActive: r.isActive === 1,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      active: (await getActivePatterns()).length,
    });
  } catch (err) {
    return apiError(err, "Failed to list payment code patterns");
  }
}

// POST /api/admin/payment/code-patterns
// Tạo pattern mới. Validate format code.
const createSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(10)
    .transform((s) => s.toUpperCase())
    .refine(isValidPatternCode, {
      message: "Code chỉ gồm chữ in hoa và số (A-Z, 0-9), dài 3-10 ký tự",
    }),
  description: z.string().trim().max(500).optional().nullable(),
  randomLength: z
    .number()
    .int()
    .min(6, "Tối thiểu 6 số")
    .max(10, "Tối đa 10 số")
    .default(8),
  isActive: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  try {
    const body = (await request.json().catch(() => null)) as unknown;
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { code, description, randomLength, isActive } = parsed.data;
    const [inserted] = await db
      .insert(paymentCodePatterns)
      .values({
        code,
        description: description ?? null,
        randomLength,
        isActive: isActive ? 1 : 0,
      })
      .onConflictDoNothing()
      .returning();

    if (!inserted) {
      return NextResponse.json(
        { error: `Pattern "${code}" đã tồn tại` },
        { status: 409 },
      );
    }

    invalidatePatternCache();
    return apiOk(
      {
        code: inserted.code,
        description: inserted.description,
        randomLength: inserted.randomLength,
        isActive: inserted.isActive === 1,
      },
      { status: 201 },
    );
  } catch (err) {
    return apiError(err, "Failed to create payment code pattern");
  }
}
