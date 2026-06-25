import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { packagePricing } from "@/db/schema/discount";
import {
  PACKAGE_PRICES,
  PACKAGE_DURATIONS,
  type PackageType,
  packageTypeEnum,
} from "@/db/schema/admin";
import { invalidatePricingCache } from "@/features/payment/services/pricing.service";
import { eq } from "drizzle-orm";

// ─── Auth Check ───────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { asSessionUser } = await import("@/types/session");
  const user = asSessionUser(session.user);
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

// ─── Schemas ────────────────────────────────────────────────────────────────

const updatePricingSchema = z.object({
  packageType: z.enum(["MONTHLY", "6_MONTH", "YEAR"] as const),
  currentPrice: z.number().int().min(0),
  discountPercent: z.number().int().min(0).max(100).optional(),
  customLabel: z.string().max(100).nullable().optional(),
  customDescription: z.string().nullable().optional(),
  discountStartsAt: z.string().datetime().nullable().optional(),
  discountEndsAt: z.string().datetime().nullable().optional(),
  isEnabled: z.boolean().optional(),
  adminNote: z.string().nullable().optional(),
});

const resetPricingSchema = z.object({
  packageType: z.enum(["MONTHLY", "6_MONTH", "YEAR"] as const),
});

// ─── GET /api/admin/pricing ─────────────────────────────────────────────────

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const rows = await db.select().from(packagePricing);

    // Merge with defaults for packages that don't have overrides
    const packageTypes: PackageType[] = ["MONTHLY", "6_MONTH", "YEAR"];
    const result = packageTypes.map((type) => {
      const override = rows.find((r) => r.packageType === type);
      const basePrice = PACKAGE_PRICES[type];

      return {
        packageType: type,
        basePrice,
        currentPrice: override?.currentPrice ?? basePrice,
        discountPercent: override?.discountPercent ?? 0,
        customLabel: override?.customLabel ?? null,
        customDescription: override?.customDescription ?? null,
        isEnabled: override?.isEnabled !== 0,
        discountStartsAt: override?.discountStartsAt ?? null,
        discountEndsAt: override?.discountEndsAt ?? null,
        adminNote: override?.adminNote ?? null,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Admin Pricing GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── PUT /api/admin/pricing ─────────────────────────────────────────────────

export async function PUT(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const data = updatePricingSchema.parse(body);

    const basePrice = PACKAGE_PRICES[data.packageType as PackageType];
    const currentPrice = data.currentPrice ?? basePrice;
    const discountPercent = data.discountPercent ?? 0;

    // Upsert (insert or update)
    await db
      .insert(packagePricing)
      .values({
        packageType: data.packageType as PackageType,
        basePrice,
        currentPrice,
        discountPercent,
        customLabel: data.customLabel ?? null,
        customDescription: data.customDescription ?? null,
        isEnabled: data.isEnabled !== false ? 1 : 0,
        discountStartsAt: data.discountStartsAt
          ? new Date(data.discountStartsAt)
          : null,
        discountEndsAt: data.discountEndsAt
          ? new Date(data.discountEndsAt)
          : null,
        adminNote: data.adminNote ?? null,
      })
      .onConflictDoUpdate({
        target: packagePricing.packageType,
        set: {
          currentPrice,
          discountPercent,
          customLabel: data.customLabel ?? null,
          customDescription: data.customDescription ?? null,
          isEnabled: data.isEnabled !== false ? 1 : 0,
          discountStartsAt: data.discountStartsAt
            ? new Date(data.discountStartsAt)
            : null,
          discountEndsAt: data.discountEndsAt
            ? new Date(data.discountEndsAt)
            : null,
          adminNote: data.adminNote ?? null,
        },
      });

    // Invalidate cache
    invalidatePricingCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }
    console.error("[Admin Pricing PUT]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ─── POST /api/admin/pricing/reset ──────────────────────────────────────────

export async function POST(request: Request) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await request.json();
    const { packageType } = resetPricingSchema.parse(body);

    // Delete the override to use default pricing
    await db
      .delete(packagePricing)
      .where(eq(packagePricing.packageType, packageType as PackageType));

    // Invalidate cache
    invalidatePricingCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }
    console.error("[Admin Pricing Reset]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
