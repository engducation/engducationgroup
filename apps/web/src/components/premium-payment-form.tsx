"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Check, Loader2, Crown, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PackageInfo {
  type: string;
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
  defaultPackage?: string;
}

export function PremiumPaymentForm({ defaultPackage = "MONTHLY" }: PremiumPaymentFormProps) {
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState(defaultPackage);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/student/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageType: selectedPackage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
        // Wait for animation then redirect
        setTimeout(() => {
          router.push("/courses");
          router.refresh();
        }, 2000);
      } else {
        alert(data.error || "Có lỗi xảy ra. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <div className="text-center animate-in fade-in-0 zoom-in-95 duration-300">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-emerald-100">
            <Check className="size-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Nâng cấp thành công!
          </h2>
          <p className="text-slate-500">
            Đang chuyển hướng về trang khóa học...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Package selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Chọn gói Premium</h3>
        <div className="grid gap-4">
          {PACKAGES.map((pkg) => (
            <button
              key={pkg.type}
              onClick={() => setSelectedPackage(pkg.type)}
              className={`relative flex items-center justify-between rounded-2xl border-2 p-4 transition-all ${
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
                <div className="text-left">
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

              {/* Selected indicator */}
              {selectedPackage === pkg.type && (
                <div className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-indigo-500 shadow-lg">
                  <Check className="size-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Payment info */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 space-y-4">
        <h3 className="font-bold text-slate-900">Thông tin thanh toán</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Nội dung chuyển khoản:</span>
            <code className="rounded-lg bg-white px-3 py-1.5 font-mono text-xs font-semibold text-slate-900 shadow-sm">
              NAP TIEN {selectedPackage}
            </code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Số tài khoản:</span>
            <span className="font-semibold text-slate-900">1234 5678 9012 (VIP)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Ngân hàng:</span>
            <span className="font-semibold text-slate-900">Engducation Bank</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Số tiền:</span>
            <span className="font-bold text-indigo-600">
              {formatPrice(PACKAGES.find((p) => p.type === selectedPackage)?.price || 0)}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          * Đây là trang thanh toán giả lập. Nhấn &quot;Xác nhận đã thanh toán&quot; để kích hoạt Premium ngay lập tức.
        </p>
      </div>

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-lg shadow-indigo-500/25 h-12 text-base"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-5 mr-2 animate-spin" />
            Đang xử lý...
          </>
        ) : (
          <>
            <Crown className="size-5 mr-2" />
            Xác nhận đã thanh toán
          </>
        )}
      </Button>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-6 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Clock className="size-4" />
          <span>Kích hoạt tức thì</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles className="size-4" />
          <span>Khóa học không giới hạn</span>
        </div>
      </div>
    </div>
  );
}
