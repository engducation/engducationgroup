"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  Save,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";

interface ProfileClientProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    phone: string | null;
    address: string | null;
    dateOfBirth: Date | string | null;
    createdAt: Date | string;
  };
}

function formatDate(date: Date | string | null) {
  if (!date) return "Chưa cập nhật";
  const d = new Date(date);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

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

export function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const profileForm = useForm({
    defaultValues: {
      name: user.name || "",
      phone: user.phone || "",
      address: user.address || "",
    },
    onSubmit: async ({ value }) => {
      // Validate name
      if (!value.name || value.name.trim().length === 0) {
        toast.error("Vui lòng nhập họ và tên");
        return;
      }
      if (value.name.length > 100) {
        toast.error("Tên không được quá 100 ký tự");
        return;
      }

      setIsUpdating(true);
      try {
        const response = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: value.name.trim(),
            phone: value.phone,
            address: value.address,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          toast.error(data.message || "Cập nhật thất bại");
          return;
        }

        toast.success("Cập nhật hồ sơ thành công");
        router.refresh();
      } catch (error) {
        console.error("Update profile error:", error);
        toast.error("Đã xảy ra lỗi, vui lòng thử lại");
      } finally {
        setIsUpdating(false);
      }
    },
  });

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      // Validation
      if (!value.currentPassword) {
        toast.error("Vui lòng nhập mật khẩu hiện tại");
        return;
      }
      if (value.newPassword.length < 8) {
        toast.error("Mật khẩu mới phải có ít nhất 8 ký tự");
        return;
      }
      if (value.newPassword.length > 128) {
        toast.error("Mật khẩu không được vượt quá 128 ký tự");
        return;
      }
      if (value.newPassword !== value.confirmPassword) {
        toast.error("Mật khẩu xác nhận không khớp");
        return;
      }
      if (value.newPassword === value.currentPassword) {
        toast.error("Mật khẩu mới phải khác mật khẩu hiện tại");
        return;
      }

      setIsChangingPassword(true);
      try {
        const { error } = await authClient.changePassword({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
          revokeOtherSessions: true,
        });

        if (error) {
          const message =
            error.code === "INVALID_PASSWORD" ||
            error.code === "INVALID_CREDENTIALS"
              ? "Mật khẩu hiện tại không chính xác"
              : error.message || "Đổi mật khẩu thất bại";
          toast.error(message);
          return;
        }

        toast.success("Đổi mật khẩu thành công");
        passwordForm.reset();
      } catch (err) {
        console.error("[auth] changePassword error:", err);
        toast.error("Đã xảy ra lỗi, vui lòng thử lại");
      } finally {
        setIsChangingPassword(false);
      }
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Hồ sơ cá nhân</h1>
        <p className="text-sm text-slate-500">
          Quản lý thông tin cá nhân và bảo mật tài khoản của bạn
        </p>
      </div>

      {/* Profile Overview Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar className="size-20 border-4 border-white/30 shadow-xl">
                <AvatarImage src={user.image || undefined} alt={user.name || "Avatar"} />
                <AvatarFallback className="bg-white/20 text-white text-2xl font-bold">
                  {user.name ? getInitials(user.name) : "HV"}
                </AvatarFallback>
              </Avatar>
              <button className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-white shadow-lg hover:bg-slate-50 transition-colors">
                <Camera className="size-4 text-slate-600" />
              </button>
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">{user.name || "Học viên"}</h2>
              <p className="text-sm text-white/70">{user.email}</p>
              <div className="flex items-center gap-2 text-xs text-white/60">
                <Calendar className="size-3.5" />
                Tham gia {formatDate(user.createdAt)}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-100">
              <User className="size-5 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Thông tin cá nhân</CardTitle>
              <CardDescription>Cập nhật thông tin liên hệ của bạn</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              profileForm.handleSubmit();
            }}
            className="space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <profileForm.Field name="name">
                    {(field) => (
                      <Input
                        id="name"
                        type="text"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="Nhập họ và tên"
                        disabled={isUpdating}
                        className="pl-10 rounded-lg"
                      />
                    )}
                  </profileForm.Field>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    type="email"
                    value={user.email || ""}
                    disabled
                    className="pl-10 rounded-lg bg-slate-50"
                  />
                </div>
                <p className="text-xs text-slate-400">Email không thể thay đổi</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <profileForm.Field name="phone">
                    {(field) => (
                      <Input
                        id="phone"
                        type="tel"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="Nhập số điện thoại"
                        disabled={isUpdating}
                        className="pl-10 rounded-lg"
                      />
                    )}
                  </profileForm.Field>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <profileForm.Field name="address">
                    {(field) => (
                      <Input
                        id="address"
                        type="text"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="Nhập địa chỉ của bạn"
                        disabled={isUpdating}
                        className="pl-10 rounded-lg"
                      />
                    )}
                  </profileForm.Field>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isUpdating}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100">
              <KeyRound className="size-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Đổi mật khẩu</CardTitle>
              <CardDescription>Cập nhật mật khẩu để bảo vệ tài khoản</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              passwordForm.handleSubmit();
            }}
            className="space-y-5"
          >
            <passwordForm.Field name="currentPassword">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Mật khẩu hiện tại</Label>
                  <PasswordInput
                    value={field.state.value}
                    onChange={(v) => field.handleChange(v)}
                    onBlur={field.handleBlur}
                    placeholder="Nhập mật khẩu hiện tại"
                    autoComplete="current-password"
                    disabled={isChangingPassword}
                  />
                </div>
              )}
            </passwordForm.Field>

            <passwordForm.Field name="newPassword">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Mật khẩu mới</Label>
                  <PasswordInput
                    value={field.state.value}
                    onChange={(v) => field.handleChange(v)}
                    onBlur={field.handleBlur}
                    placeholder="Tối thiểu 8 ký tự"
                    autoComplete="new-password"
                    disabled={isChangingPassword}
                  />
                </div>
              )}
            </passwordForm.Field>

            <passwordForm.Field name="confirmPassword">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Xác nhận mật khẩu mới</Label>
                  <PasswordInput
                    value={field.state.value}
                    onChange={(v) => field.handleChange(v)}
                    onBlur={field.handleBlur}
                    placeholder="Nhập lại mật khẩu mới"
                    autoComplete="new-password"
                    disabled={isChangingPassword}
                  />
                </div>
              )}
            </passwordForm.Field>

            <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              <ShieldCheck className="size-4 shrink-0 text-emerald-600 mt-0.5" />
              <p>
                Sau khi đổi mật khẩu, các phiên đăng nhập khác trên các thiết bị khác sẽ tự động bị đăng xuất để bảo vệ tài khoản của bạn.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isChangingPassword}
                className="rounded-lg bg-amber-600 hover:bg-amber-700 gap-2"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <KeyRound className="size-4" />
                    Cập nhật mật khẩu
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
