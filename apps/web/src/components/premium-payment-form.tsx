"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, CreditCard, Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateOrder } from "@/features/payment/hooks/use-create-order";
import { PACKAGES, type PackageInfo } from "@/features/payment/services/packages";
import type { PackageType } from "@/features/payment/types/schemas";

interface PremiumPaymentFormProps {
  defaultPackage?: PackageType;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN").format(price) + "đ";

/**
 * Bước 1: chọn gói → POST /api/payment/orders → navigate sang /upgrade/[orderId].
 * Không auto-complete ở đây nữa — QR & polling nằm ở trang tiếp theo.
 *
 * Danh sách gói đọc từ `packages.ts` (single source of truth). Sửa giá/label
 * ở 1 chỗ, mọi UI + service tự cập nhật theo.
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
            <PackageRow
              key={pkg.type}
              pkg={pkg}
              selected={selectedPackage === pkg.type}
              onSelect={setSelectedPackage}
            />
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

interface PackageRowProps {
  pkg: PackageInfo;
  selected: boolean;
  onSelect: (type: PackageType) => void;
}

function PackageRow({ pkg, selected, onSelect }: PackageRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(pkg.type)}
      className={`relative flex items-center justify-between rounded-2xl border-2 p-4 text-left transition-all ${
        selected
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
            selected
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
        {pkg.originalPrice && (
          <div className="text-xs text-slate-400 line-through">
            {formatPrice(pkg.originalPrice)}
          </div>
        )}
      </div>

      {selected && (
        <div className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-indigo-500 shadow-lg">
          <Check className="size-4 text-white" />
        </div>
      )}
    </button>
  );
}
