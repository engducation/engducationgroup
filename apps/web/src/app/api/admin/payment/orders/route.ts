import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError, apiOk, requireAdminRequest } from "@/features/admin/api/route-helpers";
import {
  getSepayAdminAnalytics,
  listSepayOrdersForAdmin,
} from "@/features/payment/services/admin-order.service";
import { orderStatusSchema } from "@/features/payment/types/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const filtersSchema = z.object({
  status: orderStatusSchema.or(z.literal("ALL")).default("ALL"),
  search: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAdminRequest();
  if (errorResponse) return errorResponse;

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = filtersSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid filters", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const [orders, analytics] = await Promise.all([
      listSepayOrdersForAdmin(parsed.data),
      getSepayAdminAnalytics(),
    ]);
    return apiOk({ rows: orders.rows, total: orders.total, analytics });
  } catch (error) {
    return apiError(error, "Không thể lấy danh sách đơn SePay");
  }
}
