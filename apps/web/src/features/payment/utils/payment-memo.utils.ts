/**
 * Payment Memo utilities.
 *
 * Format: EP_<12 alphanumeric chars> → total 16 chars.
 * Example: EP_VxRs9m3pZqD8
 *
 * Purpose:
 * - Embed in VietQR content field so SePay can echo it back in webhook payload.
 * - Unlike orderCode, paymentMemo is short enough to survive bank truncation.
 * - SePay sends it back verbatim in the `code` or `content` field.
 * - Webhook parses paymentMemo → extracts orderId from DB → updates order.
 *
 * Why not use orderId directly?
 * - orderId = `ord_<14 nanoid>` ≈ 18 chars, exceeds VietQR 25-char limit.
 * - paymentMemo (16 chars) fits comfortably within the limit.
 */

import { customAlphabet } from "nanoid";

// 12-char alphabet: uppercase + lowercase + digits, no confusing chars (0/O, 1/l/I)
const MEMO_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
const generateRandomPart = customAlphabet(MEMO_ALPHABET, 12);

/**
 * Generate a new paymentMemo.
 * Format: EP_<12 random chars>
 * Example: EP_VxRs9m3pZqD8
 */
export function generatePaymentMemo(): string {
  return `EP_${generateRandomPart()}`;
}

/**
 * Check if a string looks like a valid paymentMemo.
 */
export function isPaymentMemo(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length === 16 &&
    value.startsWith("EP_") &&
    /^EP_[A-Za-z0-9]{12}$/.test(value)
  );
}

/**
 * Extract paymentMemo from SePay webhook content string.
 *
 * SePay can send the memo in two ways:
 *   1. `code` field (preferred) — SePay's structured field, often truncated by bank
 *   2. `content` field (fallback) — full content string, may contain extra text after memo
 *
 * We always look in `content` first for the full value, then fall back to `code`.
 *
 * @param content - The full content string from SePay webhook (e.g. "EP_VxRs9m3pZqD8")
 * @param code    - The optional `code` field from SePay webhook (may be truncated)
 * @returns paymentMemo string or null if not found
 */
export function parsePaymentMemo(
  content: string | null | undefined,
  code: string | null | undefined,
): string | null {
  // Try `code` first — SePay's structured field
  if (code && isPaymentMemo(code)) {
    return code;
  }

  // Try `content` — full text content, find EP_ pattern
  if (content) {
    const match = content.match(/EP_[A-Za-z0-9]{12}/);
    if (match && isPaymentMemo(match[0]!)) {
      return match[0]!;
    }
  }

  return null;
}
