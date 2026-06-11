import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import HomeClient from "./home-client";

async function checkAuthAndRedirect() {
  const session = await auth.api.getSession({ headers: await headers() });

  // If already logged in, redirect to account page
  if (session?.user) {
    redirect("/account");
  }

  return null;
}

export default async function HomePage() {
  // This will redirect if user is logged in
  await checkAuthAndRedirect();

  // If not logged in, render the landing page
  return <HomeClient />;
}
