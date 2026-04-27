import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { order, orderItem, cartItem } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendOrderConfirmationEmail } from "@/lib/email/resend";
import { incrementCouponUseCount } from "@/lib/actions/coupon";
import type { ClosetConfigSnapshot, PriceSnapshot } from "@/lib/cart/types";

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

    const fullOrder = await db.query.order.findFirst({
      where: eq(order.id, orderId),
    });

    // Increment coupon use count post-payment
    if (fullOrder?.couponCode) {
      try {
        await incrementCouponUseCount(fullOrder.couponCode);
      } catch (err) {
        console.error("Failed to increment coupon use count:", err);
      }
    }

    // Send order confirmation email
    const customerEmail = session.customer_email;
    if (customerEmail) {
      const orderItems = await db.query.orderItem.findMany({
        where: eq(orderItem.orderId, orderId),
      });

      if (fullOrder) {
        const shippingAddress = fullOrder.shippingAddressSnapshot as {
          firstName: string;
          lastName: string;
          company?: string | null;
          street: string;
          houseNumber: string;
          houseNumberAddition?: string | null;
          postalCode: string;
          city: string;
          country: string;
          phone?: string | null;
        };

        const items = orderItems.map((item) => {
          const snapshot = item.configurationSnapshot as {
            configuration: ClosetConfigSnapshot;
            priceSnapshot: PriceSnapshot;
            screenshotClosedUrl?: string | null;
            screenshotOpenUrl?: string | null;
          };
          return {
            configuration: snapshot.configuration,
            priceSnapshot: snapshot.priceSnapshot,
            screenshotClosedUrl: snapshot.screenshotClosedUrl ?? undefined,
            screenshotOpenUrl: snapshot.screenshotOpenUrl ?? undefined,
          };
        });

        await sendOrderConfirmationEmail({
          orderNumber: fullOrder.orderNumber,
          orderDate: fullOrder.paidAt ?? fullOrder.createdAt,
          customerEmail,
          shippingAddress,
          items,
          totalAmountCents: fullOrder.totalAmount,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
