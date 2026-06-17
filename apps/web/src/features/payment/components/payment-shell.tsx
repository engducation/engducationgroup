"use client";

import { createContext, use, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useOrderStatus } from "../hooks/use-order-status";
import type { OrderSummary } from "../types/schemas";

// ─── Context shape ──────────────────────────────────────────────────────────

interface PaymentContextValue {
  order: OrderSummary | null;
  isPolling: boolean;
  isLoading: boolean;
  error: string | null;
  startPolling: () => void;
  stopPolling: () => void;
  refetch: () => Promise<OrderSummary | undefined>;
  onSuccess?: (order: OrderSummary) => void;
}

const PaymentContext = createContext<PaymentContextValue | null>(null);

function usePayment() {
  const ctx = use(PaymentContext);
  if (!ctx) {
    throw new Error("Payment compound components must be used inside <PaymentShell>");
  }
  return ctx;
}

// ─── Shell (Provider) ───────────────────────────────────────────────────────

interface PaymentShellProps {
  initialOrder: OrderSummary;
  onSuccess?: (order: OrderSummary) => void;
  onExpired?: (order: OrderSummary) => void;
  children: ReactNode;
}

function PaymentShellProvider({
  initialOrder,
  onSuccess,
  onExpired,
  children,
}: PaymentShellProps) {
  const status = useOrderStatus(initialOrder.id, {
    intervalMs: 3000,
    onSuccess,
    onExpired,
  });

  // Seed lần đầu với initialOrder để khỏi loading flash
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (!seeded) {
      // status.order is null lúc đầu; dùng initialOrder làm "current order"
      setSeeded(true);
    }
  }, [seeded]);

  const value = useMemo<PaymentContextValue>(
    () => ({
      order: status.order ?? initialOrder,
      isPolling: status.isPolling,
      isLoading: status.isLoading,
      error: status.error,
      startPolling: status.startPolling,
      stopPolling: status.stopPolling,
      refetch: status.refetch,
      onSuccess,
    }),
    [status, initialOrder, onSuccess],
  );

  return <PaymentContext value={value}>{children}</PaymentContext>;
}

// ─── Compound Parts ─────────────────────────────────────────────────────────

function StatusText() {
  const { order, isPolling } = usePayment();
  if (!order) return null;
  switch (order.status) {
    case "SUCCESS":
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
          Thanh toán thành công
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700">
          Thanh toán thất bại
        </span>
      );
    case "EXPIRED":
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700">
          Đơn đã hết hạn
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700">
          {isPolling ? "Đang chờ thanh toán..." : "Sẵn sàng thanh toán"}
        </span>
      );
  }
}

function PollingControls() {
  const { isPolling, startPolling, stopPolling } = usePayment();
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <span
        className={`inline-flex size-2 rounded-full ${
          isPolling ? "bg-amber-500 animate-pulse" : "bg-slate-300"
        }`}
      />
      <button
        type="button"
        onClick={isPolling ? stopPolling : startPolling}
        className="hover:text-slate-700 transition-colors"
      >
        {isPolling ? "Tạm dừng tự động cập nhật" : "Bật tự động cập nhật"}
      </button>
    </div>
  );
}

function ErrorBanner() {
  const { error } = usePayment();
  if (!error) return null;
  return (
    <div className="rounded-lg border border-red-200/60 bg-red-50/60 p-3 text-sm text-red-700">
      {error}
    </div>
  );
}

// ─── Compound Export ────────────────────────────────────────────────────────
// Theo Vercel Composition Pattern §1.2 — compound components với shared context.

export const Payment = {
  Shell: PaymentShellProvider,
  Status: StatusText,
  Controls: PollingControls,
  Error: ErrorBanner,
  usePayment,
};
