"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Mail, Lock, Loader2 } from "lucide-react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export default function AuthLoginPageClient() {
  const [showSignIn, setShowSignIn] = useState(true);

  return (
    <div className="w-full">
      {/* Auth Card */}
      <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        {/* Card Header */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-6 py-8 text-center">
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/10" />
          <div className="absolute -left-4 -bottom-4 size-24 rounded-full bg-white/10" />

          <div className="relative">
            <div className="flex size-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mx-auto mb-3">
              <GraduationCap className="size-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">
              {showSignIn ? "Chào mừng trở lại" : "Tạo tài khoản mới"}
            </h1>
            <p className="mt-1 text-sm text-white/70">
              {showSignIn
                ? "Đăng nhập để tiếp tục học tiếng Anh"
                : "Đăng ký miễn phí để bắt đầu hành trình của bạn"}
            </p>
          </div>
        </div>

        {/* Card Body */}
        <div className="px-6 py-6">
          {showSignIn ? (
            <>
              <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
              <div className="mt-4 text-center">
                <Link
                  href="/forgot-password"
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Quên mật khẩu?
                </Link>
              </div>
            </>
          ) : (
            <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
          )}
        </div>
      </div>
    </div>
  );
}
