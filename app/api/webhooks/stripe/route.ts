import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { order, cartItem } from "@/db/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    const userId = session.metadata?.userId;

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId in metadata" }, { status: 400 });
    }

    // Update order: mark as paid, store payment intent
    await db
      .update(order)
      .set({
        status: "paid",
        stripePaymentIntentId: session.payment_intent as string,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(order.id, orderId));

    // Clear the user's server-side cart
    if (userId) {
      await db.delete(cartItem).where(eq(cartItem.userId, userId));
    }
  }

  return NextResponse.json({ received: true });
}
