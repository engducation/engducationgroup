/**
 * Shared types for Better Auth session user.
 * This file provides proper TypeScript types for the additional fields
 * (role, subscriptionPlan, expiresAt) that Better Auth adds to the user object.
 */

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role: string;
  subscriptionPlan: string;
  expiresAt: string | null;
}

/**
 * Type assertion helper for Better Auth session user.
 * Use this when accessing additionalFields from the session that TypeScript
 * doesn't know about due to Better Auth's type inference limitations.
 */
export function asSessionUser(user: unknown): SessionUser {
  return user as SessionUser;
}
