"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Bot,
  LayoutDashboard,
  MessageSquareQuote,
  PencilLine,
  ReceiptText,
  Settings,
  Tag,
  Users,
} from "lucide-react";

const navItems: Array<{
  label: string;
  href: Route;
  icon: typeof LayoutDashboard;
}> = [
  {
    label: "Tổng quan",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Khóa học",
    href: "/admin/courses",
    icon: BookOpen,
  },
  {
    label: "Giá & Giảm giá",
    href: "/admin/pricing",
    icon: Tag,
  },
  {
    label: "AI Prompts",
    href: "/admin/ai-prompts",
    icon: Bot,
  },
  {
    label: "Giao dịch",
    href: "/admin/orders",
    icon: ReceiptText,
  },
  {
    label: "Đánh giá",
    href: "/admin/reviews",
    icon: MessageSquareQuote,
  },
  {
    label: "Kiểm duyệt",
    href: "/admin/moderation",
    icon: PencilLine,
  },
];

export default function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-4 py-6">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/admin"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 z-0 hidden h-8 w-1 -translate-y-1/2 rounded-r-full bg-white/30 sm:block" />
            )}
            <span
              className={`relative z-10 flex size-7 items-center justify-center rounded-lg transition-colors ${
                isActive
                  ? "bg-white/20"
                  : "bg-slate-800 group-hover:bg-indigo-600/20"
              }`}
            >
              <Icon className="size-3.5" />
            </span>
            <span className="relative z-10">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
