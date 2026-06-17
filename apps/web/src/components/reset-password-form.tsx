"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
      .max(128, "Mật khẩu không được vượt quá 128 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

function PasswordInput({
  value,
  onChange,
  onBlur,
  placeholder,
  disabled,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={autoComplete}
        className="rounded-lg pr-9"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        disabled={disabled}
        aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 disabled:opacity-50"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function ResetPasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nếu better-auth redirect kèm ?error=INVALID_TOKEN thì show lỗi.
  useEffect(() => {
    if (errorParam) {
      toast.error("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
    }
  }, [errorParam]);

  if (errorParam || !token) {
    return (
      <div className="mx-auto w-full max-w-md p-6 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-50">
          <XCircle className="size-6 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Liên kết không hợp lệ
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Liên kết đặt lại mật khẩu đã hết hạn hoặc không tồn tại. Vui lòng
          yêu cầu một liên kết mới.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/forgot-password"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Yêu cầu liên kết mới
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft className="size-4 mr-1" />
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  const form = useForm({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    validators: { onSubmit: resetPasswordSchema },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true);
      try {
        const { error } = await authClient.resetPassword({
          newPassword: value.newPassword,
          token,
        });
        if (error) {
          toast.error(
            error.message === "INVALID_TOKEN"
              ? "Liên kết đã hết hạn, vui lòng yêu cầu lại"
              : error.message || "Đặt lại mật khẩu thất bại",
          );
          return;
        }
        toast.success("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.");
        // Cấu hình revokeSessionsOnPasswordReset=true → session cũ đã bị revoke.
        // Đẩy user về /login để đăng nhập lại.
        router.replace("/login");
      } catch (err) {
        console.error("[auth] resetPassword error:", err);
        toast.error("Đã xảy ra lỗi, vui lòng thử lại");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="mx-auto w-full max-w-md p-6">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-indigo-50">
          <KeyRound className="size-6 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Đặt lại mật khẩu</h1>
        <p className="mt-1 text-sm text-slate-500">
          Nhập mật khẩu mới cho tài khoản của bạn
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
        <form.Field name="newPassword">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Mật khẩu mới</Label>
              <PasswordInput
                value={field.state.value}
                onChange={(v) => field.handleChange(v)}
                onBlur={field.handleBlur}
                placeholder="Tối thiểu 8 ký tự"
                autoComplete="new-password"
                disabled={isSubmitting}
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-red-500">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <form.Field name="confirmPassword">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Xác nhận mật khẩu mới</Label>
              <PasswordInput
                value={field.state.value}
                onChange={(v) => field.handleChange(v)}
                onBlur={field.handleBlur}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
                disabled={isSubmitting}
              />
              {field.state.meta.errors.map((error) => (
                <p key={error?.message} className="text-sm text-red-500">
                  {error?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Đang cập nhật...
            </>
          ) : (
            "Cập nhật mật khẩu"
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="size-4 mr-1" />
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordFormInner />
    </Suspense>
  );
}
