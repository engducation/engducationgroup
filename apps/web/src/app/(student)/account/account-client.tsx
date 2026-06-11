"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Crown,
  CreditCard,
  Check,
  Loader2,
  ArrowRight,
  Sparkles,
  Calendar,
  Clock,
  Shield,
  Star,
  Zap,
  ChevronRight,
  User,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface AccountClientProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    subscriptionPlan: string | null;
    expiresAt: Date | null;
    activatedAt: Date | null;
  };
  isPremium: boolean;
  daysRemaining: number;
}

const PACKAGES = [
  {
    type: "MONTHLY",
    label: "Gói 1 Tháng",
    price: 49000,
    duration: 30,
    description: "Truy cập tất cả khóa học trong 30 ngày",
    features: [
      "Học từ vựng theo danh mục",
      "Làm quiz trắc nghiệm cơ bản",
      "Xem video bài giảng",
    ],
    recommended: false,
  },
  {
    type: "6_MONTH",
    label: "Gói 6 Tháng",
    price: 269000,
    duration: 180,
    originalPrice: 294000,
    description: "Tiết kiệm 8% - Truy cập trong 180 ngày",
    features: [
      "Tất cả quyền lợi gói 1 Tháng",
      "Xem không giới hạn video bài giảng",
      "Quiz trắc nghiệm nâng cao",
      "AI Writing Assistant (giới hạn)",
    ],
    recommended: true,
  },
  {
    type: "YEAR",
    label: "Gói 1 Năm",
    price: 499000,
    duration: 365,
    originalPrice: 588000,
    description: "Tiết kiệm 15% - Truy cập trong 365 ngày",
    features: [
      "Tất cả quyền lợi gói 6 Tháng",
      "AI Writing Assistant không giới hạn",
      "Báo cáo phân tích lộ trình học tập",
      "Hỗ trợ ưu tiên 24/7",
    ],
    recommended: false,
  },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

function formatDate(date: Date | string | null) {
  if (!date) return "Chưa có";
  const d = new Date(date);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function AccountClient({
  user,
  isPremium,
  daysRemaining,
}: AccountClientProps) {
  const router = useRouter();
  const [selectedPackage, setSelectedPackage] = useState("6_MONTH");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Refresh subscription status periodically
  useEffect(() => {
    if (isPremium) {
      const interval = setInterval(() => {
        router.refresh();
      }, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [isPremium, router]);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/student/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageType: selectedPackage }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSuccess(true);
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

  // Success screen
  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f8f7f4]/80 backdrop-blur-sm">
        <div className="text-center animate-in fade-in-0 zoom-in-95 duration-300">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl">
            <Check className="size-10 text-white" />
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Tài khoản của tôi</h1>
        <p className="text-sm text-slate-500">
          Quản lý thông tin tài khoản và gói dịch vụ của bạn
        </p>
      </div>

      {/* Current Subscription Status */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Crown className="size-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/80">Gói hiện tại</p>
                <p className="text-xl font-bold text-white">
                  {isPremium ? "Premium Member" : "Tài khoản Free"}
                </p>
              </div>
            </div>
            {isPremium && (
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <Sparkles className="size-3 mr-1" />
                Đang hoạt động
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-6">
          {/* User Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100">
                <User className="size-5 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Họ và tên</p>
                <p className="text-sm font-semibold text-slate-900">
                  {user.name || "Chưa cập nhật"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100">
                <Mail className="size-5 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm font-semibold text-slate-900">
                  {user.email || "Chưa cập nhật"}
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Subscription Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
              <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-100">
                <Shield className="size-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Gói dịch vụ</p>
                <p className="text-sm font-bold text-slate-900">
                  {user.subscriptionPlan || "FREE"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100">
                <Calendar className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Ngày kích hoạt</p>
                <p className="text-sm font-bold text-slate-900">
                  {formatDate(user.activatedAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100">
                <Clock className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">
                  {isPremium ? "Còn lại" : "Ngày hết hạn"}
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {isPremium
                    ? `${daysRemaining} ngày`
                    : user.expiresAt
                    ? formatDate(user.expiresAt)
                    : "Không giới hạn"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Section - Only show if not premium */}
      {!isPremium && (
        <div className="space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Zap className="size-5 text-amber-500" />
                Nâng cấp Premium
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Chọn gói phù hợp và mở khóa toàn bộ khóa học
              </p>
            </div>
          </div>

          {/* Package Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PACKAGES.map((pkg) => (
              <button
                key={pkg.type}
                onClick={() => setSelectedPackage(pkg.type)}
                className={`relative flex flex-col rounded-2xl border-2 p-5 text-left transition-all ${
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

                <div className="space-y-3 flex-1">
                  <div>
                    <h3 className="font-bold text-slate-900">{pkg.label}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-extrabold text-slate-900">
                        {formatPrice(pkg.price)}
                      </span>
                      {pkg.originalPrice && (
                        <span className="text-sm text-slate-400 line-through">
                          {formatPrice(pkg.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">{pkg.description}</p>

                  <ul className="space-y-2">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                        <Check className="size-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
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

          {/* Payment Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Thông tin thanh toán</CardTitle>
              <CardDescription>
                Thanh toán qua chuyển khoản ngân hàng (mô phỏng)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Gói:</span>
                  <span className="font-semibold">
                    {PACKAGES.find((p) => p.type === selectedPackage)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời hạn:</span>
                  <span className="font-semibold">
                    {PACKAGES.find((p) => p.type === selectedPackage)?.duration} ngày
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nội dung CK:</span>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                    NAP TIEN {selectedPackage}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngân hàng:</span>
                  <span className="font-semibold">Engducation Bank</span>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-slate-900">Tổng thanh toán:</span>
                <span className="text-2xl font-extrabold text-indigo-600">
                  {formatPrice(
                    PACKAGES.find((p) => p.type === selectedPackage)?.price || 0
                  )}
                </span>
              </div>

              <Button
                onClick={handleUpgrade}
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
                    Xác nhận nâng cấp Premium
                  </>
                )}
              </Button>

              <p className="text-xs text-slate-400 text-center">
                * Đây là trang thanh toán giả lập. Nhấn nút trên để kích hoạt Premium ngay lập tức.
              </p>
            </CardContent>
          </Card>

          {/* Benefits Summary */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="size-5 text-amber-400" />
                <h3 className="font-bold text-white">Quyền lợi khi làm Premium</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Truy cập tất cả khóa học",
                  "Xem video bài giảng không giới hạn",
                  "AI Writing Assistant thông minh",
                  "Quiz nâng cao theo chủ đề",
                  "Theo dõi lộ trình học tập",
                  "Hỗ trợ ưu tiên 24/7",
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="size-4 text-emerald-400 shrink-0" />
                    {benefit}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions for Premium Users */}
      {isPremium && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/courses">
            <Card className="hover:shadow-lg transition-all cursor-pointer group">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-100">
                    <CreditCard className="size-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Khóa học của tôi</h3>
                    <p className="text-sm text-slate-500">Xem danh sách khóa học đã đăng ký</p>
                  </div>
                </div>
                <ChevronRight className="size-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/notebook">
            <Card className="hover:shadow-lg transition-all cursor-pointer group">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-100">
                    <Sparkles className="size-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Sổ từ vựng</h3>
                    <p className="text-sm text-slate-500">Học và luyện tập từ vựng</p>
                  </div>
                </div>
                <ChevronRight className="size-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}
