import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { validateVoucher, applyVoucher, getPackagePriceInfo } from "@/features/payment/services/pricing.service";
import type { PackageType } from "@/db/schema";

// ─── Auth Check ───────────────────────────────────────────────────────────────

async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session.user.id;
}

// ─── Schemas ────────────────────────────────────────────────────────────────

const validateSchema = z.object({
  code: z.string().min(1),
  packageType: z.enum(["MONTHLY", "6_MONTH", "YEAR"] as const),
});

const applySchema = z.object({
  code: z.string().min(1),
  packageType: z.enum(["MONTHLY", "6_MONTH", "YEAR"] as const),
});

// ─── POST /api/payment/voucher/validate ──────────────────────────────────────

export async function POST(request: Request) {
  try {
    await requireAuth();

    const body = await request.json();
    const { code, packageType } = validateSchema.parse(body);

    // Lấy giá động từ pricing service (không dùng packagePrice từ client)
    const pkgInfo = await getPackagePriceInfo(packageType as PackageType);
    const packagePrice = pkgInfo.currentPrice;

    // Validate voucher
    const validation = await validateVoucher(code, packageType as PackageType);

    if (!validation.valid || !validation.voucher) {
      return NextResponse.json(
        {
          valid: false,
          error: validation.invalidReason ?? "Voucher không hợp lệ",
        },
        { status: 400 },
      );
    }

    // Check minimum order amount
    if (packagePrice < validation.voucher.minOrderAmount) {
      return NextResponse.json(
        {
          valid: false,
          error: `Đơn hàng tối thiểu ${formatPrice(validation.voucher.minOrderAmount)}`,
        },
        { status: 400 },
      );
    }

    // Calculate discount
    const { discountAmount, finalPrice } = applyVoucher(
      validation.voucher,
      packagePrice,
    );

    return NextResponse.json({
      valid: true,
      voucher: {
        code: validation.voucher.code,
        type: validation.voucher.type,
        value: validation.voucher.value,
        maxDiscount: validation.voucher.maxDiscount,
        discountAmount,
        finalPrice,
        expiresAt: validation.voucher.expiresAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }
    console.error("[Voucher Validate]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}
