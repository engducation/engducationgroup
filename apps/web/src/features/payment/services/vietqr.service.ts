import { env } from "@/env";
import { randomInt } from "node:crypto";
import {
  generateOrderCode as generateOrderCodeFromDb,
  parseOrderCodeFromContent as parseOrderCodeFromContentFromDb,
} from "./order-code-pattern.service";
import { getPackagePrice, PACKAGES } from "./packages";
import type { PackageType } from "@/db/schema";

// ─── Constants ──────────────────────────────────────────────────────────────
// Fallback prefix khi bảng `payment_code_patterns` chưa được seed (dev mới
// setup, hoặc DB lỗi). Logic chính đọc từ DB qua `order-code-pattern.service`.
//
// LƯU Ý: Prefix fallback PHẢI khớp với regex FALLBACK_ORDER_CODE_REGEX bên
// dưới và là 1 string nguyên vẹn (vd: "ENGPRM"). Nếu cắt ngắn (vd: "ENG"),
// mã sinh ra sẽ KHÔNG match regex ở parseOrderCodeFromContent → webhook
// SePay không tìm được order → treo PENDING mãi.

export const FALLBACK_PATTERN_CODE = "ENGPRM";
export const ORDER_CODE_RANDOM_LENGTH = 7; // 7 chữ số (khoảng 6-8 chữ số, chọn 7 cân bằng unique/dễ đọc)

// Regex trích xuất fallback (chỉ dùng khi DB rỗng). Phần random là số nguyên.
export const FALLBACK_ORDER_CODE_REGEX = new RegExp(
  `${FALLBACK_PATTERN_CODE}([0-9]{${ORDER_CODE_RANDOM_LENGTH}})`,
);

// ─── Package Pricing (re-export từ packages.ts để giữ tương thích ngược) ──
//
// PACKAGES, getPackagePrice, getPackageByType ở `./packages` là single source
// of truth. Mọi UI + service phải đọc từ đó. Ba alias dưới đây chỉ để các
// file cũ (vd: order.service.ts) không phải refactor import path ngay.

export const PACKAGE_PRICES: Record<string, number> = Object.fromEntries(
  PACKAGES.map((p) => [p.type, p.price]),
);

export const PACKAGE_DURATIONS: Record<string, number> = Object.fromEntries(
  PACKAGES.map((p) => [p.type, p.duration]),
);

export const PACKAGE_LABELS: Record<string, string> = Object.fromEntries(
  PACKAGES.map((p) => [p.type, p.label]),
);

/** Helper an toàn: lấy giá theo packageType, throw nếu không tồn tại. */
export function getPackagePriceVnd(packageType: PackageType): number {
  return getPackagePrice(packageType);
}

// ─── Order Code Prefix theo packageType ─────────────────────────────────────
//
// Mapping cố định giữa gói học và prefix SePay. Mỗi gói sinh mã có prefix
// riêng để Admin dễ phân loại doanh thu khi đối soát trên SePay dashboard.
//
// Quy tắc (cập nhật 2026-06):
//   - MONTHLY (49k)   → "DAY"   → "DAY" + 7 số   (vd: DAY4827163)
//   - 6_MONTH (269k)  → "MONTH" → "MONTH" + 7 số (vd: MONTH3948215)
//   - YEAR     (499k) → "YEAR"  → "YEAR" + 7 số  (vd: YEAR7293816)
//
// Phần random dài 7 chữ số (khoảng 6-8, chọn 7 để cân bằng uniqueness vs.
// dễ đọc trên biên lai ngân hàng). Sinh bằng `crypto.randomInt` nên không
// trùng giữa các request đồng thời.
//
// BẮT BUỘC phải khớp với các dòng đã khai báo trong SePay dashboard
// (my.sepay.vn → Cài đặt → Mã thanh toán). Nếu thiếu 1 dòng ở SePay
// dashboard, SePay sẽ bỏ qua giao dịch có prefix đó → đơn treo PENDING mãi.
//
// Pattern code PHẢI còn active trong bảng `payment_code_patterns`. Nếu admin
// soft-delete 1 pattern, cần update map này trước hoặc tạo lại pattern.
export const PACKAGE_PATTERN_CODE: Record<PackageType, string> = {
  MONTHLY: "DAY",
  "6_MONTH": "MONTH",
  YEAR: "YEAR",
};

// ─── Order Code Generation ──────────────────────────────────────────────────

/**
 * Sinh orderCode mới dựa trên packageType của đơn hàng.
 *
 * Mapping: dùng `PACKAGE_PATTERN_CODE` để chọn pattern tương ứng với gói
 * (MONTHLY→DAY, 6_MONTH→MONTH, YEAR→YEAR). Sau đó query DB lấy pattern
 * detail (randomLength) và sinh mã.
 *
 * Ví dụ:
 *   generateOrderCode("MONTHLY") → "DAY4827163"
 *   generateOrderCode("6_MONTH") → "MONTH3948215"
 *   generateOrderCode("YEAR")   → "YEAR7293816"
 *
 * Nếu pattern tương ứng không active trong DB → throw error. Nếu DB lỗi /
 * chưa seed → fallback về "ENGPRMxxxxxxx" (7 số) để app không crash (giữ
 * backward compat cho môi trường dev chưa setup).
 */
export async function generateOrderCode(packageType: PackageType): Promise<string> {
  const patternCode = PACKAGE_PATTERN_CODE[packageType];
  try {
    return await generateOrderCodeFromDb({ preferredCode: patternCode });
  } catch (err) {
    // DB chưa seed / pattern bị inactive / lỗi kết nối → dùng fallback để
    // app không crash. Log warning để admin biết cần seed pattern.
    console.warn(
      `[vietqr.service] generateOrderCode(${packageType}) fell back to ${FALLBACK_PATTERN_CODE} prefix:`,
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
