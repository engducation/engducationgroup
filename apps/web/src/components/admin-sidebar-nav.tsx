"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  FileSpreadsheet,
  Users,
} from "lucide-react";

const navItems = [
  {
    label: "Tổng quan Hệ thống",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Quản lý Khóa học",
    href: "/admin/courses",
    icon: BookOpen,
  },
  {
    label: "Quản lý Quiz",
    href: "/admin/quizzes",
    icon: HelpCircle,
  },
  {
    label: "Kho Từ Vựng (Excel)",
    href: "/admin/vocabulary",
    icon: FileSpreadsheet,
  },
  {
    label: "Giám Sát Người Dùng",
    href: "/admin/users",
    icon: Users,
  },
];

export default function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 px-4 py-6">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={item.href as any}
            className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
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
