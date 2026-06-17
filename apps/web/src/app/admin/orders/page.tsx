"use client";

import { CreditCard } from "lucide-react";
import { SepayOrdersAdminTable } from "@/features/payment/components/admin/sepay-orders-admin-table";

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Giao dịch SePay
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Theo dõi đơn hàng chuyển khoản ngân hàng tự động qua SePay.
        </p>
      </div>

      <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
        <CreditCard className="size-3.5" />
        SePay Webhooks
      </div>

      <SepayOrdersAdminTable />
    </div>
  );
}
