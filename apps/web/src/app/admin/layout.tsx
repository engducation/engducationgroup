import {
  Activity,
  Bell,
  ChevronDown,
  Settings,
  Shield
} from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import AdminSidebarNav from "@/components/admin-sidebar-nav";
import AdminSignOutMenuItem from "@/components/admin-sign-out-menu-item";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/lib/auth";
import { asSessionUser } from "@/types/session";

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

  const user = asSessionUser(session.user);
  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  const initials = getInitials(session.user.name ?? "Admin");

  return (
    <div className="flex min-h-screen w-full bg-slate-50/50">
      {/* ── SIDEBAR ── */}
      <aside className="fixed inset-y-0 left-0 z-20 flex h-full w-64 flex-col border-r border-slate-800/80 bg-[#0f0f14]">
        {/* Brand */}
        <div className="flex h-16 items-center border-b border-white/5 px-5">
          <Link href="/admin/dashboard" className="group flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
              <Activity className="size-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white leading-none">
                Engducation
              </span>
              <span className="mt-1 rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-indigo-300">
                Admin Panel
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <AdminSidebarNav />
        </div>

        {/* User profile */}
        <div className="border-t border-white/5 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none">
              <Avatar size="sm">
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-bold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {session.user.name ?? "Admin"}
                </p>
                <p className="truncate text-[11px] text-white/30">
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
              <AdminSignOutMenuItem />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex flex-1 flex-col pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/90 px-8 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2">
            {/* Status dot */}
            <span className="flex items-center gap-1.5">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-emerald-600">Online</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              aria-label="Thông báo"
              className="relative flex size-9 items-center justify-center rounded-xl text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"
            >
              <Bell className="size-4.5" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            {/* Avatar quick access */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none">
                <Avatar size="sm">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-[10px] font-bold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="size-3 text-slate-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="bottom" className="w-48">
                <div className="mb-1 border-b border-border px-2 py-2">
                  <p className="text-xs font-semibold text-foreground">
                    {session.user.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {session.user.email}
                  </p>
                </div>
                <AdminSignOutMenuItem />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
