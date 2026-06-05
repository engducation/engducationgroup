import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  GraduationCap,
  Bell,
  ChevronDown,
  BookOpen,
  Sparkles,
  Settings,
  LogOut,
  User,
  Shield,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Buổi sáng tốt lành";
  if (hour < 18) return "Chiều vui vẻ";
  return "Buổi tối tốt lành";
}

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user;

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f7f4]">
      {/* ─── STUDENT HEADER ─── */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center border-b border-black/5 bg-white/80 backdrop-blur-xl px-6 shadow-sm shadow-black/5">
        <div className="flex w-full items-center justify-between gap-8">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-10">
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
                <GraduationCap className="size-4 text-white" />
              </div>
              <span className="text-[15px] font-bold tracking-tight text-slate-900">
                Engducation
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {[
                {
                  href: "/dashboard",
                  label: "Lớp học",
                  icon: BookOpen,
                  active: true,
                },
                {
                  href: "/notebook" as any,
                  label: "Sổ tay từ",
                  icon: null,
                  active: false,
                },
                {
                  href: "/ai-assistant" as any,
                  label: "Trợ lý AI",
                  icon: null,
                  active: false,
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    item.active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {item.icon && <item.icon className="size-4" />}
                  {item.label}
                  {item.active && (
                    <span className="absolute -bottom-[17px] left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-indigo-500" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Actions + User */}
          <div className="flex items-center gap-3">
            {/* Premium badge */}
            <Link
              href="#"
              className="hidden sm:flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm"
            >
              <Sparkles className="size-3 text-amber-500" />
              Premium Pro
            </Link>

            {/* Notifications bell */}
            <button
              aria-label="Thông báo"
              className="relative flex size-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <Bell className="size-5" />
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-xl px-1.5 py-1 transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none">
              <Avatar size="sm">
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs font-bold">
                  {user ? getInitials(user.name ?? "HV") : "HV"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-slate-900 leading-tight">
                  {user?.name ?? "Học viên"}
                </p>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {getGreeting()}
                </p>
              </div>
              <ChevronDown className="size-4 text-slate-400 hidden sm:block" />
            </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-52">
                <div className="px-2 py-2.5 border-b border-border mb-1">
                  <p className="text-sm font-semibold text-foreground">
                    {user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuItem className="gap-2 py-2">
                  <User className="size-4 text-slate-500" />
                  Hồ sơ cá nhân
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 py-2">
                  <Settings className="size-4 text-slate-500" />
                  Cài đặt
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 py-2">
                  <Shield className="size-4 text-slate-500" />
                  Quyền riêng tư
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="gap-2 py-2"
                >
                  <LogOut className="size-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ─── CONTENT AREA ─── */}
      <div className="flex flex-1">
        <main className="flex-1 px-6 py-8 sm:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}
