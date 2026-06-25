"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { GraduationCap, Menu, X } from "lucide-react";

export default function Header() {
  const { data: session } = authClient.useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/50"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25 transition-transform group-hover:scale-105">
            <GraduationCap className="size-5 text-white" />
          </div>
          <span className="text-lg font-black tracking-tight text-slate-900">
            Engducation
          </span>
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 relative z-20">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-sm font-semibold hover:bg-indigo-50 hover:text-indigo-600">
              Đăng nhập
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm" className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md transition-all">
              Bắt đầu miễn phí
            </Button>
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-lg">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            <Link
              href="/login"
              className="px-4 py-3 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Đăng nhập
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
