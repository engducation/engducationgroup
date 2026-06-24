import { NextResponse } from "next/server";
import {
  getApiKeyFromHeaders,
  getClientIpFromHeaders,
  processSepayWebhook,
} from "@/features/payment/services/sepay-webhook.service";

export const runtime = "nodejs";          // cần Node crypto + drizzle-orm/neon-http WebSocket
export const dynamic = "force-dynamic";   // không cache
export const maxDuration = 30;             // SePay timeout 30s

// POST /api/payment/sepay-webhook
//
// Endpoint nhận tín hiệu biến động số dư từ SePay.
//
// Auth (2 lớp theo khuyến nghị SePay docs developer.sepay.vn/vi/dia-chi-ip):
//   - Lớp 1 (IP Whitelist): exact match cả IPv4 + IPv6, đọc từ x-forwarded-for
//                            (vì qua ngrok/Vercel/Cloudflare IP thật chỉ có ở header).
//   - Lớp 2 (API Key):      `Authorization: Apikey <key>`
//
// Manual test mode: `?test=true` bypass cả 2 lớp auth (chỉ dev).

export async function POST(request: Request) {
  const rawBody = await request.text();

  // Manual test mode: ?test=true bypass IP + API key check (chỉ dev).
  // Production tuyệt đối không có query này.
  const url = new URL(request.url);
  const isManualTest = url.searchParams.get("test") === "true";

  const clientIp = getClientIpFromHeaders(request.headers);
  const apiKey = getApiKeyFromHeaders(request.headers);

  const result = await processSepayWebhook({
    rawBody,
    apiKey,
    clientIp,
    bypassAuth: isManualTest,
  });

  switch (result.kind) {
    case "ok":
      return NextResponse.json({ success: true });

    case "ip_not_allowed":
      console.warn("SePay webhook: IP not in whitelist", {
        clientIp: result.clientIp,
        forwardedFor: request.headers.get("x-forwarded-for"),
        realIp: request.headers.get("x-real-ip"),
      });
      return NextResponse.json({ success: false, error: "Forbidden: Invalid IP Source" }, { status: 403 });

    case "signature_invalid":
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

    case "invalid_payload":
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });

    case "order_not_found":
      console.warn("SePay webhook: order not found for code", result.orderCode);
      return NextResponse.json({ success: true });

    case "order_already_settled":
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
      console.warn("SePay webhook: order expired, payment received after expiry", {
        orderId: result.orderId,
        expiredAt: result.expiredAt,
      });
      return NextResponse.json({ success: true });
  }
}
