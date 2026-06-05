"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  MessageSquareQuote,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";

const navItems: Array<{
  label: string;
  href: Route;
  icon: typeof ShieldCheck;
}> = [
  {
    label: "Bàn điều hành",
    href: "/admin",
    icon: ShieldCheck,
  },
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Khóa học",
    href: "/admin/courses",
    icon: BookOpen,
  },
  {
    label: "Transactions & doanh thu",
    href: "/admin/orders",
    icon: ReceiptText,
  },
  {
    label: "Đánh giá học viên",
    href: "/admin/reviews",
    icon: MessageSquareQuote,
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
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
              isActive
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
