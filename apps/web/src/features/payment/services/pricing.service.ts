import { db } from "@/db";
import {
  packagePricing,
  voucher,
  voucherUsage,
  type VoucherType,
} from "@/db/schema/discount";
import {
  eq,
  and,
  isNull,
  or,
  gte,
  lte,
  sql,
  lt,
} from "drizzle-orm";
import {
  PACKAGE_DURATIONS,
  PACKAGE_PRICES,
  PACKAGE_LABELS,
  type PackageType,
} from "@/db/schema/admin";
import type { PackageInfo } from "./packages";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface PriceOverride {
  packageType: PackageType;
  basePrice: number;
  currentPrice: number;
  discountPercent: number;
  customLabel?: string | null;
  customDescription?: string | null;
  isEnabled: boolean;
  discountStartsAt: Date | null;
  discountEndsAt: Date | null;
}

export interface VoucherInfo {
  id: string;
  code: string;
  type: VoucherType;
  value: number;
  maxDiscount?: number | null;
  minOrderAmount: number;
  applicablePackages?: string[] | null;
  isValid: boolean;
  invalidReason?: string;
  expiresAt: Date | null;
}

export interface VoucherValidationResult {
  valid: boolean;
  voucher?: VoucherInfo;
  discountAmount?: number;
  finalPrice?: number;
  invalidReason?: string;
}

export interface CalculatedPrice {
  packageType: PackageType;
  label: string;
  description: string;
  basePrice: number;
  currentPrice: number;
  originalPrice: number;
  discountPercent: number;
  isDiscounted: boolean;
  discountEndsAt: Date | null;
  features: string[];
  recommended: boolean;
  duration: number;
}

// ─── Default Package Info ───────────────────────────────────────────────────

const DEFAULT_PACKAGE_FEATURES: Record<PackageType, string[]> = {
  MONTHLY: [
    "Học từ vựng theo danh mục",
    "Làm quiz trắc nghiệm cơ bản",
    "Xem video bài giảng (giới hạn)",
  ],
  "6_MONTH": [
    "Tất cả tính năng gói cơ bản",
    "Video bài giảng không giới hạn",
    "Quiz nâng cao + giải thích chi tiết",
    "AI Writing Assistant (50 lượt/tháng)",
  ],
  YEAR: [
    "Tất cả tính năng Premium",
    "AI Writing Assistant không giới hạn",
    "Báo cáo phân tích AI hàng tháng",
    "Hỗ trợ ưu tiên 24/7",
  ],
};

// ─── Package Pricing Functions ───────────────────────────────────────────────

/**
 * Lấy tất cả overrides cho tất cả package types.
 * Cache ở module-level để tránh query DB quá nhiều.
 */
let _cachedPricing: PriceOverride[] | null = null;
let _pricingCacheTime = 0;
const PRICING_CACHE_TTL = 60 * 1000; // 1 phút

async function getAllPriceOverrides(): Promise<PriceOverride[]> {
  const now = Date.now();
  if (_cachedPricing && now - _pricingCacheTime < PRICING_CACHE_TTL) {
    return _cachedPricing;
  }

  const rows = await db.select().from(packagePricing);
  _cachedPricing = rows.map((row) => ({
    packageType: row.packageType,
    basePrice: row.basePrice,
    currentPrice: row.currentPrice,
    discountPercent: row.discountPercent,
    customLabel: row.customLabel,
    customDescription: row.customDescription,
    isEnabled: Boolean(row.isEnabled),
    discountStartsAt: row.discountStartsAt,
    discountEndsAt: row.discountEndsAt,
  }));
  _pricingCacheTime = now;
  return _cachedPricing;
}

/**
 * Invalidate cache khi admin update pricing
 */
export function invalidatePricingCache() {
  _cachedPricing = null;
  _pricingCacheTime = 0;
}

/**
 * Lấy overrides cho 1 package type cụ thể
 */
export async function getPriceOverride(
  packageType: PackageType,
): Promise<PriceOverride | null> {
  const overrides = await getAllPriceOverrides();
  return overrides.find((o) => o.packageType === packageType) ?? null;
}

/**
 * Lấy thông tin giá đầy đủ cho UI (kết hợp override + defaults)
 */
export async function getPackagePriceInfo(
  packageType: PackageType,
): Promise<CalculatedPrice> {
  const override = await getPriceOverride(packageType);

  const basePrice = PACKAGE_PRICES[packageType];
  const duration = PACKAGE_DURATIONS[packageType];
  const defaultLabel = PACKAGE_LABELS[packageType];

  // Tính giá hiện tại (có thể bị override)
  const currentPrice = override?.currentPrice ?? basePrice;
  const discountPercent = override?.discountPercent ?? 0;

  // Tính originalPrice (giá gốc để so sánh)
  // Nếu có override và có discount → originalPrice = basePrice
  // Nếu không → originalPrice = currentPrice (không hiển thị strikethrough)
  const originalPrice = override ? basePrice : currentPrice;
  const isDiscounted = discountPercent > 0 && currentPrice < basePrice;

  return {
    packageType,
    label: override?.customLabel ?? defaultLabel,
    description:
      override?.customDescription ??
      getDefaultDescription(packageType, discountPercent),
    basePrice,
    currentPrice,
    originalPrice,
    discountPercent,
    isDiscounted,
    discountEndsAt: override?.discountEndsAt ?? null,
    features: DEFAULT_PACKAGE_FEATURES[packageType],
    recommended: packageType === "6_MONTH",
    duration,
  };
}

/**
 * Lấy tất cả packages với giá động cho UI
 */
export async function getAllPackagePrices(): Promise<CalculatedPrice[]> {
  const packageTypes: PackageType[] = ["MONTHLY", "6_MONTH", "YEAR"];
  return Promise.all(
    packageTypes.map((type) => getPackagePriceInfo(type)),
  );
}

function getDefaultDescription(
  packageType: PackageType,
  discountPercent: number,
): string {
  if (discountPercent > 0) {
    return `Tiết kiệm ${discountPercent}% - Truy cập trong ${PACKAGE_DURATIONS[packageType]} ngày`;
  }

  switch (packageType) {
    case "MONTHLY":
      return "Truy cập tất cả khóa học trong 30 ngày";
    case "6_MONTH":
      return "Tiết kiệm 8% - Truy cập trong 180 ngày";
    case "YEAR":
      return "Tiết kiệm 15% - Truy cập trong 365 ngày";
  }
}

// ─── Voucher Functions ─────────────────────────────────────────────────────

let _cachedVouchers: Map<string, VoucherInfo> = new Map();
let _voucherCacheTime = 0;
const VOUCHER_CACHE_TTL = 30 * 1000; // 30 giây

/**
 * Invalidate voucher cache
 */
export function invalidateVoucherCache() {
  _cachedVouchers = new Map();
  _voucherCacheTime = 0;
}

function voucherToInfo(row: typeof voucher.$inferSelect): VoucherInfo {
  const now = new Date();
  let isValid = true;
  let invalidReason: string | undefined;

  // Check if voucher is active
  if (!row.isActive) {
    isValid = false;
    invalidReason = "Voucher không còn hoạt động";
  }

  // Check start date
  if (isValid && row.startsAt && row.startsAt > now) {
    isValid = false;
    invalidReason = "Voucher chưa được kích hoạt";
  }

  // Check expiry
  if (isValid && row.expiresAt && row.expiresAt < now) {
    isValid = false;
    invalidReason = "Voucher đã hết hạn";
  }

  // Check usage limit
  if (isValid && row.maxUsage && row.usedCount >= row.maxUsage) {
    isValid = false;
    invalidReason = "Voucher đã được sử dụng hết";
  }

  let applicablePackages: string[] | null = null;
  if (row.applicablePackages) {
    try {
      applicablePackages = JSON.parse(row.applicablePackages);
    } catch {
      applicablePackages = null;
    }
  }

  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: row.value,
    maxDiscount: row.maxDiscount,
    minOrderAmount: row.minOrderAmount,
    applicablePackages,
    isValid,
    invalidReason,
    expiresAt: row.expiresAt,
  };
}

/**
 * Validate voucher code
 */
export async function validateVoucher(
  code: string,
  packageType?: PackageType,
): Promise<VoucherValidationResult> {
  const normalizedCode = code.trim().toUpperCase();
  const now = new Date();

  // Check cache first
  let voucherInfo = _cachedVouchers.get(normalizedCode);
  if (!voucherInfo) {
    const [row] = await db
      .select()
      .from(voucher)
      .where(eq(voucher.code, normalizedCode))
      .limit(1);

    if (!row) {
      return {
        valid: false,
        invalidReason: "Mã voucher không tồn tại",
      };
    }

    voucherInfo = voucherToInfo(row);
    _cachedVouchers.set(normalizedCode, voucherInfo);
  }

  // Return early if voucher is not valid
  if (!voucherInfo.isValid) {
    return {
      valid: false,
      voucher: voucherInfo,
      invalidReason: voucherInfo.invalidReason,
    };
  }

  // Check package applicability
  if (packageType && voucherInfo.applicablePackages) {
    if (!voucherInfo.applicablePackages.includes(packageType)) {
      return {
        valid: false,
        voucher: voucherInfo,
        invalidReason: `Voucher không áp dụng cho gói này`,
      };
    }
  }

  return {
    valid: true,
    voucher: voucherInfo,
  };
}

/**
 * Tính số tiền được giảm khi áp dụng voucher
 */
export function calculateDiscount(
  voucherInfo: VoucherInfo,
  packagePrice: number,
): number {
  if (voucherInfo.type === "PERCENTAGE") {
    let discount = Math.floor((packagePrice * voucherInfo.value) / 100);

    // Apply max discount cap if set
    if (voucherInfo.maxDiscount && discount > voucherInfo.maxDiscount) {
      discount = voucherInfo.maxDiscount;
    }

    return discount;
  } else {
    // FIXED type - just return the value, but not more than the package price
    return Math.min(voucherInfo.value, packagePrice);
  }
}

/**
 * Apply voucher to a package price and return final price
 */
export function applyVoucher(
  voucherInfo: VoucherInfo,
  packagePrice: number,
): { discountAmount: number; finalPrice: number } {
  const discountAmount = calculateDiscount(voucherInfo, packagePrice);
  const finalPrice = Math.max(0, packagePrice - discountAmount);
  return { discountAmount, finalPrice };
}

/**
 * Get voucher by code (for display purposes)
 */
export async function getVoucherByCode(code: string): Promise<VoucherInfo | null> {
  const normalizedCode = code.trim().toUpperCase();
  const cached = _cachedVouchers.get(normalizedCode);
  if (cached) return cached;

  const [row] = await db
    .select()
    .from(voucher)
    .where(eq(voucher.code, normalizedCode))
    .limit(1);

  if (!row) return null;

  const voucherInfo = voucherToInfo(row);
  _cachedVouchers.set(normalizedCode, voucherInfo);
  return voucherInfo;
}

/**
 * Mark voucher as used (call after successful payment)
 */
export async function useVoucher(params: {
  voucherId: string;
  userId: string;
  orderId: string;
  discountAmount: number;
}): Promise<void> {
  const { voucherId, userId, orderId, discountAmount } = params;
  const { nanoid } = await import("nanoid");

  // Insert usage record
  await db.insert(voucherUsage).values({
    id: `vu_${nanoid(12)}`,
    voucherId,
    userId,
    orderId,
    discountAmount,
  });

  // Increment used count
  await db
    .update(voucher)
    .set({ usedCount: sql`${voucher.usedCount} + 1` })
    .where(eq(voucher.id, voucherId));

  // Invalidate cache
  invalidateVoucherCache();
}

/**
 * Get user's voucher usage history
 */
export async function getUserVoucherUsage(
  userId: string,
): Promise<Array<{ voucherCode: string; discountAmount: number; usedAt: Date }>> {
  const rows = await db
    .select({
      voucherCode: voucher.code,
      discountAmount: voucherUsage.discountAmount,
      usedAt: voucherUsage.createdAt,
    })
    .from(voucherUsage)
    .innerJoin(voucher, eq(voucherUsage.voucherId, voucher.id))
    .where(eq(voucherUsage.userId, userId))
    .orderBy(sql`${voucherUsage.createdAt} DESC`);

  return rows;
}
