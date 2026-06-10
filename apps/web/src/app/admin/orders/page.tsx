"use client";

import {
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Package,
  ReceiptText,
  TrendingUp,
  XCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAdminOrderAnalytics, useAdminTransactions } from "@/features/admin/hooks/use-admin-api";
import { Skeleton } from "@/components/ui/skeleton";

function TransactionStatusBadge({ status }: { status: string }) {
  if (status === "SUCCESS") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
        <CheckCircle className="size-3 shrink-0" />
        Thành công
      </span>
    );
  }
  if (status === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 border border-red-100">
        <XCircle className="size-3 shrink-0" />
        Thất bại
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-100">
      <Clock className="size-3 shrink-0" />
      Đang chờ
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  isLoading,
}: {
  label: string;
  value: string | number;
  icon: typeof TrendingUp;
  accent: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="border-slate-200/80 bg-white">
        <CardContent className="p-5">
          <Skeleton className="h-3 w-20 mb-3" />
          <Skeleton className="h-8 w-28" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200/80 bg-white overflow-hidden group hover:shadow-md transition-shadow duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              {value}
            </p>
          </div>
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} shadow-lg shadow-current/20`}
          >
            <Icon className="size-4.5 text-white" />
          </div>
        </div>
      </CardContent>
      <div className={`h-0.5 w-full bg-gradient-to-r ${accent} opacity-0 group-hover:opacity-100 transition-opacity`} />
    </Card>
  );
}

function TransactionRow({ t }: { t: any }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors group">
      {/* Status icon */}
      <div className="shrink-0">
        {t.status === "SUCCESS" && (
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100">
            <CheckCircle className="size-4 text-emerald-600" />
          </div>
        )}
        {t.status === "FAILED" && (
          <div className="flex size-9 items-center justify-center rounded-xl bg-red-100">
            <XCircle className="size-4 text-red-600" />
          </div>
        )}
        {t.status === "PENDING" && (
          <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100">
            <Clock className="size-4 text-amber-600" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-950 truncate">
            {t.user?.name ?? t.userId}
          </p>
          <TransactionStatusBadge status={t.status} />
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
            {t.packageType}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span>{t.paymentMethod}</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline font-mono text-[10px]">{t.id}</span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">{new Date(t.createdAt).toLocaleString("vi-VN")}</span>
        </div>
        {t.rejectionReason && (
          <p className="mt-1 text-xs text-red-600 font-medium">
            Lý do lỗi: {t.rejectionReason}
          </p>
        )}
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right">
        <p className="text-base font-bold text-slate-950 tabular-nums">
          {Number(t.amount ?? 0).toLocaleString("vi-VN")}đ
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          {new Date(t.createdAt).toLocaleDateString("vi-VN")}
        </p>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const transactionsQuery = useAdminTransactions();
  const analyticsQuery = useAdminOrderAnalytics();
  const transactions = (transactionsQuery.data ?? []) as any[];
  const analytics = analyticsQuery.data as any;

  const totalRevenue = Number(analytics?.totalRevenue ?? 0);
  const successOrders = Number(analytics?.successOrders ?? 0);
  const pendingOrders = Number(analytics?.pendingOrders ?? 0);
  const failedOrders = Number(analytics?.failedOrders ?? 0);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Giao dịch &amp; Doanh thu
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Theo dõi doanh thu, giao dịch và lịch sử thanh toán.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng doanh thu"
          value={`${totalRevenue.toLocaleString("vi-VN")}đ`}
          icon={TrendingUp}
          accent="from-emerald-500 to-teal-600"
          isLoading={analyticsQuery.isLoading}
        />
        <StatCard
          label="Giao dịch thành công"
          value={successOrders}
          icon={CheckCircle}
          accent="from-violet-500 to-purple-600"
          isLoading={analyticsQuery.isLoading}
        />
        <StatCard
          label="Đơn đang chờ"
          value={pendingOrders}
          icon={Clock}
          accent="from-amber-500 to-orange-600"
          isLoading={analyticsQuery.isLoading}
        />
        <StatCard
          label="Giao dịch thất bại"
          value={failedOrders}
          icon={XCircle}
          accent="from-red-500 to-rose-600"
          isLoading={analyticsQuery.isLoading}
        />
      </div>

      {/* Error state */}
      {transactionsQuery.error ? (
        <Card className="border-red-200/60 bg-red-50/50">
          <CardContent className="flex items-center gap-3 p-4">
            <p className="text-sm text-red-600">{String(transactionsQuery.error)}</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Transaction table */}
      <Card className="border-slate-200/80 bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <ReceiptText className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base">Lịch sử giao dịch</CardTitle>
              <CardDescription className="text-xs">
                {transactions.length > 0
                  ? `${transactions.length} giao dịch`
                  : "Không có giao dịch nào"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <div className="border-t">
          {transactionsQuery.isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <Skeleton className="size-9 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 mb-4">
                <ReceiptText className="size-7 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">Chưa có giao dịch nào</p>
              <p className="mt-1 text-xs text-slate-400">
                Transactions sẽ xuất hiện khi có học viên thanh toán.
              </p>
            </div>
          ) : (
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {transactions.map((t: any) => (
                <TransactionRow key={t.id} t={t} />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
