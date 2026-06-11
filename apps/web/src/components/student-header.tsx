"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  GraduationCap,
  Bell,
  BookOpen,
  Settings,
  LogOut,
  User,
  Shield,
  CreditCard,
  ShieldAlert,
  Sparkles,
  Crown,
  LayoutDashboard,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface StudentHeaderClientProps {
  user: {
    name: string | null;
    email: string | null;
    role: string | null;
    subscriptionPlan: string | null;
    expiresAt: string | null;
  } | null;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function StudentHeaderClient({ user }: StudentHeaderClientProps) {
  const router = useRouter();

  // Xác định trạng thái thời hạn thực tế của gói dịch vụ trả phí
  const isPlanActive =
    user?.subscriptionPlan &&
    user.subscriptionPlan !== "FREE" &&
    user.expiresAt &&
    new Date(user.expiresAt) > new Date();

  const isPremiumPlan =
    user?.subscriptionPlan && user.subscriptionPlan.startsWith("PREMIUM");
  const isProPlan =
    user?.subscriptionPlan && user.subscriptionPlan.startsWith("PRO");

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center border-b border-black/5 bg-white/80 backdrop-blur-xl px-6 shadow-sm shadow-black/5">
      <div className="flex w-full items-center justify-between gap-8">
        {/* Left: Logo + Nav */}
        <div className="flex items-center gap-10">
          <Link href="/account" className="flex items-center gap-2.5 group">
            <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
              <GraduationCap className="size-4 text-white" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-slate-900">
              Engducation
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: "/account" as const, label: "Tài khoản", icon: Crown, active: false },
              { href: "/courses" as const, label: "Khóa học", icon: BookOpen, active: false },
              { href: "/notebook" as const, label: "Sổ từ vựng", icon: null, active: false },
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
          {/* Dynamic Subscription Badge - Xác định trạng thái tài khoản */}
          {isPlanActive ? (
            isPremiumPlan ? (
              <Link
                href="#"
                className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm"
              >
                <Sparkles className="size-3 text-emerald-500" />
                Gói Premium
              </Link>
            ) : isProPlan ? (
              <Link
                href="#"
                className="hidden sm:flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/60 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm"
              >
                <CreditCard className="size-3 text-blue-500" />
                Gói Pro
              </Link>
            ) : null
          ) : (
            <Link
              href="#"
              className="hidden sm:flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/60 px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm"
            >
              <ShieldAlert className="size-3 text-amber-500" />
              Tài khoản Free
            </Link>
          )}

          {/* Notifications bell */}
          <button
            aria-label="Thông báo"
            className="relative flex size-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <Bell className="size-5" />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* User menu with real sign-out */}
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
                  {user?.email ?? ""}
                </p>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-52">
              <div className="px-2 py-2.5 border-b border-border mb-1">
                <p className="text-sm font-semibold text-foreground">
                  {user?.name}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              {user?.role === "admin" && (
                <>
                  <Link
                    href="/admin/dashboard"
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    <LayoutDashboard className="mr-2 size-4 text-indigo-500" />
                    Bảng điều khiển Admin
                  </Link>
                  <DropdownMenuSeparator />
                </>
              )}
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
                className="gap-2 py-2 cursor-pointer"
                onClick={handleSignOut}
              >
                <LogOut className="size-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
