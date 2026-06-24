import { env } from "@/env";
import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";

// Endpoint tạm để debug signature - XÓA sau khi test xong!
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/payment/test-signature
// Dùng để verify secret đang dùng có đúng không
export async function POST(request: Request) {
  const secret = env.SEPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "SEPAY_WEBHOOK_SECRET is not configured" },
      { status: 500 },
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("X-SePay-Signature");

  // Tính HMAC với secret hiện tại
  const computed = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  const provided = signature?.startsWith("sha256=")
    ? signature.slice("sha256=".length)
    : signature;

  return NextResponse.json({
    rawBody,
    signatureProvided: signature,
    signatureComputed: `sha256=${computed}`,
    secretUsed: secret,
    secretLength: secret.length,
    match: computed === provided,
    providedLength: provided?.length,
    computedLength: computed.length,
  });
}
