"use client";

import { useCallback, useState } from "react";

interface UseCancelOrderState {
  isLoading: boolean;
  error: string | null;
}

interface UseCancelOrderOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Hook hủy order PENDING.
 *
 * Gọi POST /api/payment/orders/[orderId]/cancel → set status = EXPIRED
 * trong DB. Caller nên navigate về /upgrade ngay khi onSuccess.
 *
 * Không dùng `useOrderStatus` ở đây vì:
 *   - Cancel là 1-shot action, không cần state order lưu lại.
 *   - Cần loading state riêng để disable nút trong khi request đang bay.
 */
export function useCancelOrder(options?: UseCancelOrderOptions) {
  const [state, setState] = useState<UseCancelOrderState>({
    isLoading: false,
    error: null,
  });

  const cancelOrder = useCallback(
    async (orderId: string): Promise<boolean> => {
      setState({ isLoading: true, error: null });
      try {
        const response = await fetch(
          `/api/payment/orders/${orderId}/cancel`,
          {
            method: "POST",
            credentials: "include",
            cache: "no-store",
          },
        );
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Không thể hủy đơn hàng");
        }
        setState({ isLoading: false, error: null });
        options?.onSuccess?.();
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Lỗi không xác định";
        setState({ isLoading: false, error: message });
        options?.onError?.(message);
        return false;
      }
    },
    [options],
  );

  return { ...state, cancelOrder };
}
