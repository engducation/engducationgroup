"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OrderStatus, OrderSummary } from "../types/schemas";

interface UseOrderStatusOptions {
  /**
   * Polling interval (ms). Default 3000.
   * Khi `stopPolling` true → không poll nữa.
   */
  intervalMs?: number;
  /**
   * Dừng polling khi status đạt trạng thái này (default: "SUCCESS").
   */
  stopOn?: OrderStatus;
  onSuccess?: (order: OrderSummary) => void;
  onExpired?: (order: OrderSummary) => void;
}

interface UseOrderStatusState {
  order: OrderSummary | null;
  isLoading: boolean;
  isPolling: boolean;
  error: string | null;
}

/**
 * Polling order status. Cleanup interval khi unmount, success, hoặc expire.
 *
 * Lưu ý: reactCompiler tự handle re-renders, không cần useMemo.
 * Tuy nhiên mình vẫn dùng ref cho intervalId để cleanup từ callback bất kỳ.
 */
export function useOrderStatus(
  orderId: string | null,
  options?: UseOrderStatusOptions,
) {
  const {
    intervalMs = 3000,
    stopOn = "SUCCESS",
    onSuccess,
    onExpired,
  } = options ?? {};

  const [state, setState] = useState<UseOrderStatusState>({
    order: null,
    isLoading: false,
    isPolling: false,
    error: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onExpiredRef = useRef(onExpired);
  onSuccessRef.current = onSuccess;
  onExpiredRef.current = onExpired;

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState((prev) => (prev.isPolling ? { ...prev, isPolling: false } : prev));
  }, []);

  const fetchOnce = useCallback(async () => {
    if (!orderId) return;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await fetch(`/api/payment/orders/${orderId}`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Không thể lấy trạng thái đơn");
      }
      const order = data.data as OrderSummary;
      const previousStatus = state.order?.status;
      setState((prev) => ({ ...prev, order, isLoading: false, error: null }));

      // ─── BƯỚC QUAN TRỌNG: đồng bộ Better-Auth session sau khi SUCCESS ───
      // Nếu status vừa chuyển PENDING → SUCCESS, sync cookie để UI refresh
      // (không cần logout/login lại để thấy Premium).
      if (
        order.status === stopOn &&
        previousStatus !== stopOn &&
        typeof window !== "undefined"
      ) {
        try {
          await fetch("/api/auth/refresh-session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
            credentials: "include",
            cache: "no-store",
          });
        } catch (err) {
          // Non-fatal — UI vẫn sẽ refresh qua router.refresh() do caller xử lý.
          console.warn("refresh-session failed (non-fatal):", err);
        }
      }

      // Check stop conditions
      if (order.status === stopOn) {
        onSuccessRef.current?.(order);
        stopPolling();
      } else if (order.status === "EXPIRED" || order.status === "FAILED") {
        onExpiredRef.current?.(order);
        stopPolling();
      }
      return order;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lỗi không xác định";
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw error;
    }
  }, [orderId, stopOn, stopPolling, state.order?.status]);

  const startPolling = useCallback(() => {
    if (!orderId || intervalRef.current) return;
    setState((prev) => ({ ...prev, isPolling: true }));
    void fetchOnce();
    intervalRef.current = setInterval(() => {
      void fetchOnce();
    }, intervalMs);
  }, [orderId, intervalMs, fetchOnce]);

  // Auto-stop khi unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    startPolling,
    stopPolling,
    refetch: fetchOnce,
  };
}
