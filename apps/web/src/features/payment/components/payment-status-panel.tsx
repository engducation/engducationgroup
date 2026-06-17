"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Clock, XCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Countdown } from "./payment-countdown";
import { Payment } from "./payment-shell";

/**
 * Panel status phía dưới QR card. Tự động start polling khi mount.
 * Hiển thị countdown + trạng thái realtime. Khi SUCCESS → auto-redirect.
 */
interface PaymentStatusPanelProps {
  onSuccess?: () => void;
}

export function PaymentStatusPanel({ onSuccess }: PaymentStatusPanelProps) {
  const { order, isPolling, startPolling, stopPolling } = Payment.usePayment();
  const [hasNavigated, setHasNavigated] = useState(false);

  // Auto-start polling khi mount
  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  // Khi SUCCESS → trigger callback (parent sẽ navigate)
  useEffect(() => {
    if (order?.status === "SUCCESS" && !hasNavigated && onSuccess) {
      setHasNavigated(true);
      // Delay nhỏ để user thấy success state
      const id = setTimeout(() => onSuccess(), 1500);
      return () => clearTimeout(id);
    }
  }, [order?.status, hasNavigated, onSuccess]);

  if (!order) return null;

  if (order.status === "SUCCESS") {
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
      </CardContent>
    </Card>
  );
}
