"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Crown,
  CreditCard,
  Check,
  Loader2,
  Sparkles,
  Calendar,
  Clock,
  Shield,
  Star,
  Zap,
  ChevronRight,
  User,
  Mail,
  ArrowRight,
  UserCircle,
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
import { useCreateOrder } from "@/features/payment/hooks/use-create-order";
import { PACKAGES, type PackageInfo } from "@/features/payment/services/packages";
import type { PackageType } from "@/features/payment/types/schemas";

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
  const [selectedPackage, setSelectedPackage] = useState<PackageType>("6_MONTH");
  const { createOrder, isLoading } = useCreateOrder({
    onSuccess: (order) => {
      router.push(`/upgrade/${order.id}` as never);
    },
  });

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
    try {
      await createOrder(selectedPackage);
    } catch (error) {
      // Error already shown via hook state
      console.error("Order create error:", error);
    }
  };

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

      {/* Quick Link to Profile */}
      <a href="/profile">
        <Card className="hover:shadow-lg transition-all cursor-pointer group border-dashed border-2 border-slate-200 hover:border-indigo-300 bg-slate-50/50 hover:bg-indigo-50/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                <UserCircle className="size-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  Hồ sơ cá nhân
                  <span className="text-xs font-medium text-slate-500 group-hover:text-indigo-600 transition-colors">
                    Cập nhật thông tin & đổi mật khẩu
                  </span>
                </h3>
                <p className="text-sm text-slate-500">Quản lý thông tin cá nhân và bảo mật tài khoản</p>
              </div>
            </div>
            <ChevronRight className="size-5 text-slate-400 group-hover:translate-x-1 group-hover:text-indigo-500 transition-all" />
          </CardContent>
        </Card>
      </a>

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
              <AccountPackageCard
                key={pkg.type}
                pkg={pkg}
                selected={selectedPackage === pkg.type}
                onSelect={setSelectedPackage}
              />
            ))}
          </div>

          {/* Payment Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Thông tin thanh toán</CardTitle>
              <CardDescription>
                Sau khi bấm "Tiếp tục" bạn sẽ nhận mã QR SePay để chuyển khoản
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
                    Đang tạo đơn...
                  </>
                ) : (
                  <>
                    <Crown className="size-5 mr-2" />
                    Tiếp tục thanh toán
                  </>
                )}
              </Button>

              <p className="text-xs text-slate-400 text-center">
                * Hệ thống sẽ tạo đơn hàng SePay và hiển thị mã QR. Sau khi chuyển
                khoản thành công, tài khoản sẽ tự động được nâng cấp Premium.
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

interface AccountPackageCardProps {
  pkg: PackageInfo;
  selected: boolean;
  onSelect: (type: PackageType) => void;
}

function AccountPackageCard({ pkg, selected, onSelect }: AccountPackageCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(pkg.type)}
      className={`relative flex flex-col rounded-2xl border-2 p-5 text-left transition-all ${
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
      {selected && (
        <div className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-indigo-500 shadow-lg">
          <Check className="size-4 text-white" />
        </div>
      )}
    </button>
  );
}
