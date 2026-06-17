import { NextResponse } from "next/server";
import {
  getSignatureFromHeaders,
  processSepayWebhook,
} from "@/features/payment/services/sepay-webhook.service";

export const runtime = "nodejs";          // cần Node crypto + drizzle-orm/neon-http WebSocket
export const dynamic = "force-dynamic";   // không cache
export const maxDuration = 30;             // SePay timeout 30s

// POST /api/payment/sepay-webhook
//
// Endpoint nhận tín hiệu biến động số dư từ SePay.
//
// Response contract (SePay yêu cầu):
//   - Thành công: HTTP 200 + body {"success": true}
//   - Signature invalid: HTTP 403 (SePay sẽ retry với backoff Fibonacci)
//   - Payload invalid: HTTP 400
//   - Lỗi server: HTTP 500 (SePay sẽ retry)
//
// KHÔNG đăng nhập chi tiết khi signature sai (PAYMENT_SYSTEM.md §4 Bước 1:
// chống log spam → DDoS).
export async function POST(request: Request) {
  // Đọc raw body TRƯỚC (PHẢI dùng request.text() để giữ nguyên chuỗi cho HMAC).
  const rawBody = await request.text();
  const signature = getSignatureFromHeaders(request.headers);

  const result = await processSepayWebhook({ rawBody, signature });

  switch (result.kind) {
    case "ok":
      // Kể cả đã xử lý trước đó, vẫn trả success để SePay không retry.
      return NextResponse.json({ success: true });

    case "signature_invalid":
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 403 },
      );

    case "invalid_payload":
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );

    case "order_not_found":
      // 200 để SePay không retry, nhưng log để admin biết có giao dịch không match.
      console.warn(
        "SePay webhook: order not found for code",
        result.orderCode,
      );
      return NextResponse.json({ success: true });

    case "order_already_settled":
      // Order đã SUCCESS/FAILED/EXPIRED → idempotent success.
      return NextResponse.json({ success: true });

    case "amount_mismatch":
      console.warn(
        "SePay webhook: amount mismatch for order",
        result.orderId,
        "expected",
        result.expected,
        "received",
        result.received,
      );
      return NextResponse.json({ success: true });

    case "order_expired":
      // Order đã quá hạn nhưng SePay vẫn gửi CK. Đã mark EXPIRED ở service.
      // Log để admin biết có thể là lỗi cron hoặc CK đến muộn.
      console.warn(
        "SePay webhook: order expired, payment received after expiry",
        {
          orderId: result.orderId,
          expiredAt: result.expiredAt,
        },
      );
      return NextResponse.json({ success: true });
  }
}
