"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  Power,
  PowerOff,
  Tag,
  Trash2,
} from "lucide-react";

interface CodePattern {
  code: string;
  description: string | null;
  randomLength: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiResponse {
  data?: { items?: CodePattern[]; active?: number };
  error?: string;
}

export default function AdminPaymentCodePatternsPage() {
  const [items, setItems] = useState<CodePattern[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLength, setNewLength] = useState(8);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payment/code-patterns", {
        cache: "no-store",
      });
      const json = (await res.json()) as ApiResponse;
      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Load failed");
      }
      setItems(json.data?.items ?? []);
      setActiveCount(json.data?.active ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createPattern = useCallback(async () => {
    if (!newCode.trim()) {
      setError("Mã không được để trống");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payment/code-patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode.trim().toUpperCase(),
          description: newDescription.trim() || null,
          randomLength: newLength,
          isActive: true,
        }),
      });
      const json = (await res.json()) as ApiResponse;
      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Create failed");
      }
      setNewCode("");
      setNewDescription("");
      setNewLength(8);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create error");
    } finally {
      setSubmitting(false);
    }
  }, [newCode, newDescription, newLength, load]);

  const toggleActive = useCallback(
    async (p: CodePattern) => {
      try {
        const res = await fetch(
          `/api/admin/payment/code-patterns/${p.code}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !p.isActive }),
          },
        );
        const json = (await res.json()) as ApiResponse;
        if (!res.ok || json.error) throw new Error(json.error ?? "Toggle failed");
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Toggle error");
      }
    },
    [load],
  );

  const softDelete = useCallback(
    async (p: CodePattern) => {
      if (!confirm(`Soft-delete pattern "${p.code}"?`)) return;
      try {
        const res = await fetch(
          `/api/admin/payment/code-patterns/${p.code}`,
          { method: "DELETE" },
        );
        const json = (await res.json()) as ApiResponse;
        if (!res.ok || json.error) throw new Error(json.error ?? "Delete failed");
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete error");
      }
    },
    [load],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Mã thanh toán SePay
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Danh sách prefix SePay dùng để nhận diện nội dung chuyển khoản.
          Mỗi mã phải khớp với 1 dòng đã khai báo trong my.sepay.vn.
        </p>
      </div>

      <div className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
        <Tag className="size-3.5" />
        {activeCount} mã đang active
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form tạo mới */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">
          Thêm mã mới
        </h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_2fr_120px_auto]">
          <input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            placeholder="MÃ_MỚI"
            maxLength={10}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-mono uppercase focus:border-amber-400 focus:outline-none"
          />
          <input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Mô tả (tùy chọn)"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
          />
          <input
            type="number"
            value={newLength}
            onChange={(e) => setNewLength(Number(e.target.value) || 8)}
            min={6}
            max={10}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={createPattern}
            disabled={submitting || !newCode.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Thêm
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Mã chỉ gồm chữ in hoa + số, dài 3-10 ký tự. Phần random là số
          nguyên, dài 6-10 chữ số (mặc định 8).
        </p>
      </div>

      {/* Bảng */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Mô tả</th>
              <th className="px-4 py-3">Length</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  <Loader2 className="mx-auto size-5 animate-spin" />
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Chưa có mã nào. Hãy thêm mã ở form trên.
                </td>
              </tr>
            )}
            {items.map((p) => (
              <tr key={p.code} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-mono font-bold text-slate-900">
                  {p.code}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {p.description ?? <span className="text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3 font-mono text-slate-700">
                  {p.randomLength}
                </td>
                <td className="px-4 py-3">
                  {p.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      <Power className="size-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      <PowerOff className="size-3" /> Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <button
                      type="button"
                      onClick={() => void toggleActive(p)}
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                      title={p.isActive ? "Tắt" : "Bật"}
                    >
                      {p.isActive ? (
                        <PowerOff className="size-4" />
                      ) : (
                        <Power className="size-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => void softDelete(p)}
                      className="rounded-md p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700"
                      title="Soft-delete"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
        <h3 className="mb-1 font-semibold text-slate-700">Hướng dẫn:</h3>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            Vào <strong>my.sepay.vn → Cài đặt → Mã thanh toán</strong> và thêm
            các dòng tương ứng với từng mã ở trên.
          </li>
          <li>
            SePay sẽ chỉ gửi webhook cho giao dịch có nội dung CK khớp với 1
            trong các mã này.
          </li>
          <li>
            Mỗi lần tạo đơn, hệ thống chọn ngẫu nhiên 1 mã active để sinh
            orderCode.
          </li>
          <li>
            Soft-delete (tắt active) để giữ audit cho orders cũ; pattern cũ
            sẽ không còn được dùng để sinh orderCode mới.
          </li>
        </ol>
      </div>
    </div>
  );
}
