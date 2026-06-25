"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CreditCard,
  Package,
  ReceiptText,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAdminDashboardOverview } from "@/features/admin/hooks/use-admin-api";
import { Skeleton } from "@/components/ui/skeleton";

const quickLinks: Array<{
  title: string;
  description: string;
  href: Route;
  icon: typeof BookOpen;
  accent: string;
}> = [
  {
    title: "Quản lý khóa học",
    description: "Tạo khóa học, quản lý nội dung và cấu hình pricing.",
    href: "/admin/courses",
    icon: BookOpen,
    accent: "from-indigo-500 to-indigo-600",
  },
  {
    title: "Giao dịch & doanh thu",
    description: "Theo dõi giao dịch, doanh thu và tình trạng thanh toán.",
    href: "/admin/orders",
    icon: ReceiptText,
    accent: "from-violet-500 to-violet-600",
  },
  {
    title: "Đánh giá học viên",
    description: "Phản hồi review và kiểm soát hiển thị đánh giá.",
    href: "/admin/reviews",
    icon: Star,
    accent: "from-amber-500 to-amber-600",
  },
];

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  trend,
  isLoading,
}: {
  label: string;
  value: string | number;
  icon: typeof BookOpen;
  accent: string;
  trend?: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="border-slate-200/80 bg-white">
        <CardContent className="p-6">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-16" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200/80 bg-white overflow-hidden group hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              {label}
            </p>
            <p className="text-2xl font-bold tracking-tight text-slate-950">
              {value}
            </p>
            {trend && (
              <p className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <ArrowUpRight className="size-3" />
                {trend}
              </p>
            )}
          </div>
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} shadow-lg shadow-current/20`}
          >
            <Icon className="size-5 text-white" />
          </div>
        </div>
      </CardContent>
      {/* Subtle accent line at bottom */}
      <div className={`h-0.5 w-full bg-gradient-to-r ${accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
    </Card>
  );
}

function PackageRow({
  label,
  count,
  revenue,
  color,
}: {
  label: string;
  count: number;
  revenue: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className={`size-2 rounded-full shrink-0 ${color}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-700 truncate">{label}</p>
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-xs text-slate-400">{count} đơn</span>
            <span className="text-sm font-semibold text-slate-950 tabular-nums">
              {revenue.toLocaleString("vi-VN")}đ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useAdminDashboardOverview();
  const overview = data as any;

  const totalRevenue = Number(overview?.totals?.totalRevenue ?? 0);
  const publishedCourses = Number(overview?.totals?.publishedCourses ?? 0);
  const totalCourses = Number(overview?.totals?.totalCourses ?? 0);
  const pendingOrders = Number(overview?.totals?.pendingOrders ?? 0);
  const todayRevenue = Number(overview?.totals?.todayRevenue ?? 0);

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Tổng quan
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Số liệu khóa học, giao dịch và hoạt động hệ thống.
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-4 py-2 shadow-sm sm:flex">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-slate-600">
            Hệ thống hoạt động tốt
          </span>
        </div>
      </div>

      {/* Error state */}
      {error ? (
        <Card className="border-red-200/60 bg-red-50/50">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-red-100">
              <Star className="size-4 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-700">Không thể tải dữ liệu</p>
              <p className="text-xs text-red-600/80">{String(error)}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng doanh thu"
          value={`${totalRevenue.toLocaleString("vi-VN")}đ`}
          icon={TrendingUp}
          accent="from-emerald-500 to-teal-600"
          isLoading={isLoading}
        />
        <StatCard
          label="Doanh thu hôm nay"
          value={`${todayRevenue.toLocaleString("vi-VN")}đ`}
          icon={Star}
          accent="from-indigo-500 to-violet-600"
          isLoading={isLoading}
        />
        <StatCard
          label="Đơn chờ xử lý"
          value={pendingOrders}
          icon={CreditCard}
          accent="from-amber-500 to-orange-600"
          isLoading={isLoading}
        />
        <StatCard
          label="Giao dịch thành công"
          value={overview?.totals?.successOrders ?? 0}
          icon={ReceiptText}
          accent="from-violet-500 to-purple-600"
          isLoading={isLoading}
        />
      </div>

      {/* Bottom grid */}
      <div className="grid gap-6 xl:grid-cols-5">
        {/* Revenue breakdown */}
        <Card className="xl:col-span-3 border-slate-200/80 bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Phân bổ doanh thu</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Theo gói dịch vụ
                </CardDescription>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <Package className="size-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3">
                  <Skeleton className="size-2 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))
            ) : (overview?.packageDistribution ?? []).length > 0 ? (
              (overview.packageDistribution as any[]).map((pkg: any, idx: number) => (
                <PackageRow
                  key={pkg.packageType}
                  label={pkg.label}
                  count={pkg.count}
                  revenue={pkg.revenue ?? 0}
                  color={[
                    "bg-indigo-500",
                    "bg-violet-500",
                    "bg-amber-500",
                    "bg-emerald-500",
                    "bg-sky-500",
                  ][idx % 5]}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-sm text-slate-400">
                <Package className="size-8 mb-2 opacity-30" />
                Chưa có dữ liệu doanh thu.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick nav */}
        <Card className="xl:col-span-2 border-slate-200/80 bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Điều hướng nhanh</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Truy cập nhanh các phân hệ
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 rounded-xl border border-transparent p-4 transition-all duration-200 hover:border-slate-200/80 hover:bg-slate-50/80 group`}
                >
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} shadow-md shadow-current/20`}
                  >
                    <Icon className="size-4.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-950 leading-tight">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-indigo-400" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
