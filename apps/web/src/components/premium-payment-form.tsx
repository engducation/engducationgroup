"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, CreditCard, Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateOrder } from "@/features/payment/hooks/use-create-order";
import type { PackageType } from "@/features/payment/types/schemas";

interface PackageInfo {
  type: PackageType;
  label: string;
  price: number;
  duration: number;
  description: string;
  recommended?: boolean;
}

const PACKAGES: PackageInfo[] = [
  {
    type: "MONTHLY",
    label: "Gói 1 Tháng",
    price: 49000,
    duration: 30,
    description: "Truy cập tất cả khóa học trong 30 ngày",
  },
  {
    type: "6_MONTH",
    label: "Gói 6 Tháng",
    price: 269000,
    duration: 180,
    description: "Tiết kiệm 8% - Truy cập trong 180 ngày",
    recommended: true,
  },
  {
    type: "YEAR",
    label: "Gói 1 Năm",
    price: 499000,
    duration: 365,
    description: "Tiết kiệm 15% - Truy cập trong 365 ngày",
  },
];

interface PremiumPaymentFormProps {
  defaultPackage?: PackageType;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN").format(price) + "đ";

/**
 * Bước 1: chọn gói → POST /api/payment/orders → navigate sang /upgrade/[orderId].
 * Không auto-complete ở đây nữa — QR & polling nằm ở trang tiếp theo.
 */
export function PremiumPaymentForm({
  defaultPackage = "6_MONTH",
}: PremiumPaymentFormProps) {
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState<PackageType>(defaultPackage);
  const { createOrder, isLoading, error } = useCreateOrder({
    onSuccess: (order) => {
      // Dynamic route — cast để vượt Next.js typed routes (route mới chưa được typed-link-crawler thấy).
      router.push(`/upgrade/${order.id}` as never);
    },
  });

  const handleSubmit = () => {
    void createOrder(selectedPackage);
  };

  return (
    <div className="space-y-8">
      {/* Package selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Chọn gói Premium</h3>
        <div className="grid gap-4">
          {PACKAGES.map((pkg) => (
            <button
              key={pkg.type}
              type="button"
              onClick={() => setSelectedPackage(pkg.type)}
              className={`relative flex items-center justify-between rounded-2xl border-2 p-4 text-left transition-all ${
                selectedPackage === pkg.type
                  ? "border-indigo-500 bg-indigo-50/50 shadow-lg shadow-indigo-500/10"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
              }`}
            >
              {pkg.recommended && (
                <span className="absolute -top-3 left-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                  Phổ biến nhất
                </span>
              )}

              <div className="flex items-center gap-4">
                <div
                  className={`flex size-10 items-center justify-center rounded-xl transition-colors ${
                    selectedPackage === pkg.type
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{pkg.label}</span>
                    <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5">
                      <Sparkles className="size-3 text-emerald-600" />
                      <span className="text-[10px] font-semibold text-emerald-700">
                        {pkg.duration} ngày
                      </span>
                    </div>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{pkg.description}</p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-bold text-slate-900">
                  {formatPrice(pkg.price)}
                </div>
                {pkg.type !== "MONTHLY" && (
                  <div className="text-xs text-slate-400 line-through">
                    {formatPrice(pkg.type === "6_MONTH" ? 294000 : 588000)}
                  </div>
                )}
              </div>

              {selectedPackage === pkg.type && (
                <div className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-indigo-500 shadow-lg">
                  <Check className="size-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200/60 bg-red-50/60 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-lg shadow-indigo-500/25 h-12 text-base"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-5 mr-2 animate-spin" />
            Đang tạo đơn...
          </>
        ) : (
          <>
            <Crown className="size-5 mr-2" />
            Tiếp tục thanh toán
          </>
        )}
      </Button>
    </div>
  );
}
