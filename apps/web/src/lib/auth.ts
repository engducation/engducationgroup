import { db } from "@/db";
import * as schema from "@/db/schema/auth";
import { user as userTable } from "@/db/schema/auth";
import { env } from "@/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthEndpoint } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
    // Khi user reset mật khẩu qua email → revoke tất cả session khác.
    // Ngăn kẻ tấn công dùng session cũ sau khi nạn nhân đổi pass.
    revokeSessionsOnPasswordReset: true,
    // Mật khẩu mới phải đủ mạnh theo policy dưới.
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    // Gửi email reset password. Trong dev không có SMTP thật nên
    // log link ra console (xem scripts/test-password-reset.ts).
    sendResetPassword: async ({ user, url }, _request) => {
      // eslint-disable-next-line no-console
      console.info(
        `[auth] Password reset requested for ${user.email}. Reset URL: ${url}`,
      );
      // TODO: tích hợp SMTP thật (SendGrid/Resend/Postmark) khi go-live.
    },
    onPasswordReset: async ({ user }, _request) => {
      // eslint-disable-next-line no-console
      console.info(`[auth] Password for user ${user.email} has been reset.`);
    },
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  user: {
    additionalFields: {
      role: {
        type: "string",
        input: false,
      },
      subscriptionPlan: {
        type: "string",
        input: false,
      },
      expiresAt: {
        type: "string",
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        async before(data) {
          return {
            data: {
              ...data,
              role: "user",
              emailVerified: true,
              subscriptionPlan: "FREE",
              status: "ACTIVE",
              activatedAt: null,
              expiresAt: null,
            },
          };
        },
      },
    },
  },
  plugins: [
    // Plugin: refresh-session
    //
    // Mục đích: Sau khi server-side cập nhật user record bên ngoài
    // better-auth (vd: webhook SePay grant Premium → user.subscriptionPlan
    // đã đổi), session cookie vẫn lưu giá trị cũ → UI đọc role cũ.
    // Endpoint này re-read user fresh từ DB và refresh cookie.
    //
    // Pattern tham khảo: Better-Auth issue #7513 (workaround được maintainer
    // hướng dẫn). Custom endpoint sống trong plugin để dùng đầy đủ
    // endpoint context (cookie helpers, internalAdapter).
    {
      id: "session-refresh",
      endpoints: {
        refreshSession: createAuthEndpoint(
          "/refresh-session",
          {
            method: "POST",
            requireHeaders: true,
          },
          async (ctx) => {
            const session = ctx.context.session;
            if (!session?.user) {
              return ctx.json(
                { success: false, error: "Unauthorized" },
                { status: 401 },
              );
            }

            // Re-read user fresh từ DB (kèm additional fields: role,
            // subscriptionPlan, expiresAt). Drizzle query vì
            // internalAdapter.findUserById chỉ trả base User shape.
            const [freshUser] = await db
              .select()
              .from(userTable)
              .where(eq(userTable.id, session.user.id))
              .limit(1);
            if (!freshUser) {
              return ctx.json(
                { success: false, error: "User not found" },
                { status: 404 },
              );
            }

            // Refresh session reference với user data mới.
            // Better-Auth sẽ tự re-issue cookie trong response handler.
            (ctx.context as unknown as { session: typeof session }).session = {
              ...session,
              user: freshUser,
            };

            // Gọi setSessionCookie qua internal helper để re-set cookie.
            // Trong better-auth 1.x, helper này nằm trong ctx.context
            // (cùng pattern mà /get-session dùng).
            const setSessionCookie = (
              ctx.context as unknown as {
                setSessionCookie?: (c: typeof ctx) => Promise<void>;
              }
            ).setSessionCookie;
            if (setSessionCookie) {
              await setSessionCookie(ctx);
            }

            return ctx.json({
              success: true,
              data: {
                user: {
                  id: freshUser.id,
                  email: freshUser.email,
                  name: freshUser.name,
                  role: freshUser.role,
                  subscriptionPlan: freshUser.subscriptionPlan,
                  expiresAt: freshUser.expiresAt,
                },
              },
            });
          },
        ),
      },
    },
    nextCookies(),
  ],
});
