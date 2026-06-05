import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  Settings,
  ChevronDown,
  Shield,
  LogOut,
  Activity,
} from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import AdminSidebarNav from "@/components/admin-sidebar-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/lib/auth";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  // @ts-ignore - role is injected
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const initials = getInitials(session.user.name ?? "Admin");

  return (
    <div className="flex min-h-screen w-full bg-[#f4f4f5]">
      <aside className="fixed inset-y-0 left-0 z-20 flex h-full w-64 flex-col border-r border-black/10 bg-[#09090b]">
        <div className="flex h-16 items-center border-b border-white/5 px-5">
          <Link href="/admin" className="group flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
              <Activity className="size-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white">
                Engducation
              </span>
              <span className="ml-1.5 rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300">
                ADMIN
              </span>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <AdminSidebarNav />
        </div>

        <div className="border-t border-white/5 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none">
              <Avatar size="sm">
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {session.user.name ?? "Admin"}
                </p>
                <p className="truncate text-[11px] text-white/40">
                  {session.user.email}
                </p>
              </div>
              <ChevronDown className="size-3.5 shrink-0 text-white/30" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-56">
              <div className="mb-1 border-b border-border px-2 py-2.5">
                <p className="text-sm font-semibold text-foreground">
                  {session.user.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.user.email}
                </p>
              </div>
              <DropdownMenuItem className="gap-2 py-2">
                <Shield className="size-4 text-slate-500" />
                Quyền quản trị
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 py-2">
                <Settings className="size-4 text-slate-500" />
                Cài đặt hệ thống
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" className="gap-2 py-2">
                <LogOut className="size-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="flex flex-1 flex-col pl-64">
        <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-black/5 bg-white/80 px-8 shadow-sm backdrop-blur-xl">
          <div className="flex flex-col gap-1">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink render={<Link href="/admin" />}>
                    Admin
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Workspace quản trị</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <p className="text-xs font-medium text-slate-400">
              Quản trị khóa học, giao dịch và trải nghiệm học viên.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-indigo-600 lg:inline-flex"
            >
              <ArrowLeft className="size-3.5" />
              Khu học viên
            </Link>
            <span className="hidden h-4 w-px bg-slate-200 lg:block" />
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm sm:inline-flex">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              Hệ thống hoạt động
            </span>
            <button
              aria-label="Thông báo"
              className="relative flex size-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <Bell className="size-5" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
