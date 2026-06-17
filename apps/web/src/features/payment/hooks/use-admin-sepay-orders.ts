"use client";

import { useCallback, useState } from "react";
import type { OrderStatus } from "@/features/payment/types/schemas";
import type {
  SepayOrderAdminRow,
  SepayOrderDetail,
  SepayAdminAnalytics,
} from "@/features/payment/services/admin-order.service";

interface UseAdminSepayOrdersParams {
  status?: OrderStatus | "ALL";
  search?: string;
  limit?: number;
  offset?: number;
}

interface AdminSepayOrdersResponse {
  rows: SepayOrderAdminRow[];
  total: number;
  analytics: SepayAdminAnalytics;
}

interface AdminSepayApiEnvelope<T> {
  data?: T;
  error?: string;
}

function buildQueryString(params: UseAdminSepayOrdersParams): string {
  const sp = new URLSearchParams();
  if (params.status) sp.set("status", params.status);
  if (params.search) sp.set("search", params.search);
  if (params.limit) sp.set("limit", String(params.limit));
  if (params.offset) sp.set("offset", String(params.offset));
  return sp.toString();
}

/**
 * Hook fetch danh sách SePay orders (admin view) + analytics.
 * Trả về `{ data, isLoading, error, refetch }`.
 */
export function useAdminSepayOrders(initial?: AdminSepayOrdersResponse) {
  const [data, setData] = useState<AdminSepayOrdersResponse | undefined>(initial);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(
    async (params: UseAdminSepayOrdersParams = {}): Promise<AdminSepayOrdersResponse> => {
      setIsLoading(true);
      setError(null);
      try {
        const qs = buildQueryString(params);
        const url = `/api/admin/payment/orders${qs ? `?${qs}` : ""}`;
        const httpResponse = await globalThis.fetch(url, { cache: "no-store" });
        const payload = (await httpResponse.json()) as AdminSepayApiEnvelope<AdminSepayOrdersResponse>;
        if (!httpResponse.ok || !payload.data) {
          throw new Error(payload.error || "Failed to fetch");
        }
        setData(payload.data);
        return payload.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Lỗi không xác định";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { data, isLoading, error, refetch };
}

interface UseAdminSepayOrderDetailResult {
  data: SepayOrderDetail | null;
  isLoading: boolean;
  error: string | null;
  refetch: (orderId: string) => Promise<SepayOrderDetail | null>;
}

export function useAdminSepayOrderDetail(): UseAdminSepayOrderDetailResult {
  const [data, setData] = useState<SepayOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(
    async (orderId: string): Promise<SepayOrderDetail | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const httpResponse = await globalThis.fetch(
          `/api/admin/payment/orders/${orderId}`,
          { cache: "no-store" },
        );
        const payload = (await httpResponse.json()) as AdminSepayApiEnvelope<SepayOrderDetail>;
        if (!httpResponse.ok || !payload.data) {
          throw new Error(payload.error || "Failed to fetch");
        }
        setData(payload.data);
        return payload.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Lỗi không xác định";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { data, isLoading, error, refetch };
}

interface UseAdminSepayApproveResult {
  isLoading: boolean;
  error: string | null;
  approve: (
    orderId: string,
    body?: { amount?: number; gateway?: string; note?: string },
  ) => Promise<{ orderId: string; newExpiresAt: string } | null>;
}

export function useAdminSepayApprove(): UseAdminSepayApproveResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approve = useCallback(
    async (
      orderId: string,
      body: { amount?: number; gateway?: string; note?: string } = {},
    ): Promise<{ orderId: string; newExpiresAt: string } | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const httpResponse = await globalThis.fetch(
          `/api/admin/payment/orders/${orderId}/approve`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
        );
        const payload = (await httpResponse.json()) as AdminSepayApiEnvelope<{
          orderId: string;
          newExpiresAt: string;
        }>;
        if (!httpResponse.ok) {
          throw new Error(payload.error || "Failed to approve");
        }
        return payload.data ?? null;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Lỗi không xác định";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { isLoading, error, approve };
}
