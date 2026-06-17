"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  CreditCard,
  Loader2,
  Search,
  XCircle,
  AlertTriangle,
  Crown,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminSepayApprove, useAdminSepayOrderDetail, useAdminSepayOrders } from "../../hooks/use-admin-sepay-orders";
import type {
  SepayOrderAdminRow,
  SepayOrderDetail,
} from "../../services/admin-order.service";
import type { OrderStatus } from "../../types/schemas";

const STATUS_FILTERS: Array<{ value: OrderStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Đang chờ" },
  { value: "SUCCESS", label: "Thành công" },
  { value: "FAILED", label: "Thất bại" },
  { value: "EXPIRED", label: "Hết hạn" },
];

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("vi-VN").format(amount) + "đ";

const formatDate = (value: string) =>
  new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { className: string; icon: React.ReactNode; label: string }> = {
    PENDING: {
      className: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <Clock className="size-3" />,
      label: "Đang chờ",
    },
    SUCCESS: {
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <CheckCircle className="size-3" />,
      label: "Thành công",
    },
    FAILED: {
      className: "bg-red-50 text-red-700 border-red-200",
      icon: <XCircle className="size-3" />,
      label: "Thất bại",
    },
    EXPIRED: {
      className: "bg-slate-50 text-slate-700 border-slate-200",
      icon: <AlertTriangle className="size-3" />,
      label: "Hết hạn",
    },
  };
  const { className, icon, label } = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}

export function SepayOrdersAdminTable() {
  const [status, setStatus] = useState<OrderStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const { data, isLoading, error, refetch } = useAdminSepayOrders();

  // Refetch khi đổi filter
  useEffect(() => {
    const handle = setTimeout(() => {
      void refetch({ status, search: search || undefined, limit: 100 });
    }, 300);
    return () => clearTimeout(handle);
  }, [status, search, refetch]);

  const orders = data?.rows ?? [];
  const analytics = data?.analytics;

  return (
    <div className="space-y-6">
      {/* Analytics row */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard
          label="Tổng doanh thu"
          value={formatPrice(analytics?.totalRevenue ?? 0)}
          icon={Crown}
          accent="from-emerald-500 to-teal-600"
        />
        <AnalyticsCard
          label="Đơn thành công"
          value={String(analytics?.successCount ?? 0)}
          icon={CheckCircle}
          accent="from-violet-500 to-purple-600"
        />
        <AnalyticsCard
          label="Đang chờ"
          value={String(analytics?.pendingCount ?? 0)}
          icon={Clock}
          accent="from-amber-500 to-orange-600"
        />
        <AnalyticsCard
          label="Hôm nay"
          value={formatPrice(analytics?.todayRevenue ?? 0)}
          icon={Sparkles}
          accent="from-indigo-500 to-blue-600"
        />
      </div>

      {/* Filter bar */}
      <Card className="border-slate-200/80 bg-white">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo orderCode, tên hoặc email..."
              className="h-9 pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatus(filter.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  status === filter.value
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-slate-200/80 bg-white">
        <CardHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Đơn hàng SePay</CardTitle>
              <p className="mt-0.5 text-xs text-slate-500">
                {orders.length} đơn{isLoading ? " (đang tải...)" : ""}
              </p>
            </div>
            {isLoading && <Loader2 className="size-4 animate-spin text-slate-400" />}
          </div>
        </CardHeader>
        <div className="divide-y">
          {error ? (
            <div className="flex items-center gap-3 p-6 text-sm text-red-600">
              <XCircle className="size-4" />
              {error}
            </div>
          ) : isLoading && orders.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="size-9 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <CreditCard className="size-8 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">Không có đơn nào.</p>
            </div>
          ) : (
            orders.map((order: SepayOrderAdminRow) => (
              <SepayOrderRow
                key={order.id}
                order={order}
                onChanged={() =>
                  void refetch({ status, search: search || undefined, limit: 100 })
                }
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── Row ────────────────────────────────────────────────────────────────────

function SepayOrderRow({
  order,
  onChanged,
}: {
  order: SepayOrderAdminRow;
  onChanged: () => void;
}) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <div className="flex items-center gap-4 p-4 transition-colors hover:bg-slate-50/60">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
          <CreditCard className="size-4 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900">
              {order.userName ?? order.userEmail ?? "Unknown"}
            </p>
            <StatusBadge status={order.status} />
            <Badge variant="outline" className="text-[10px]">
              {order.packageLabel}
            </Badge>
            {order.transactionCount > 0 && (
              <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                {order.transactionCount} tx
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <code className="font-mono text-[10px]">{order.orderCode}</code>
            <span>•</span>
            <span>{formatDate(order.createdAt)}</span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold tabular-nums text-slate-900">
            {formatPrice(order.amount)}
          </p>
          <button
            type="button"
            onClick={() => setShowDetail(true)}
            className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Chi tiết <ArrowRight className="size-3" />
          </button>
        </div>
      </div>

      {showDetail && (
        <SepayOrderDetailDialog
          orderId={order.id}
          onClose={() => setShowDetail(false)}
          onApproved={() => {
            onChanged();
            setShowDetail(false);
          }}
        />
      )}
    </>
  );
}

// ─── Detail Dialog ──────────────────────────────────────────────────────────

function SepayOrderDetailDialog({
  orderId,
  onClose,
  onApproved,
}: {
  orderId: string;
  onClose: () => void;
  onApproved: () => void;
}) {
  const { data, isLoading, refetch: loadDetail } = useAdminSepayOrderDetail();
  const { approve, isLoading: isApproving, error: approveError } = useAdminSepayApprove();
  const [note, setNote] = useState("");

  useEffect(() => {
    void loadDetail(orderId);
  }, [orderId, loadDetail]);

  const order = data;
  const isApproveable = order?.status === "PENDING";

  const handleApprove = async () => {
    const result = await approve(orderId, { note: note || undefined });
    if (result) {
      onApproved();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white p-4">
          <h2 className="text-lg font-bold">Chi tiết đơn SePay</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full hover:bg-slate-100"
          >
            <XCircle className="size-4 text-slate-500" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {isLoading || !order ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              {/* Order summary */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Mã đơn" value={order.orderCode} mono />
                <Field
                  label="Trạng thái"
                  value={<StatusBadge status={order.status} />}
                />
                <Field
                  label="Học viên"
                  value={order.userName ?? order.userEmail ?? "—"}
                />
                <Field
                  label="Email"
                  value={order.userEmail ?? "—"}
                />
                <Field label="Gói" value={order.packageLabel} />
                <Field label="Số tiền" value={formatPrice(order.amount)} bold />
                <Field
                  label="Tạo lúc"
                  value={formatDate(order.createdAt)}
                />
                <Field
                  label="Hết hạn order"
                  value={formatDate(order.expiresAt)}
                />
                {order.subscriptionExpiresAt && (
                  <Field
                    label="Premium đến"
                    value={formatDate(order.subscriptionExpiresAt)}
                    className="col-span-2"
                  />
                )}
              </div>

              {/* Transactions list */}
              {order.transactions.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-slate-900">
                    Lịch sử giao dịch SePay ({order.transactions.length})
                  </h3>
                  <div className="space-y-2">
                    {order.transactions.map((tx: SepayOrderDetail["transactions"][number]) => (
                      <div
                        key={tx.id}
                        className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-slate-500">
                            {tx.id}
                          </span>
                          <span className="font-bold text-slate-900">
                            {formatPrice(tx.amountReceived)}
                          </span>
                        </div>
                        <p className="mt-1 text-slate-600">
                          {tx.content ?? tx.description}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {tx.gateway} • {formatDate(tx.receivedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual approve */}
              {isApproveable && (
                <div className="rounded-xl border-2 border-amber-200 bg-amber-50/40 p-4">
                  <h3 className="text-sm font-semibold text-amber-900">
                    Duyệt thủ công
                  </h3>
                  <p className="mt-1 text-xs text-amber-700">
                    Dành cho trường hợp SePay sandbox gặp sự cố hoặc nhận
                    chuyển khoản ngoài hệ thống. Sẽ tạo synthetic SePay
                    transaction và cấp quyền Premium.
                  </p>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ghi chú (tùy chọn)..."
                    className="mt-3 w-full rounded-lg border border-amber-200 bg-white p-2 text-sm"
                    rows={2}
                  />
                  {approveError && (
                    <p className="mt-2 text-xs text-red-600">{approveError}</p>
                  )}
                  <Button
                    type="button"
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="mt-3 w-full bg-amber-600 hover:bg-amber-700"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Đang duyệt...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="size-4 mr-2" />
                        Duyệt đơn & cấp Premium
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
  bold,
  className,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  bold?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p
        className={`mt-0.5 ${mono ? "font-mono text-xs" : "text-sm"} ${
          bold ? "font-bold text-slate-900" : "text-slate-700"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function AnalyticsCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <Card className="border-slate-200/80 bg-white">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {label}
            </p>
            <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              {value}
            </p>
          </div>
          <div
            className={`flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${accent}`}
          >
            <Icon className="size-4 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
