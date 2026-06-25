import { auth } from "@/lib/auth";
import { db } from "@/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { user } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { ProfileClient } from "./profile-client";

async function getData() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Get full user data
  const [currentUser] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      phone: user.phone,
      address: user.address,
      dateOfBirth: user.dateOfBirth,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, userId));

  if (!currentUser) {
    redirect("/login");
  }

  return {
    user: {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      image: currentUser.image,
      phone: currentUser.phone,
      address: currentUser.address,
      dateOfBirth: currentUser.dateOfBirth,
      createdAt: currentUser.createdAt,
    },
  };
}

export default async function ProfilePage() {
  const { user: userData } = await getData();

  return <ProfileClient user={userData} />;
}
