import { env } from "@/env";
import {
  generateOrderCode as generateOrderCodeUtil,
  extractOrderCode,
  ORDER_CODE_PREFIX,
  ORDER_CODE_RANDOM_DIGITS,
  ORDER_CODE_REGEX,
} from "@/features/payment/utils/order-code.utils";
import { getPackagePrice, PACKAGES } from "./packages";
import type { PackageType } from "@/db/schema";

// ─── Constants ──────────────────────────────────────────────────────────────
// Giữ lại một số constant cũ để tương thích ngược với code cũ (nếu có)
// nhưng logic chính đã chuyển sang order-code.utils.ts

export const FALLBACK_PATTERN_CODE = ORDER_CODE_PREFIX;
export const ORDER_CODE_RANDOM_LENGTH = ORDER_CODE_RANDOM_DIGITS;

// Regex fallback - dùng cho parse khi cần
export const FALLBACK_ORDER_CODE_REGEX = ORDER_CODE_REGEX;

// ─── Package Pricing (re-export từ packages.ts để giữ tương thích ngược) ──
// PACKAGES, getPackagePrice, getPackageByType ở `./packages` là single source
// of truth. Mọi UI + service phải đọc từ đó.

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

// ─── Order Code Generation ──────────────────────────────────────────────────
// Format mới (2026-06): ENG + 20 chữ số ngẫu nhiên
// Không cần phân biệt theo packageType - tất cả dùng chung prefix ENG

/**
 * Sinh orderCode mới.
 * Format: ENG + 20 chữ số ngẫu nhiên
 * Ví dụ: "ENG84726391837465192038"
 *
 * Hàm này là wrapper để tương thích với code cũ gọi generateOrderCode(packageType).
 * Tham số packageType không còn ảnh hưởng đến mã sinh ra.
 */
export async function generateOrderCode(packageType: PackageType): Promise<string> {
  // Gọi trực tiếp utils, bỏ qua packageType
  void packageType; // unused
  return generateOrderCodeUtil();
}

/**
 * Trích xuất orderCode từ nội dung chuyển khoản.
 * Trả về `null` nếu không tìm thấy.
 *
 * SePay không đảm bảo gửi `code` riêng — đôi khi chỉ gửi `content` thô.
 * Hàm này match theo format ENG + 20 chữ số.
 */
export async function parseOrderCodeFromContent(
  content: string | null | undefined,
): Promise<string | null> {
  if (!content) return null;
  return extractOrderCode(content);
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
