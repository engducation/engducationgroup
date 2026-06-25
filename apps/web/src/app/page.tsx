import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import HomeClient from "./home-client";
import { getAllPackagePrices, type CalculatedPrice } from "@/features/payment/services/pricing.service";

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

  // Fetch dynamic pricing from database
  let pricing: CalculatedPrice[] = [];
  try {
    pricing = await getAllPackagePrices();
  } catch (error) {
    console.error("[HomePage] Failed to fetch pricing:", error);
    // Fallback to empty array, HomeClient will use defaults
  }

  // If not logged in, render the landing page
  return <HomeClient initialPricing={pricing} />;
}
