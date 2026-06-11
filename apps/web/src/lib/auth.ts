import { db } from "@/db";
import * as schema from "@/db/schema/auth";
import { env } from "@/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
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
    model: {
      safeAttributes: ["role", "subscriptionPlan"],
    },
  },
  hooks: {
    user: {
      // Ép buộc giá trị mặc định khi tạo tài khoản mới qua API sign-up:
      // - role: "user" — vai trò mặc định, admin gán thủ công
      // - emailVerified: true — đăng nhập ngay, không cần xác thực email
      // - subscriptionPlan: "FREE" — tài khoản free, không truy cập khóa học
      // - activatedAt/expiresAt: null — chưa có gói Premium
      beforeCreate: async (user) => {
        return {
          data: {
            ...user,
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
  plugins: [nextCookies()],
});
