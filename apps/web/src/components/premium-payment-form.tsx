"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Crown, CreditCard, Check, Loader2, Sparkles, Tag, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateOrder } from "@/features/payment/hooks/use-create-order";
import { useVoucher } from "@/features/payment/hooks/use-voucher";
import type { PackageType } from "@/features/payment/types/schemas";
import { toast } from "sonner";

interface PremiumPaymentFormProps {
  defaultPackage?: PackageType;
}

interface DynamicPackage {
  packageType: PackageType;
  label: string;
  description: string;
  basePrice: number;
  currentPrice: number;
  originalPrice: number;
  discountPercent: number;
  isDiscounted: boolean;
  recommended: boolean;
  duration: number;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN").format(price) + "đ";

/**
 * Bước 1: chọn gói → POST /api/payment/orders → navigate sang /upgrade/[orderId].
 * Không auto-complete ở đây nữa — QR & polling nằm ở trang tiếp theo.
 *
 * Danh sách gói đọc từ /api/pricing (dynamic pricing từ DB).
 */
export function PremiumPaymentForm({
  defaultPackage = "6_MONTH",
}: PremiumPaymentFormProps) {
  const router = useRouter();
  const [packages, setPackages] = useState<DynamicPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<PackageType>(defaultPackage);
  const [voucherInput, setVoucherInput] = useState("");
  const [showVoucherInput, setShowVoucherInput] = useState(false);

  const { createOrder, isLoading, error } = useCreateOrder({
    onSuccess: (order) => {
      router.push(`/upgrade/${order.id}` as never);
    },
  });

  const { voucher, loading: voucherLoading, error: voucherError, validate, clear } = useVoucher();

  const selectedPkg = packages.find((p) => p.packageType === selectedPackage);

  // Fetch dynamic packages from API
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await fetch("/api/pricing");
        if (!res.ok) throw new Error("Failed to fetch pricing");
        const data = await res.json();
        setPackages(data);

        // Set recommended package as default
        const recommended = data.find((p: DynamicPackage) => p.recommended);
        if (recommended) {
          setSelectedPackage(recommended.packageType);
        }
      } catch (err) {
        console.error("Error fetching pricing:", err);
        toast.error("Không thể tải thông tin giá");
      } finally {
        setLoadingPackages(false);
      }
    };

    void fetchPackages();
  }, []);

  const handleValidateVoucher = useCallback(async () => {
    if (!voucherInput.trim() || !selectedPkg) {
      clear();
      return;
    }
    await validate(voucherInput.trim(), selectedPackage, selectedPkg.currentPrice);
  }, [voucherInput, selectedPackage, selectedPkg, validate, clear]);

  // Auto-validate when voucher input changes (debounced)
  useEffect(() => {
    if (!voucherInput.trim()) {
      clear();
      return;
    }
    const timer = setTimeout(() => {
      void handleValidateVoucher();
    }, 500);
    return () => clearTimeout(timer);
  }, [voucherInput, handleValidateVoucher, clear]);

  const handleSubmit = () => {
    void createOrder(selectedPackage, voucher?.code);
  };

  const basePrice = selectedPkg?.currentPrice ?? 0;
  const finalPrice = voucher ? voucher.finalPrice : basePrice;
  const hasDiscount = (selectedPkg?.isDiscounted && selectedPkg.discountPercent > 0) || (voucher && voucher.discountAmount > 0);

  if (loadingPackages) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Package selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Chọn gói Premium</h3>
        <div className="grid gap-4">
          {packages.map((pkg) => (
            <PackageRow
              key={pkg.packageType}
              pkg={pkg}
              selected={selectedPackage === pkg.packageType}
              onSelect={() => {
                setSelectedPackage(pkg.packageType);
                // Clear voucher when changing package
                if (voucher) clear();
              }}
              appliedVoucher={selectedPackage === pkg.packageType ? voucher : undefined}
            />
          ))}
        </div>
      </div>

      {/* Voucher Input */}
      <div className="space-y-3">
        {!showVoucherInput ? (
          <button
            type="button"
            onClick={() => setShowVoucherInput(true)}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <Tag className="size-4" />
            Nhập mã voucher giảm giá
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Nhập mã voucher (VD: SUMMER2025)"
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                className="font-mono uppercase"
                disabled={voucherLoading}
              />
              {voucherInput && (
                <button
                  type="button"
                  onClick={() => {
                    setVoucherInput("");
                    clear();
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Voucher validation result */}
            {voucherLoading && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin" />
                Đang kiểm tra voucher...
              </div>
            )}

            {voucherError && !voucherLoading && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="size-4 shrink-0" />
                {voucherError}
              </div>
            )}

            {voucher && !voucherLoading && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg">
                <Check className="size-4 shrink-0" />
                <div>
                  <span className="font-semibold">Áp dụng thành công!</span>
                  {voucher.type === "PERCENTAGE" ? (
                    <span> Giảm {voucher.value}%</span>
                  ) : (
                    <span> Giảm {formatPrice(voucher.value)}</span>
                  )}
                  {voucher.maxDiscount && voucher.type === "PERCENTAGE" && (
                    <span className="text-slate-500"> (tối đa {formatPrice(voucher.maxDiscount)})</span>
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShowVoucherInput(false);
                setVoucherInput("");
                clear();
              }}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Đóng
            </button>
          </div>
        )}
      </div>

      {/* Price Summary with Discount */}
      {selectedPkg && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          {selectedPkg.isDiscounted && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Giá gốc:</span>
                <span className="text-slate-400 line-through">
                  {formatPrice(selectedPkg.originalPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Giảm giá hệ thống:</span>
                <span className="text-emerald-600 font-semibold">
                  -{selectedPkg.discountPercent}%
                </span>
              </div>
            </>
          )}

          {voucher && voucher.discountAmount > 0 && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Voucher:</span>
                <span className="text-emerald-600 font-semibold">
                  -{formatPrice(voucher.discountAmount)}
                </span>
              </div>
            </>
          )}

          {hasDiscount && <div className="h-px bg-slate-200" />}

          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900">Thành tiền:</span>
            <span className="text-xl font-black text-indigo-600">
              {formatPrice(finalPrice)}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200/60 bg-red-50/60 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading || loadingPackages}
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
  pkg: DynamicPackage;
  selected: boolean;
  onSelect: () => void;
  appliedVoucher?: {
    code: string;
    type: "PERCENTAGE" | "FIXED";
    value: number;
    discountAmount: number;
    finalPrice: number;
  } | null;
}

function PackageRow({ pkg, selected, onSelect, appliedVoucher }: PackageRowProps) {
  const hasSystemDiscount = pkg.isDiscounted && pkg.discountPercent > 0;
  const hasVoucherDiscount = appliedVoucher && appliedVoucher.discountAmount > 0;
  const hasDiscount = hasSystemDiscount || hasVoucherDiscount;

  // Final price calculation
  let displayPrice = pkg.currentPrice;
  let originalDisplayPrice = pkg.originalPrice;

  if (hasVoucherDiscount && appliedVoucher) {
    // If voucher is applied, show the discounted price after voucher
    displayPrice = appliedVoucher.finalPrice;
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex items-center justify-between rounded-2xl border-2 p-4 text-left transition-all ${
        selected
          ? "border-indigo-500 bg-indigo-50/50 shadow-lg shadow-indigo-500/10"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
      }`}
    >
      {pkg.recommended && !hasDiscount && (
        <span className="absolute -top-3 left-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
          Phổ biến nhất
        </span>
      )}

      {hasDiscount && (
        <span className="absolute -top-3 left-4 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
          -{pkg.discountPercent}{hasVoucherDiscount ? "+" : ""}%
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
        {hasDiscount ? (
          <>
            <div className="text-xl font-bold text-emerald-600">
              {formatPrice(displayPrice)}
            </div>
            <div className="text-xs text-slate-400 line-through">
              {formatPrice(originalDisplayPrice)}
            </div>
            {hasSystemDiscount && (
              <div className="text-[10px] text-emerald-600 font-semibold">
                Giảm {pkg.discountPercent}%
              </div>
            )}
            {hasVoucherDiscount && appliedVoucher && (
              <div className="text-[10px] text-indigo-600 font-semibold">
                + Voucher
              </div>
            )}
          </>
        ) : (
          <div className="text-xl font-bold text-slate-900">
            {formatPrice(pkg.currentPrice)}
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
