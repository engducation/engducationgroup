/**
 * ─── Payment Reference Code Utils ───────────────────────────────────────────
 *
 * Sinh và parse mã tham chiếu thanh toán (orderCode) dùng trong nội dung
 * chuyển khoản VietQR.
 *
 * Format: ENG + 20 chữ số nguyên
 * Ví dụ: ENG84726391837465192038
 *
 * Quy tắc (2026-06):
 *   - Prefix cố định: "ENG"
 *   - Phần số: 20 chữ số ngẫu nhiên, sinh bằng crypto.randomInt
 *
 * Lý do dùng format đơn giản:
 *   - Không cần phân biệt gói thanh toán bằng prefix riêng
 *   - Dễ validate, dễ debug
 *   - Đủ ngẫu nhiên để tránh trùng lặp
 */

import { randomInt, randomUUID } from "node:crypto";

// ─── Constants ────────────────────────────────────────────────────────────────

export const ORDER_CODE_PREFIX = "ENG";
export const ORDER_CODE_RANDOM_DIGITS = 20;

// Regex validate format: ENG + 20 chữ số
export const ORDER_CODE_REGEX = new RegExp(`^${ORDER_CODE_PREFIX}[0-9]{${ORDER_CODE_RANDOM_DIGITS}}$`);

// Regex để trích xuất orderCode từ nội dung chuyển khoản
export const ORDER_CODE_EXTRACT_REGEX = new RegExp(`(${ORDER_CODE_PREFIX}[0-9]{${ORDER_CODE_RANDOM_DIGITS}})`);

// ─── Generation ─────────────────────────────────────────────────────────────

/**
 * Sinh orderCode mới theo format ENG + 20 chữ số ngẫu nhiên.
 *
 * Sử dụng `randomInt` từ node:crypto để đảm bảo entropy cao cho các
 * request đồng thời.
 *
 * Ví dụ: "ENG84726391837465192038"
 */
export function generateOrderCode(): string {
  // Sinh 20 chữ số riêng lẻ để tránh overflow safe integer
  // (10^20 vượt quá Number.MAX_SAFE_INTEGER = 2^53-1)
  let digits = "";
  for (let i = 0; i < ORDER_CODE_RANDOM_DIGITS; i++) {
    digits += randomInt(0, 9).toString();
  }
  return `${ORDER_CODE_PREFIX}${digits}`;
}

/**
 * Sinh nhiều orderCode cùng lúc (hữu ích cho batch testing).
 */
export function generateOrderCodes(count: number): string[] {
  return Array.from({ length: count }, () => generateOrderCode());
}

// ─── Validation ─────────────────────────────────────────────────────────────

/**
 * Kiểm tra orderCode có đúng format không.
 */
export function isValidOrderCode(code: string): boolean {
  return ORDER_CODE_REGEX.test(code);
}

/**
 * Trích xuất orderCode đầu tiên tìm thấy trong nội dung chuyển khoản.
 * Trả về null nếu không tìm thấy.
 */
export function extractOrderCode(content: string): string | null {
  if (!content) return null;

  const match = content.match(ORDER_CODE_EXTRACT_REGEX);
  if (!match) return null;

  const candidate = match[1].toUpperCase();
  return isValidOrderCode(candidate) ? candidate : null;
}

// ─── Formatting ─────────────────────────────────────────────────────────────

/**
 * Format orderCode để hiển thị (thêm khoảng trắng mỗi 4 ký tự).
 * Dùng cho UI hiển thị mã thanh toán.
 *
 * Ví dụ: "ENG84726391837465192038" → "ENG8 4726 3918 3746 5192 038"
 */
export function formatOrderCodeForDisplay(code: string): string {
  if (!code) return "";

  // Bỏ prefix ENG để format phần số
  const prefix = ORDER_CODE_PREFIX;
  const digits = code.slice(prefix.length);

  // Format: chia thành nhóm 4
  const groups: string[] = [];
  for (let i = 0; i < digits.length; i += 4) {
    groups.push(digits.slice(i, i + 4));
  }

  return `${prefix}${groups.join(" ")}`;
}

/**
 * Validate và format orderCode. Throw nếu không hợp lệ.
 */
export function validateAndFormatOrderCode(code: string): string {
  const normalized = code.toUpperCase().trim();

  if (!ORDER_CODE_REGEX.test(normalized)) {
    throw new Error(
      `Invalid orderCode format. Expected: ${ORDER_CODE_PREFIX} + ${ORDER_CODE_RANDOM_DIGITS} digits. Got: ${code}`,
    );
  }

  return normalized;
}

// ─── Testing ────────────────────────────────────────────────────────────────

/**
 * Sinh orderCode giả để test (dùng UUID hash thay vì randomInt thật).
 * Chỉ dùng trong test/development.
 */
export function generateFakeOrderCode(): string {
  const uuid = randomUUID().replace(/-/g, "").slice(0, 20);
  return `${ORDER_CODE_PREFIX}${uuid}`;
}
