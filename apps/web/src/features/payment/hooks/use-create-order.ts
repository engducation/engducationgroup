"use client";

import { useCallback, useState } from "react";
import type { OrderSummary, PackageType } from "../types/schemas";

interface UseCreateOrderOptions {
  onSuccess?: (order: OrderSummary) => void;
  onError?: (error: string) => void;
}

interface CreateOrderState {
  isLoading: boolean;
  error: string | null;
  order: OrderSummary | null;
}

/**
 * Hook tạo SePay order.
 * Trả về OrderSummary (kèm qrUrl, expiresAt, bank info) nếu thành công.
 *
 * Component sử dụng nên navigate sang `/upgrade/[orderId]` ngay khi có order.
 */
export function useCreateOrder(options?: UseCreateOrderOptions) {
  const [state, setState] = useState<CreateOrderState>({
    isLoading: false,
    error: null,
    order: null,
  });

  const createOrder = useCallback(
    async (packageType: PackageType) => {
      setState({ isLoading: true, error: null, order: null });
      try {
        const response = await fetch("/api/payment/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packageType }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Không thể tạo đơn hàng");
        }
        setState({ isLoading: false, error: null, order: data.data });
        options?.onSuccess?.(data.data);
        return data.data as OrderSummary;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Lỗi không xác định";
        setState({ isLoading: false, error: message, order: null });
        options?.onError?.(message);
        throw error;
      }
    },
    [options],
  );

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, order: null });
  }, []);

  return { ...state, createOrder, reset };
}
