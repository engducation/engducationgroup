import { NextResponse } from "next/server";
import { getAllPackagePrices } from "@/features/payment/services/pricing.service";

export async function GET() {
  try {
    const packages = await getAllPackagePrices();

    const result = packages.map((pkg) => ({
      packageType: pkg.packageType,
      label: pkg.label,
      description: pkg.description,
      basePrice: pkg.basePrice,
      currentPrice: pkg.currentPrice,
      originalPrice: pkg.originalPrice,
      discountPercent: pkg.discountPercent,
      isDiscounted: pkg.isDiscounted,
      discountEndsAt: pkg.discountEndsAt,
      recommended: pkg.recommended,
      duration: pkg.duration,
      features: pkg.features,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Public Pricing GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
