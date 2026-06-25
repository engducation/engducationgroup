"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Clock, XCircle, AlertTriangle, X, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Countdown } from "./payment-countdown";
import { Payment } from "./payment-shell";
import { useCancelOrder } from "../hooks/use-cancel-order";

/**
 * Panel status hiển thị trạng thái thanh toán.
 * Tự động start polling khi mount.
 *
 * Khi SUCCESS:
 * - Nếu showRefreshButton=true → hiển thị nút "Làm mới" để về account
 * - Nếu showRefreshButton=false → hiển thị "Đang chuyển hướng..." và auto-redirect
 */
interface PaymentStatusPanelProps {
  onSuccess?: () => void;
  /** Khi true, hiển thị nút "Làm mới" thay vì auto-redirect */
  showRefreshButton?: boolean;
}

export function PaymentStatusPanel({ onSuccess, showRefreshButton = false }: PaymentStatusPanelProps) {
  const router = useRouter();
  const { order, isPolling, startPolling, stopPolling } = Payment.usePayment();
  const [hasNavigated, setHasNavigated] = useState(false);
  const { cancelOrder, isLoading: isCancelling, error: cancelError } = useCancelOrder({
    onSuccess: () => {
      stopPolling();
      router.push("/upgrade");
    },
  });

  // Auto-start polling khi mount
  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  // Khi SUCCESS → trigger callback (parent sẽ navigate)
  useEffect(() => {
    if (order?.status === "SUCCESS" && !hasNavigated && onSuccess && !showRefreshButton) {
      setHasNavigated(true);
      const id = setTimeout(() => onSuccess(), 1500);
      return () => clearTimeout(id);
    }
  }, [order?.status, hasNavigated, onSuccess, showRefreshButton]);

  const handleCancel = () => {
    if (!order) return;
    const confirmed = window.confirm(
      "Bạn có chắc muốn hủy đơn hàng này? Bạn có thể tạo đơn mới sau.",
    );
    if (!confirmed) return;
    void cancelOrder(order.id);
  };

  const handleRefresh = () => {
    // Refresh trang rồi navigate về /account
    window.location.href = "/account";
  };

  if (!order) return null;

  if (order.status === "SUCCESS") {
    if (showRefreshButton) {
      // Hiển thị nút "Làm mới" để user tự click
      return (
        <Card className="border-emerald-200/60 bg-emerald-50/50">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                <Check className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-emerald-900">
                  Thanh toán thành công!
                </p>
                <p className="text-sm text-emerald-700">
                  Vui lòng ấn nút bên dưới để cập nhật tài khoản.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleRefresh}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              <RefreshCw className="size-4" />
              Làm mới
            </Button>
          </CardContent>
        </Card>
      );
    }

    // Auto-redirect mode (cũ)
    return (
      <Card className="border-emerald-200/60 bg-emerald-50/50">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <Check className="size-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-emerald-900">
              Thanh toán thành công!
            </p>
            <p className="text-sm text-emerald-700">
              Đang chuyển hướng...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (order.status === "EXPIRED") {
    return (
      <Card className="border-amber-200/60 bg-amber-50/50">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="size-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-900">Đơn hàng đã hết hạn</p>
              <p className="text-sm text-amber-700">
                Vui lòng tạo đơn mới để tiếp tục thanh toán.
              </p>
            </div>
          </div>
          <Link
            href="/upgrade"
            className="inline-flex h-7 w-full items-center justify-center rounded-md bg-amber-600 px-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
          >
            Tạo đơn mới
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (order.status === "FAILED") {
    return (
      <Card className="border-red-200/60 bg-red-50/50">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <XCircle className="size-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-red-900">Thanh toán thất bại</p>
            <p className="text-sm text-red-700">
              Số tiền chưa khớp với đơn hàng. Vui lòng liên hệ hỗ trợ.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // PENDING
  return (
    <Card className="border-slate-200/80 bg-white">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <Clock className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Đang chờ thanh toán</p>
              <p className="text-xs text-slate-500">
                {isPolling ? "Tự động kiểm tra mỗi 3 giây" : "Đang tạm dừng"}
              </p>
            </div>
          </div>
          <Countdown expiresAt={order.expiresAt} />
        </div>

        {cancelError && (
          <p className="text-xs text-red-600">{cancelError}</p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCancel}
          disabled={isCancelling}
          className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          <X className="size-3.5" />
          {isCancelling ? "Đang hủy..." : "Hủy thanh toán"}
        </Button>
      </CardContent>
    </Card>
  );
}
