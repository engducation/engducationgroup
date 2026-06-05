import Link from "next/link";
import type { Route } from "next";
import { BookOpen, MessageSquareQuote, ReceiptText } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const sections: Array<{
  title: string;
  description: string;
  href: Route;
  icon: typeof BookOpen;
}> = [
  {
    title: "Khóa học",
    description: "Tạo khóa học, cập nhật pricing, cover, certificate và quản lý nội dung.",
    href: "/admin/courses",
    icon: BookOpen,
  },
  {
    title: "Transactions",
    description: "Theo dõi doanh thu, giao dịch thanh toán và trạng thái xử lý.",
    href: "/admin/orders",
    icon: ReceiptText,
  },
  {
    title: "Đánh giá",
    description: "Phản hồi review và kiểm soát trạng thái hiển thị.",
    href: "/admin/reviews",
    icon: MessageSquareQuote,
  },
];

export default function AdminRootPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Admin workspace</h1>
        <p className="mt-1 text-sm text-slate-600">Chọn phân hệ để quản trị dữ liệu thật của hệ thống.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <Link key={section.href} href={section.href} className="block">
              <Card className="h-full border-slate-200 transition hover:border-indigo-200 hover:shadow-md">
                <CardHeader className="space-y-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <Icon className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-base">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <span className="text-sm font-semibold text-indigo-600">Mở phân hệ</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
