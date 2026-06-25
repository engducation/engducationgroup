import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AuthLoginPageClient from "./auth-login-client";

async function checkAuthAndRedirect() {
  const session = await auth.api.getSession({ headers: await headers() });

  // If already logged in, redirect based on role
  if (session?.user) {
    const role = (session.user as any).role;
    if (role === "admin") {
      redirect("/admin/dashboard");
    } else {
      redirect("/dashboard");
    }
  }

  return null;
}

export default async function AuthLoginPage() {
  // This will redirect if user is already logged in
  await checkAuthAndRedirect();

  // If not logged in, render the login page
  return <AuthLoginPageClient />;
}
