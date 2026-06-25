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
import {
  validateVoucher,
  applyVoucher,
} from "@/features/payment/services/pricing.service";
import type { PackageType } from "@/db/schema";

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
// Body: { packageType: "MONTHLY" | "6_MONTH" | "YEAR", voucherCode?: string }
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

    let voucherCode: string | undefined;
    let discountAmount = 0;

    // Validate voucher if provided
    if (input.voucherCode) {
      const validation = await validateVoucher(
        input.voucherCode,
        input.packageType as PackageType,
      );

      if (!validation.valid || !validation.voucher) {
        return NextResponse.json(
          { success: false, error: validation.invalidReason || "Voucher không hợp lệ" },
          { status: 400, headers: NO_CACHE_HEADERS },
        );
      }

      // Get package price from order service to calculate discount
      // Note: We'll get the price and apply discount after order creation
      voucherCode = input.voucherCode;
    }

    const { order } = await createSepayOrder({
      userId: session.user.id,
      packageType: input.packageType,
      voucherCode,
    });

    // If voucher was applied, recalculate the amount
    if (voucherCode && order) {
      // Get the discount
      const validation = await validateVoucher(voucherCode, input.packageType as PackageType);
      if (validation.valid && validation.voucher) {
        const { discountAmount: discount } = applyVoucher(validation.voucher, order.amount);
        discountAmount = discount;

        // Note: The order amount is not modified - voucher is tracked separately
        // The discount will be reflected when displaying the order or in a separate voucher_usage record
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...order,
          appliedVoucher: voucherCode,
          discountAmount,
        }
      },
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
