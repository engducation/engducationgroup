"use client";

import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, BookOpen, ReceiptText, Star } from "lucide-react";
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
}> = [
  {
    title: "Quản lý khóa học",
    description: "Tạo course, pricing, certificate và content workspace.",
    href: "/admin/courses",
    icon: BookOpen,
  },
  {
    title: "Transactions & doanh thu",
    description: "Theo dõi giao dịch thanh toán và hiệu suất doanh thu.",
    href: "/admin/orders",
    icon: ReceiptText,
  },
  {
    title: "Quản lý đánh giá",
    description: "Phản hồi review và kiểm soát hiển thị.",
    href: "/admin/reviews",
    icon: Star,
  },
];

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useAdminDashboardOverview();
  const overview = data as any;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Dashboard admin</h1>
        <p className="mt-1 text-sm text-slate-600">Số liệu thật về khóa học, giao dịch và doanh thu.</p>
      </section>

      {error ? (
        <Card className="border-red-200">
          <CardContent className="p-6 text-sm text-red-600">{error}</CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="border-slate-200">
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Tổng khóa học", value: overview?.totals?.totalCourses ?? 0 },
            { label: "Khóa học published", value: overview?.totals?.publishedCourses ?? 0 },
            { label: "Giao dịch chờ xử lý", value: overview?.totals?.pendingOrders ?? 0 },
            {
              label: "Tổng doanh thu",
              value: `${Number(overview?.totals?.totalRevenue ?? 0).toLocaleString("vi-VN")}đ`,
            },
          ].map((item) => (
            <Card key={item.label} className="border-slate-200">
              <CardHeader className="pb-3">
                <CardDescription className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {item.label}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tracking-tight text-slate-950">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Phân bổ gói dịch vụ</CardTitle>
            <CardDescription>Thống kê lượt mua theo từng gói thời hạn.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-20 w-full" />)
              : (overview?.packageDistribution ?? []).map((pkg: any) => (
                  <div key={pkg.packageType} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{pkg.label}</p>
                      <p className="mt-1 text-sm text-slate-600">{pkg.count} giao dịch thành công</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-950">{Number(pkg.revenue ?? 0).toLocaleString("vi-VN")}đ</p>
                  </div>
                ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Điều hướng nhanh</CardTitle>
            <CardDescription>Các phân hệ vận hành chính của admin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                  <ArrowRight className="mt-1 size-4 text-slate-400" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
