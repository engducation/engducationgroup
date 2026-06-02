import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import AdminSidebarNav from "@/components/admin-sidebar-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  // @ts-expect-error - role is injected
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-100">
      {/* CỘT SIDEBAR CỐ ĐỊNH (Bên Trái) */}
      <aside className="fixed inset-y-0 left-0 z-20 flex h-full w-64 flex-col border-r bg-slate-900 text-white">
        {/* Phần Logo Admin */}
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <Link
            href="/admin/dashboard"
            className="text-lg font-bold tracking-tight text-indigo-400"
          >
            Engducation Admin ❄️
          </Link>
        </div>

        {/* Danh sách Menu Điều hướng Quản trị */}
        <AdminSidebarNav />

        {/* Thông tin Tài khoản phía dưới Sidebar */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="flex size-8 items-center justify-center rounded-full bg-indigo-600 font-bold text-xs text-white">
              AD
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white">Quản trị viên</span>
              <span className="text-[10px] text-slate-500">
                {session.user.email}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* KHÔNG GIAN NỘI DUNG CHÍNH (Bên Phải) */}
      <div className="flex flex-1 flex-col pl-64">
        {/* Header Ngang phía trên của trang Admin */}
        <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b bg-white px-8 shadow-sm">
          <h1 className="text-sm font-semibold text-slate-700">
            Hệ Thống Quản Trị Hệ Thống
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition"
            >
              <ArrowLeft className="size-3" />
              Quay về trang chủ
            </Link>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
              Hệ thống hoạt động ổn định
            </span>
          </div>
        </header>

        {/* Toàn bộ nội dung Dashboard, Biểu đồ sẽ render tại đây */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
