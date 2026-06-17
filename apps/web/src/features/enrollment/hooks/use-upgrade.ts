"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { PackageType } from "@/features/enrollment/services/upgrade.service";

/**
 * @deprecated Hook này chỉ còn để backward-compat. Tốt hơn hãy dùng
 * `useCreateOrder` từ `@/features/payment/hooks/use-create-order` + navigate
 * sang `/upgrade/[orderId]` thay vì chờ sync.
 *
 * Mình giữ nó vì có thể vẫn còn chỗ nào đó import. Tự detect response shape:
 *   - Cũ: { success, transactionId, newExpiresAt }  (đã simulate)
 *   - Mới: { success, data: { checkoutUrl, orderId } }  (SePay flow — navigate sang QR)
 */
export interface UseUpgradeOptions {
  onSuccess?: (transactionId: string, newExpiresAt: Date) => void;
  onError?: (error: string) => void;
}

export interface UpgradeState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  transactionId: string | null;
  newExpiresAt: Date | null;
}

export function useUpgrade(options?: UseUpgradeOptions) {
  const router = useRouter();
  const [state, setState] = useState<UpgradeState>({
    isLoading: false,
    isSuccess: false,
    error: null,
    transactionId: null,
    newExpiresAt: null,
  });

  const upgrade = useCallback(
    async (packageType: PackageType = "MONTHLY") => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch("/api/student/upgrade", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ packageType }),
        });

        const data = await response.json();

        if (data.success) {
          // Response mới (SePay flow): navigate sang QR page
          if (data.data?.checkoutUrl) {
            router.push(data.data.checkoutUrl as never);
            setState({
              isLoading: false,
              isSuccess: true,
              error: null,
              transactionId: data.data.orderId ?? null,
              newExpiresAt: null,
            });
            return;
          }

          // Response cũ (backward-compat): parse newExpiresAt
          const newExpiresAt = data.newExpiresAt
            ? new Date(data.newExpiresAt)
            : new Date();
          setState({
            isLoading: false,
            isSuccess: true,
            error: null,
            transactionId: data.transactionId ?? null,
            newExpiresAt,
          });
          options?.onSuccess?.(
            data.transactionId ?? "legacy",
            newExpiresAt,
          );
        } else {
          const errorMsg = data.error || "Có lỗi xảy ra";
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: errorMsg,
          }));
          options?.onError?.(errorMsg);
        }
      } catch (error) {
        const errorMsg = "Có lỗi xảy ra. Vui lòng thử lại.";
        setState((prev) => ({ ...prev, isLoading: false, error: errorMsg }));
        options?.onError?.(errorMsg);
      }
    },
    [options, router]
  );

  const getSubscriptionInfo = useCallback(async () => {
    try {
      const response = await fetch("/api/student/upgrade");
      const data = await response.json();
      return {
        subscriptionPlan: data.subscriptionPlan ?? null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive ?? false,
      };
    } catch {
      return {
        subscriptionPlan: null,
        expiresAt: null,
        isActive: false,
      };
    }
  }, []);

  const redirectToCourses = useCallback(() => {
    router.push("/courses");
    router.refresh();
  }, [router]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isSuccess: false,
      error: null,
      transactionId: null,
      newExpiresAt: null,
    });
  }, []);

  return {
    ...state,
    upgrade,
    getSubscriptionInfo,
    redirectToCourses,
    reset,
  };
}
