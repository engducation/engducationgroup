import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  createOrderSchema,
  type CreateOrderInput,
} from "@/features/payment/types/schemas";
import {
  createSepayOrder,
  listUserOrders,
} from "@/features/payment/services/order.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Headers chống cache cho mọi response của payment API.
// Áp dụng cho cả POST (create order) và GET (list/detail) để đảm bảo
// sau khi webhook settle, polling request kế tiếp LUÔN thấy status mới.
const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  Expires: "0",
} as const;

// POST /api/payment/orders
// Body: { packageType: "MONTHLY" | "6_MONTH" | "YEAR" }
// Trả về OrderSummary (kèm qrUrl, expiresAt, bank info).
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401, headers: NO_CACHE_HEADERS },
      );
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "packageType không hợp lệ" },
        { status: 400, headers: NO_CACHE_HEADERS },
      );
    }
    const input: CreateOrderInput = parsed.data;

    const { order } = await createSepayOrder({
      userId: session.user.id,
      packageType: input.packageType,
    });

    return NextResponse.json(
      { success: true, data: order },
      { status: 201, headers: NO_CACHE_HEADERS },
    );
  } catch (error) {
    console.error("POST /api/payment/orders error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi server khi tạo đơn hàng" },
      { status: 500, headers: NO_CACHE_HEADERS },
    );
  }
}

// GET /api/payment/orders
// Trả về danh sách order gần đây của user hiện tại.
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401, headers: NO_CACHE_HEADERS },
      );
    }

    const items = await listUserOrders(session.user.id);
    return NextResponse.json(
      { success: true, data: items },
      { headers: NO_CACHE_HEADERS },
    );
  } catch (error) {
    console.error("GET /api/payment/orders error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi server khi lấy danh sách đơn" },
      { status: 500, headers: NO_CACHE_HEADERS },
    );
  }
}
