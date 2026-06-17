import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getOrderById } from "@/features/payment/services/order.service";
import { PaymentCheckoutClient } from "./payment-checkout-client";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function CheckoutPage({ params }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/login");
  }

  const { orderId } = await params;
  const order = await getOrderById(orderId, session.user.id);
  if (!order) {
    notFound();
  }

  return <PaymentCheckoutClient initialOrder={order} />;
}
