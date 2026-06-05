import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import Loader from "./loader";

const ROLE_REDIRECTS = {
  admin: "/admin/dashboard",
  user: "/dashboard",
} as const;

async function resolveRoleAfterSignIn() {
  const session = await authClient.getSession();
  const role = session.data?.user?.role;

  console.info("[auth] resolved role after sign-in:", role, session.data?.user?.email);

  return role;
}

async function redirectToRoleDashboard(
  router: ReturnType<typeof useRouter>,
  role: string | null | undefined,
) {
  const destination = role === "admin" ? ROLE_REDIRECTS.admin : ROLE_REDIRECTS.user;

  router.replace(destination);
  router.refresh();
}

export default function SignInForm({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
  const router = useRouter();
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: async (ctx) => {
            const initialRole = ctx.data?.user?.role;
            console.info("[auth] sign-in success role from callback:", initialRole, ctx.data?.user?.email);

            const resolvedRole = initialRole ?? (await resolveRoleAfterSignIn());

            toast.success("Đăng nhập thành công");
            await redirectToRoleDashboard(router, resolvedRole);
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Địa chỉ email không hợp lệ"),
        password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="mx-auto w-full max-w-md p-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Chào mừng trở lại</h1>
        <p className="mt-1 text-sm text-slate-500">Đăng nhập để tiếp tục học tiếng Anh</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <div>
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
        </div>

        <div>
          <form.Field name="password">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Mật khẩu</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="••••••••"
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
        </div>

        <form.Subscribe
          selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-4 text-center">
        <Button
          variant="link"
          onClick={onSwitchToSignUp}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          Chưa có tài khoản? Đăng ký ngay
        </Button>
      </div>
    </div>
  );
}
