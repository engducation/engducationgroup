import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Crown, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PremiumPaymentForm } from "@/components/premium-payment-form";

export default async function UpgradePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Quay lại danh sách khóa học
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25">
            <Crown className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Nâng cấp Premium</h1>
            <p className="text-sm text-slate-500">
              Chọn gói phù hợp và mở khóa toàn bộ khóa học
            </p>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <PremiumPaymentForm />
      </div>
    </div>
  );
}
