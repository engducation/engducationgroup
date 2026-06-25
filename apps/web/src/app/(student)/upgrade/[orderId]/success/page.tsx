import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getOrderById } from "@/features/payment/services/order.service";
import { CheckCircle2, BookOpen, Sparkles, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function PaymentSuccessPage({ params }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/login");
  }

  const { orderId } = await params;
  const order = await getOrderById(orderId, session.user.id);

  // Chỉ cho phép truy cập success page nếu order đã SUCCESS
  // Nếu không có order hoặc chưa SUCCESS → redirect về upgrade page
  if (!order || order.status !== "SUCCESS") {
    redirect("/upgrade");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Success Animation */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Pulse ring */}
            <div className="absolute inset-0 animate-ping rounded-full bg-emerald-200 opacity-40" />
            {/* Main circle */}
            <div className="relative flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="size-12 text-white" strokeWidth={2.5} />
            </div>
            {/* Sparkles */}
            <Sparkles className="absolute -right-2 -top-2 size-6 text-amber-400 animate-pulse" />
            <Sparkles className="absolute -left-2 -bottom-1 size-5 text-emerald-300 animate-pulse" style={{ animationDelay: "0.5s" }} />
          </div>
        </div>

        {/* Congratulations Text */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-slate-900">
            Chúc mừng bạn!
          </h1>
          <p className="text-lg text-slate-600">
            Thanh toán thành công
          </p>
          <p className="text-sm text-slate-500">
            Gói <span className="font-semibold text-emerald-600">{order.packageLabel}</span> đã được kích hoạt thành công.
          </p>
        </div>

        {/* Order Summary Card */}
        <Card className="border-emerald-200/60 bg-emerald-50/50 shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Mã đơn hàng</span>
                <span className="font-mono text-slate-700">{order.orderCode}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Gói Premium</span>
                <span className="font-medium text-slate-700">{order.packageLabel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Số tiền</span>
                <span className="font-semibold text-emerald-600">
                  {order.amount.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            <div className="border-t border-emerald-200/60 pt-4">
              {order.subscriptionExpiresAt && (
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircle2 className="size-4" />
                  <span>Hạn sử dụng: {new Date(order.subscriptionExpiresAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric"
                  })}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CTA Button */}
        <div className="space-y-3">
          <Link
            href="/courses"
            className="flex h-12 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-700 hover:to-emerald-600 hover:shadow-emerald-500/40"
          >
            <BookOpen className="size-5" />
            Bắt đầu học ngay
            <ArrowRight className="size-4" />
          </Link>

          <p className="text-center text-xs text-slate-400">
            Bạn có thể truy cập khóa học Premium bất kỳ lúc nào
          </p>
        </div>

        {/* Trust Signals */}
        <div className="flex items-center justify-center gap-6 pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            Thanh toán bảo mật
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            Hỗ trợ 24/7
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            Hoàn tiền trong 7 ngày
          </div>
        </div>
      </div>
    </div>
  );
}
