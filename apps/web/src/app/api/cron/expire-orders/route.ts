import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/env";
import { expirePendingOrders } from "@/features/payment/services/order.service";

/**
 * Vercel Cron sẽ gọi endpoint này mỗi 5 phút:
 *   vercel.json: { "crons": [{ "path": "/api/cron/expire-orders", "schedule": "* /5 * * * *" }] }
 *
 * Bảo vệ: so sánh header `Authorization: Bearer <CRON_SECRET>` qua `timingSafeEqual`
 * để chống brute-force. Vercel tự thêm header này khi gọi cron.
 *
 * Lưu ý: mình dùng NextResponse.json để trả JSON rõ ràng → dễ monitor ở Vercel logs.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const NOOP_SECRET = ""; // fallback nếu env chưa set (dev)

function isCronAuthorized(request: NextRequest): boolean {
  const expected = env.CRON_SECRET || NOOP_SECRET;
  if (!expected) {
    // Không có secret → cho qua nhưng log warning. Trong prod PHẢI set CRON_SECRET.
    return true;
  }
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = new Date();
  try {
    const expiredCount = await expirePendingOrders(startedAt);
    return NextResponse.json({
      success: true,
      data: {
        ranAt: startedAt.toISOString(),
        expiredCount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        ranAt: startedAt.toISOString(),
      },
      { status: 500 },
    );
  }
}
