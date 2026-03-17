"use server";

import Stripe from "stripe";
import { db } from "@/db";
import { order, orderItem, cartItem, address } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";
import type { CartItem } from "@/lib/cart/types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

function generateOrderNumber(): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${date}-${rand}`;
}

export async function createCheckoutSession(
  shippingAddressId: string
): Promise<{ url: string }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch cart items
  const cartRows = await db.query.cartItem.findMany({
    where: eq(cartItem.userId, user.id),
  });

  if (cartRows.length === 0) throw new Error("Cart is empty");

  const items = cartRows.map((row) => ({
    id: row.id,
    addedAt: row.addedAt.toISOString(),
    configuration: row.configuration as CartItem["configuration"],
    priceSnapshot: row.priceSnapshot as CartItem["priceSnapshot"],
    quantity: row.quantity,
  })) satisfies CartItem[];

  // Fetch shipping address for snapshot
  const shippingAddr = await db.query.address.findFirst({
    where: eq(address.id, shippingAddressId),
  });

  if (!shippingAddr || shippingAddr.userId !== user.id) {
    throw new Error("Address not found");
  }

  const totalCents = items.reduce(
    (sum, item) => sum + Math.round(item.priceSnapshot.total * 100) * item.quantity,
    0
  );

  // Create order
  const orderId = crypto.randomUUID();
  const orderNumber = generateOrderNumber();

  await db.insert(order).values({
    id: orderId,
    userId: user.id,
    orderNumber,
    status: "pending",
    totalAmount: totalCents,
    shippingAddressId,
    billingAddressId: shippingAddressId,
    shippingAddressSnapshot: shippingAddr,
    billingAddressSnapshot: shippingAddr,
  });

  // Create order items
  for (const item of items) {
    await db.insert(orderItem).values({
      id: crypto.randomUUID(),
      orderId,
      sanityProductId: "custom-closet",
      productName: "Maatwerkkast",
      configurationSnapshot: {
        configuration: item.configuration,
        priceSnapshot: item.priceSnapshot,
      },
      quantity: item.quantity,
      unitPrice: Math.round(item.priceSnapshot.total * 100),
      totalPrice: Math.round(item.priceSnapshot.total * 100) * item.quantity,
    });
  }

  // Build Stripe line items
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
    (item) => {
      const config = item.configuration;
      return {
        price_data: {
          currency: "eur",
          product_data: {
            name: `Maatwerkkast ${config.widthCm}×${config.heightCm}×${config.depthCm} cm`,
            description: `${config.moduleCount} modules · ${config.buitenkantMaterialId}`,
          },
          unit_amount: Math.round(item.priceSnapshot.total * 100),
        },
        quantity: item.quantity,
      };
    }
  );

  const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000";

  // Create Stripe Checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${baseUrl}/order/${orderId}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/checkout`,
    metadata: { orderId, userId: user.id },
    customer_email: user.email,
  });

  // Store stripe session ID on the order
  await db
    .update(order)
    .set({ stripeCheckoutSessionId: session.id })
    .where(eq(order.id, orderId));

  revalidatePath("/cart");
  revalidatePath("/account/orders");

  return { url: session.url! };
}
