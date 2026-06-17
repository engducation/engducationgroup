import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSepayOrder } from "@/features/payment/services/order.service";

/**
 * Backward-compatible upgrade endpoint — chuyển sang SePay flow.
 *
 * Flow cũ (simulate ngay tức thì) đã được thay bằng flow mới (tạo order → trả
 * về orderId, frontend tự navigate sang /upgrade/[orderId] để hiển thị QR).
 * Endpoint này giữ lại để không vỡ bất kỳ client cũ nào đang gọi.
 */

const bodySchema = z.object({
  packageType: z.enum(["MONTHLY", "6_MONTH", "YEAR"]).default("MONTHLY"),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  let body: z.infer<typeof bodySchema> = { packageType: "MONTHLY" };
  try {
    const text = await request.text();
    if (text) body = bodySchema.parse(JSON.parse(text));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid body" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  try {
    const { order } = await createSepayOrder({
      userId: session.user.id,
      packageType: body.packageType,
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        orderCode: order.orderCode,
        qrUrl: order.qrUrl,
        expiresAt: order.expiresAt,
        checkoutUrl: `/upgrade/${order.id}`,
        message: "Đơn hàng đã được tạo. Vui lòng chuyển hướng tới trang QR.",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Lỗi server khi xử lý yêu cầu",
      },
      { status: 500 },
    );
  }
}
