"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Payment } from "@/features/payment/components/payment-shell";
import { PaymentQrCard } from "@/features/payment/components/payment-qr-card";
import { PaymentStatusPanel } from "@/features/payment/components/payment-status-panel";
import type { OrderSummary } from "@/features/payment/types/schemas";

interface PaymentCheckoutClientProps {
  initialOrder: OrderSummary;
}

/**
 * Bước 2: hiển thị QR + status polling. Khi SUCCESS → navigate về /courses.
 */
export function PaymentCheckoutClient({ initialOrder }: PaymentCheckoutClientProps) {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/courses");
    router.refresh();
  };

  return (
    <Payment.Shell initialOrder={initialOrder}>
      <div className="max-w-2xl mx-auto space-y-6 py-4">
        {/* Header */}
        <div className="space-y-4">
          <Link
            href="/upgrade"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="size-4" />
            Chọn gói khác
          </Link>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900">Thanh toán</h1>
            <p className="text-sm text-slate-500">
              Quét mã QR bằng ứng dụng ngân hàng để hoàn tất nâng cấp
            </p>
          </div>
        </div>

        {/* QR + Bank info */}
        <PaymentCheckoutQr />

        {/* Status panel + polling */}
        <PaymentStatusPanel onSuccess={handleSuccess} />

        {/* Trust signal */}
        <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
          <ShieldCheck className="size-4 text-emerald-600" />
          Giao dịch được xử lý tự động qua SePay — bảo mật HMAC-SHA256
        </div>
      </div>
    </Payment.Shell>
  );
}

function PaymentCheckoutQr() {
  const { order } = Payment.usePayment();
  if (!order) return null;
  return <PaymentQrCard order={order} />;
}
