"use client";

import { useState } from "react";
import Link from "next/link";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export default function AuthLoginPageClient() {
  const [showSignIn, setShowSignIn] = useState(true);

  return (
    <div className="relative">
      {showSignIn ? (
        <>
          <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
          <div className="mx-auto w-full max-w-md px-6 -mt-2">
            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Quên mật khẩu?
              </Link>
            </div>
          </div>
        </>
      ) : (
        <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
      )}
    </div>
  );
}
