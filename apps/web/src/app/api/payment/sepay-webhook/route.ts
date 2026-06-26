import { NextResponse } from "next/server";
import {
  getApiKeyFromHeaders,
  getClientIpFromHeaders,
  processSepayWebhook,
  isSepayIp,
  verifyApiKey,
} from "@/features/payment/services/sepay-webhook.service";
import { env } from "@/env";

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

  // DEBUG: Log authentication details before processing
  console.log("[SEPAY-WEBHOOK-DEBUG] ======");
  console.log("[SEPAY-WEBHOOK-DEBUG] Request URL:", request.url);
  console.log("[SEPAY-WEBHOOK-DEBUG] Client IP from headers:", clientIp);
  console.log("[SEPAY-WEBHOOK-DEBUG] Is SePay IP:", isSepayIp(clientIp));
  console.log("[SEPAY-WEBHOOK-DEBUG] API Key present:", !!apiKey);
  console.log("[SEPAY-WEBHOOK-DEBUG] API Key length:", apiKey?.length ?? 0);
  console.log("[SEPAY-WEBHOOK-DEBUG] Env SEPAY_API_KEY length:", env.SEPAY_API_KEY?.length ?? 0);
  console.log("[SEPAY-WEBHOOK-DEBUG] Keys match:", apiKey && env.SEPAY_API_KEY ? apiKey === env.SEPAY_API_KEY : false);
  console.log("[SEPAY-WEBHOOK-DEBUG] Manual test mode:", isManualTest);
  console.log("[SEPAY-WEBHOOK-DEBUG] All x-forwarded-for:", request.headers.get("x-forwarded-for"));
  console.log("[SEPAY-WEBHOOK-DEBUG] All x-real-ip:", request.headers.get("x-real-ip"));
  console.log("[SEPAY-WEBHOOK-DEBUG] Authorization header:", request.headers.get("authorization")?.substring(0, 50) + "...");
  console.log("[SEPAY-WEBHOOK-DEBUG] ======");

  const result = await processSepayWebhook({
    rawBody,
    apiKey,
    clientIp,
    bypassAuth: isManualTest,
  });

  switch (result.kind) {
    case "ok":
      console.log("[SEPAY-WEBHOOK-DEBUG] Result: ok");
      return NextResponse.json({ success: true });

    case "ip_not_allowed":
      console.warn("SePay webhook: IP not in whitelist", {
        clientIp: result.clientIp,
        forwardedFor: request.headers.get("x-forwarded-for"),
        realIp: request.headers.get("x-real-ip"),
      });
      return NextResponse.json({ success: false, error: "Forbidden: Invalid IP Source" }, { status: 403 });

    case "signature_invalid":
      console.warn("SePay webhook: signature/API key invalid", {
        apiKeyProvided: apiKey,
        apiKeyLength: apiKey?.length,
        envKeyLength: env.SEPAY_API_KEY?.length,
        keysMatch: apiKey && env.SEPAY_API_KEY ? apiKey === env.SEPAY_API_KEY : false,
        rawAuthHeader: request.headers.get("authorization"),
      });
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });

    case "invalid_payload":
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });

    case "order_not_found":
      console.warn("SePay webhook: order not found for paymentMemo", result.paymentMemo);
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
