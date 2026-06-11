"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface UseEnrollmentOptions {
  onSuccess?: (enrollmentId: string) => void;
  onPremiumRequired?: () => void;
  onError?: (error: string) => void;
}

export interface EnrollmentState {
  isLoading: boolean;
  error: string | null;
  isPremiumRequired: boolean;
}

export function useEnrollment(options?: UseEnrollmentOptions) {
  const router = useRouter();
  const [state, setState] = useState<EnrollmentState>({
    isLoading: false,
    error: null,
    isPremiumRequired: false,
  });

  const enroll = useCallback(
    async (courseId: string) => {
      setState({ isLoading: true, error: null, isPremiumRequired: false });

      try {
        const response = await fetch("/api/student/enroll", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ courseId }),
        });

        const data = await response.json();

        if (data.success) {
          setState({ isLoading: false, error: null, isPremiumRequired: false });
          options?.onSuccess?.(data.enrollmentId);
          router.push(`/learn/${courseId}`);
          router.refresh();
        } else if (data.error === "PREMIUM_REQUIRED") {
          setState({ isLoading: false, error: null, isPremiumRequired: true });
          options?.onPremiumRequired?.();
        } else {
          const errorMsg = data.message || data.error || "Có lỗi xảy ra";
          setState({ isLoading: false, error: errorMsg, isPremiumRequired: false });
          options?.onError?.(errorMsg);
        }
      } catch (error) {
        const errorMsg = "Có lỗi xảy ra. Vui lòng thử lại.";
        setState({ isLoading: false, error: errorMsg, isPremiumRequired: false });
        options?.onError?.(errorMsg);
      }
    },
    [router, options]
  );

  const checkEnrollmentStatus = useCallback(async (courseId: string) => {
    try {
      const response = await fetch(`/api/student/enroll?courseId=${courseId}`);
      const data = await response.json();
      return {
        isEnrolled: data.isEnrolled ?? false,
        isPremium: data.isPremium ?? false,
      };
    } catch {
      return { isEnrolled: false, isPremium: false };
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, isPremiumRequired: false });
  }, []);

  return {
    ...state,
    enroll,
    checkEnrollmentStatus,
    reset,
  };
}
