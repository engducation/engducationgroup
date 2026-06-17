import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import { manualApproveSepayOrder } from "@/features/payment/services/sepay-webhook.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  amount: z.number().int().positive().optional(),
  gateway: z.string().min(1).max(50).optional(),
  note: z.string().trim().max(500).optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> },
) {
  const { errorResponse, admin } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  let body: z.infer<typeof bodySchema> = {};
  try {
    const text = await request.text();
    body = text ? bodySchema.parse(JSON.parse(text)) : {};
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid body", details: err.flatten() },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const { orderId } = await context.params;
    const result = await manualApproveSepayOrder({
      orderId,
      adminId: admin!.id,
      amount: body.amount,
      gateway: body.gateway,
      note: body.note,
    });
    return apiOk(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    // 409 Conflict nếu order ở status không phù hợp.
    const isBusinessError =
      message.includes("already settled") ||
      message.includes("non-approvable") ||
      message.includes("less than order amount");
    return NextResponse.json(
      { error: message },
      { status: isBusinessError ? 409 : 500 },
    );
  }
}
