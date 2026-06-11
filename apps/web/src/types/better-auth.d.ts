import type { auth } from "@/lib/auth";

declare module "better-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      emailVerified: boolean;
      image?: string | null;
      role: string;
      subscriptionPlan: string;
      expiresAt: string | null;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    role: string;
    subscriptionPlan: string;
    expiresAt: string | null;
  }
}

declare module "better-auth/client" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      emailVerified: boolean;
      image?: string | null;
      role: string;
      subscriptionPlan: string;
      expiresAt: string | null;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    role: string;
    subscriptionPlan: string;
    expiresAt: string | null;
  }
}

declare module "better-auth/react" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      emailVerified: boolean;
      image?: string | null;
      role: string;
      subscriptionPlan: string;
      expiresAt: string | null;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    role: string;
    subscriptionPlan: string;
    expiresAt: string | null;
  }
}

export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.User;
