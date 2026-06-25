import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { AccountClient } from "./account-client";

async function getData() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      redirect("/login");
    }

    const userId = session.user.id;

    // Get full user data with subscription info
    const [currentUser] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        subscriptionPlan: user.subscriptionPlan,
        expiresAt: user.expiresAt,
        activatedAt: user.activatedAt,
      })
      .from(user)
      .where(eq(user.id, userId));

    if (!currentUser) {
      redirect("/login");
    }

    // Calculate actual premium status
    const isPremium =
      currentUser.subscriptionPlan &&
      currentUser.subscriptionPlan !== "FREE" &&
      (currentUser.expiresAt ? new Date(currentUser.expiresAt) > new Date() : false);

    // Calculate days remaining
    let daysRemaining = 0;
    if (currentUser.expiresAt && new Date(currentUser.expiresAt) > new Date()) {
      const now = new Date();
      const expiry = new Date(currentUser.expiresAt);
      daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
      user: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        subscriptionPlan: currentUser.subscriptionPlan,
        expiresAt: currentUser.expiresAt,
        activatedAt: currentUser.activatedAt,
      },
      isPremium: Boolean(isPremium),
      daysRemaining,
    };
  } catch (error) {
    console.error("[AccountPage] Error fetching user data:", error);
    redirect("/login");
  }
}

export default async function AccountPage() {
  const { user: userData, isPremium, daysRemaining } = await getData();

  return (
    <AccountClient
      user={userData}
      isPremium={isPremium}
      daysRemaining={daysRemaining}
    />
  );
}
