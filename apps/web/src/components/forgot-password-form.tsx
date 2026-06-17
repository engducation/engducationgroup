"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "@tanstack/react-form";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const forgotPasswordSchema = z.object({
  email: z.email("Địa chỉ email không hợp lệ"),
});

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "" },
    validators: { onSubmit: forgotPasswordSchema },
    onSubmit: async ({ value }) => {
      const { error } = await authClient.requestPasswordReset({
        email: value.email,
        redirectTo: "/reset-password",
      });
      if (error) {
        // Không tiết lộ email tồn tại hay không (chống user enumeration).
        // Vẫn hiển thị success UI cho user với mọi trường hợp.
        console.error("[auth] requestPasswordReset error:", error);
      }
      setSentTo(value.email);
      toast.success("Nếu email tồn tại, link đặt lại đã được gửi");
    },
  });

  if (sentTo) {
    return (
      <div className="mx-auto w-full max-w-md p-6 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 className="size-6 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Kiểm tra email của bạn</h1>
        <p className="mt-2 text-sm text-slate-500">
          Nếu <span className="font-semibold text-slate-700">{sentTo}</span>{" "}
          đã đăng ký, chúng tôi đã gửi một liên kết để đặt lại mật khẩu. Vui
          lòng kiểm tra hộp thư đến (và thư mục spam).
        </p>
        <div className="mt-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          Liên kết sẽ hết hạn sau 1 giờ. Nếu bạn không nhận được email, hãy thử
          lại hoặc liên hệ hỗ trợ.
        </div>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="size-4 mr-1" />
          Quay lại trang đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md p-6">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-indigo-50">
          <Mail className="size-6 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Quên mật khẩu?</h1>
        <p className="mt-1 text-sm text-slate-500">
          Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết để đặt lại mật khẩu
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <form.Field name="email">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Email</Label>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="rounded-lg"
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-red-500">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Subscribe
          selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "Gửi liên kết đặt lại"
              )}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="size-4 mr-1" />
          Quay lại trang đăng nhập
        </Link>
      </div>
    </div>
  );
}
