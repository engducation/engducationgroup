import { env } from "@/env";
import { randomInt } from "node:crypto";
import {
  generateOrderCode as generateOrderCodeFromDb,
  parseOrderCodeFromContent as parseOrderCodeFromContentFromDb,
} from "./order-code-pattern.service";

// ─── Constants ──────────────────────────────────────────────────────────────
// Fallback prefix khi bảng `payment_code_patterns` chưa được seed (dev mới
// setup, hoặc DB lỗi). Logic chính đọc từ DB qua `order-code-pattern.service`.

export const FALLBACK_PATTERN_CODE = "ENGPRM";
export const ORDER_CODE_RANDOM_LENGTH = 8; // 8 chữ số

// Regex trích xuất fallback (chỉ dùng khi DB rỗng). Phần random là số nguyên.
export const FALLBACK_ORDER_CODE_REGEX = new RegExp(
  `${FALLBACK_PATTERN_CODE}([0-9]{${ORDER_CODE_RANDOM_LENGTH}})`,
);

// ─── Package Pricing ────────────────────────────────────────────────────────
// Số ngày Premium cộng dồn cho mỗi gói.

export const PACKAGE_DURATIONS: Record<string, number> = {
  MONTHLY: 30,
  "6_MONTH": 180,
  YEAR: 365,
};

export const PACKAGE_LABELS: Record<string, string> = {
  MONTHLY: "Gói 1 Tháng",
  "6_MONTH": "Gói 6 Tháng",
  YEAR: "Gói 1 Năm",
};

// Số tiền VND cho mỗi gói (single source of truth).
export const PACKAGE_PRICES: Record<string, number> = {
  MONTHLY: 49000,
  "6_MONTH": 269000,
  YEAR: 499000,
};

// ─── Order Code Generation ──────────────────────────────────────────────────

/**
 * Sinh orderCode mới. ƯU TIÊN dùng các pattern active từ DB
 * (`payment_code_patterns`). Nếu DB rỗng (chưa seed) → fallback về
 * prefix "ENGPRM" + 8 ký tự random để app vẫn chạy được khi setup.
 */
export async function generateOrderCode(): Promise<string> {
  try {
    return await generateOrderCodeFromDb();
  } catch (err) {
    // DB chưa seed / lỗi kết nối → dùng fallback để app không crash.
    console.warn(
      "[vietqr.service] generateOrderCode fell back to ENGPRM prefix:",
      err instanceof Error ? err.message : err,
    );
    return buildFallbackOrderCode();
  }
}

function buildFallbackOrderCode(): string {
  const min = 10 ** (ORDER_CODE_RANDOM_LENGTH - 1);
  const max = 10 ** ORDER_CODE_RANDOM_LENGTH;
  const random = String(randomInt(min, max));
  return `${FALLBACK_PATTERN_CODE}${random}`;
}

/**
 * Trích xuất orderCode từ nội dung chuyển khoản (async — query DB).
 * Trả về `null` nếu không tìm thấy pattern hợp lệ.
 *
 * SePay không đảm bảo gửi `code` riêng — đôi khi chỉ gửi `content` thô.
 * Hàm này là fallback khi `code` null/empty. Match theo các pattern active
 * trong DB, có fallback cuối cùng là regex "ENGPRMxxxxxxxx".
 */
export async function parseOrderCodeFromContent(
  content: string | null | undefined,
): Promise<string | null> {
  if (!content) return null;

  // Thử DB-tracked patterns trước (linh hoạt, hỗ trợ nhiều mã SePay).
  const fromDb = await parseOrderCodeFromContentFromDb(content);
  if (fromDb) return fromDb;

  // Fallback cuối cùng: regex "ENGPRMxxxxxxxx" cho orders cũ / DB chưa seed.
  const match = content.match(FALLBACK_ORDER_CODE_REGEX);
  if (!match) return null;
  return `${FALLBACK_PATTERN_CODE}${match[1].toUpperCase()}`;
}

// ─── VietQR URL Builder ─────────────────────────────────────────────────────
// Theo chuẩn công khai: https://img.vietqr.io/image/<bank>-<account>-<template>.jpg
// Tham số query: ?amount=...&addInfo=...&accountName=...
// Hỗ trợ các ngân hàng SePay liệt kê trong dashboard.

export type VietQrTemplate = "compact" | "compact2" | "qr_only" | "print";

export interface BuildVietQrUrlInput {
  bankCode: string;        // vd: "MBBank", "Vietcombank", "Techcombank"
  accountNumber: string;
  accountName: string;
  amount: number;          // VND
  content: string;         // Nội dung CK (sẽ chứa orderCode)
  template?: VietQrTemplate;
}

export function buildVietQrUrl(input: BuildVietQrUrlInput): string {
  const {
    bankCode,
    accountNumber,
    accountName,
    amount,
    content,
    template = "compact2",
  } = input;

  const params = new URLSearchParams({
    amount: String(amount),
    addInfo: content,
    accountName,
  });

  return `https://img.vietqr.io/image/${encodeURIComponent(bankCode)}-${encodeURIComponent(accountNumber)}-${template}.jpg?${params.toString()}`;
}

// ─── High-level helper: build QR cho order ──────────────────────────────────

export interface BuildOrderQrInput {
  orderCode: string;
  amount: number;
}

export function buildOrderQrUrl(input: BuildOrderQrInput): string {
  return buildVietQrUrl({
    bankCode: env.SEPAY_BANK_CODE,
    accountNumber: env.SEPAY_BANK_ACCOUNT,
    accountName: env.SEPAY_ACCOUNT_NAME,
    amount: input.amount,
    content: input.orderCode,
    template: "compact2",
  });
}
