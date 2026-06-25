"use client";

import { useState, useCallback } from "react";

export interface VoucherValidation {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  maxDiscount?: number;
  discountAmount: number;
  finalPrice: number;
  expiresAt: string | null;
}

export interface UseVoucherOptions {
  onSuccess?: (validation: VoucherValidation) => void;
  onError?: (error: string) => void;
}

export function useVoucher(options?: UseVoucherOptions) {
  const [voucher, setVoucher] = useState<VoucherValidation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(
    async (code: string, packageType: string, _packagePrice?: number) => {
      if (!code.trim()) {
        setError("Vui lòng nhập mã voucher");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/payment/voucher", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: code.trim().toUpperCase(),
            packageType,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          const errorMsg = data.error || "Voucher không hợp lệ";
          setError(errorMsg);
          setVoucher(null);
          options?.onError?.(errorMsg);
          return null;
        }

        const validation: VoucherValidation = {
          code: data.voucher.code,
          type: data.voucher.type,
          value: data.voucher.value,
          maxDiscount: data.voucher.maxDiscount,
          discountAmount: data.voucher.discountAmount,
          finalPrice: data.voucher.finalPrice,
          expiresAt: data.voucher.expiresAt,
        };

        setVoucher(validation);
        setError(null);
        options?.onSuccess?.(validation);
        return validation;
      } catch (err) {
        const errorMsg = "Đã xảy ra lỗi khi xác thực voucher";
        setError(errorMsg);
        setVoucher(null);
        options?.onError?.(errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [options],
  );

  const clear = useCallback(() => {
    setVoucher(null);
    setError(null);
  }, []);

  return {
    voucher,
    loading,
    error,
    validate,
    clear,
  };
}
