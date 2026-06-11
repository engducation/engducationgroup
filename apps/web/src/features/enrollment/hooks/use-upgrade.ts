"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { PackageType } from "@/features/enrollment/services/upgrade.service";

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
          const newExpiresAt = new Date(data.newExpiresAt);
          setState({
            isLoading: false,
            isSuccess: true,
            error: null,
            transactionId: data.transactionId,
            newExpiresAt,
          });
          options?.onSuccess?.(data.transactionId, newExpiresAt);
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
    [options]
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
