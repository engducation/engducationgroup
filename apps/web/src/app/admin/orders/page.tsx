"use client";

import { CreditCard, ReceiptText, TrendingUp, WalletCards } from "lucide-react";

import { useAdminOrderAnalytics, useAdminTransactions } from "@/features/admin/hooks/use-admin-api";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function TransactionStatusBadge({ status }: { status: string }) {
  if (status === "SUCCESS") {
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Success</Badge>;
  }

  if (status === "FAILED") {
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Failed</Badge>;
  }

  return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>;
}

export default function AdminOrdersPage() {
  const transactionsQuery = useAdminTransactions();
  const analyticsQuery = useAdminOrderAnalytics();
  const transactions = (transactionsQuery.data ?? []) as any[];
  const analytics = analyticsQuery.data as any;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Gói dịch vụ &amp; doanh thu</h1>
        <p className="mt-1 text-sm text-slate-600">
          Theo dõi doanh thu, số giao dịch và lịch sử thanh toán gói hội viên.
        </p>
      </section>

      {analyticsQuery.isLoading ? (
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
            {
              label: "Tổng doanh thu",
              value: `${Number(analytics?.totalRevenue ?? 0).toLocaleString("vi-VN")}đ`,
              icon: WalletCards,
            },
            {
              label: "Giao dịch thành công",
              value: Number(analytics?.successOrders ?? 0),
              icon: TrendingUp,
            },
            {
              label: "Giao dịch chờ xử lý",
              value: Number(analytics?.pendingOrders ?? 0),
              icon: ReceiptText,
            },
            {
              label: "Giao dịch thất bại",
              value: Number(analytics?.failedOrders ?? 0),
              icon: CreditCard,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardDescription className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {item.label}
                    </CardDescription>
                    <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <Icon className="size-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold tracking-tight text-slate-950">{item.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}

      {transactionsQuery.error ? (
        <Card className="border-red-200">
          <CardContent className="p-6 text-sm text-red-600">{transactionsQuery.error}</CardContent>
        </Card>
      ) : null}

      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ReceiptText className="size-5 text-indigo-500" />
            <CardTitle>Lịch sử transactions</CardTitle>
          </div>
          <CardDescription>
            Danh sách giao dịch phát sinh từ hệ thống thanh toán, dùng để theo dõi doanh thu và trạng thái thanh toán.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {transactionsQuery.isLoading ? (
            Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 w-full" />)
          ) : transactions.length ? (
            transactions.map((transaction: any) => (
              <div key={transaction.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-950">{transaction.id}</p>
                      <TransactionStatusBadge status={transaction.status} />
                    </div>
                    <p className="text-sm text-slate-600">
                      Người thanh toán: {transaction.user?.name ?? transaction.userId}
                    </p>
                    <p className="text-sm text-slate-600">User ID: {transaction.userId}</p>
                    <p className="text-sm text-slate-600">Gói: {transaction.packageType}</p>
                    <p className="text-sm text-slate-600">Phương thức: {transaction.paymentMethod}</p>
                  </div>
                  <div className="space-y-2 text-left lg:text-right">
                    <p className="text-base font-semibold text-slate-950">
                      {Number(transaction.amount ?? 0).toLocaleString("vi-VN")}đ
                    </p>
                    <p className="text-sm text-slate-600">
                      {new Date(transaction.createdAt).toLocaleString("vi-VN")}
                    </p>
                    {transaction.rejectionReason ? (
                      <p className="text-sm text-red-600">Lý do lỗi: {transaction.rejectionReason}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              Chưa có transaction nào để hiển thị.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
