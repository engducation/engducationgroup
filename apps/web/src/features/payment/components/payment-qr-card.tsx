"use client";

import { useState } from "react";
import { Check, Copy, CreditCard, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatOrderCodeForDisplay } from "@/features/payment/utils/order-code.utils";
import type { OrderSummary } from "../types/schemas";

interface PaymentQrCardProps {
  order: OrderSummary;
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + "đ";
}

export function PaymentQrCard({ order }: PaymentQrCardProps) {
  const [copied, setCopied] = useState(false);

  const copyOrderCode = async () => {
    try {
      // Copy raw orderCode (without formatting spaces)
      await navigator.clipboard.writeText(order.orderCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — fallback không cần thiết cho UX này
    }
  };

  return (
    <Card className="overflow-hidden border-slate-200/80 bg-white">
      <div className="bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-6">
        <div className="mx-auto max-w-sm space-y-4">
          {/* Package info — quan trọng: user cần thấy mình đang mua gói nào */}
          <div className="flex items-center gap-3 rounded-xl border border-indigo-200/60 bg-white px-4 py-3 shadow-sm">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <Crown className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-indigo-600">
                Gói đã chọn
              </p>
              <p className="text-base font-bold text-slate-900 truncate">
                {order.packageLabel}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-base font-extrabold text-indigo-600">
                {formatPrice(order.amount)}
              </p>
            </div>
          </div>

          {/* QR Code */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={order.qrUrl}
                alt="QR thanh toán SePay"
                className="h-full w-full object-contain"
                loading="eager"
              />
            </div>
            <p className="mt-3 text-center text-[11px] font-medium uppercase tracking-widest text-slate-400">
              Quét bằng app ngân hàng
            </p>
          </div>

          {/* Bank details */}
          <div className="space-y-2 text-sm">
            <DetailRow label="Ngân hàng" value={order.bank.bankCode} />
            <DetailRow label="Chủ tài khoản" value={order.bank.accountName} />
            <DetailRow
              label="Số tài khoản"
              value={order.bank.accountNumber}
              mono
            />
            <DetailRow
              label="Mã thanh toán"
              value={formatOrderCodeForDisplay(order.orderCode)}
              mono
              accent
              actions={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={copyOrderCode}
                  className="h-7 px-2 text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="size-3 text-emerald-600" />
                      Đã copy
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      Copy
                    </>
                  )}
                </Button>
              }
            />
          </div>
        </div>
      </div>

      <CardContent className="flex items-center gap-3 border-t bg-slate-50/60 p-4 text-xs text-slate-500">
        <CreditCard className="size-4 shrink-0 text-slate-400" />
        <p>
          Hệ thống tự động kích hoạt gói trong vài giây sau khi nhận được
          chuyển khoản. Không cần thao tác thêm.
        </p>
      </CardContent>
    </Card>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
  actions?: React.ReactNode;
}

function DetailRow({ label, value, mono, accent, actions }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={`text-right ${
            mono ? "font-mono text-xs font-semibold" : "font-semibold"
          } ${accent ? "text-base font-bold text-indigo-600" : "text-slate-900"}`}
        >
          {value}
        </span>
        {actions}
      </div>
    </div>
  );
}
