import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/reset-password-form";

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu - EngGucation",
  description: "Đặt lại mật khẩu tài khoản EngGucation của bạn",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
