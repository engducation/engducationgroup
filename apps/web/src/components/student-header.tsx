"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  GraduationCap,
  BookOpen,
  LogOut,
  ShieldAlert,
  Sparkles,
  Crown,
  CreditCard,
  Headphones,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

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
  const pathname = usePathname();

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
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
              <GraduationCap className="size-4 text-white" />
            </div>
            <span className="text-[15px] font-bold tracking-tight text-slate-900">
              Engducation
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/account"
              className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                pathname === "/account"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Crown className="size-4" />
              Tài khoản
              {pathname === "/account" && (
                <span className="absolute -bottom-[17px] left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-indigo-500" />
              )}
            </Link>
            <Link
              href="/courses"
              className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                pathname === "/courses" || pathname.startsWith("/learn")
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <BookOpen className="size-4" />
              Khóa học
              {(pathname === "/courses" || pathname.startsWith("/learn")) && (
                <span className="absolute -bottom-[17px] left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-indigo-500" />
              )}
            </Link>
            <Link
              href="/notebook"
              className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                pathname === "/notebook"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              Sổ từ vựng
              {pathname === "/notebook" && (
                <span className="absolute -bottom-[17px] left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-indigo-500" />
              )}
            </Link>
            <Link
              // @ts-ignore
              href="/support"
              className={`relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                pathname.startsWith("/support")
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Headphones className="size-4" />
              Hỗ trợ
              {pathname.startsWith("/support") && (
                <span className="absolute -bottom-[17px] left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-indigo-500" />
              )}
            </Link>
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

          {/* User info + Sign out button */}
          <div className="flex items-center gap-3">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="ml-2 text-red-500 hover:text-red-600"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
