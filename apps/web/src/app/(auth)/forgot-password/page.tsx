import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Quên mật khẩu - EngGucation",
  description: "Khôi phục mật khẩu tài khoản EngGucation của bạn",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
