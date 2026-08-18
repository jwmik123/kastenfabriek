"use server";

import Stripe from "stripe";
import { db } from "@/db";
import { order, orderItem, cartItem, address } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";
import type { CartItem, ClosetCartItem, ProductCartItem } from "@/lib/cart/types";
import { calcCartTotals, lineNetOfDelivery } from "@/lib/cart/totals";
import {
  CLOSET_TYPE_LABELS,
  buildClosetSpec,
  getMaterialName,
  resolveClosetKind,
} from "@/lib/order/closet-spec";

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
  shippingAddressId: string,
  coupon?: { couponCode: string; discountAmount: number }
): Promise<{ url: string }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch cart items
  const cartRows = await db.query.cartItem.findMany({
    where: eq(cartItem.userId, user.id),
  });

  if (cartRows.length === 0) throw new Error("Cart is empty");

  const items: CartItem[] = cartRows.map((row) => {
    const base = {
      id: row.id,
      addedAt: row.addedAt.toISOString(),
      quantity: row.quantity,
      screenshotClosedUrl: row.screenshotClosedUrl ?? undefined,
      screenshotOpenUrl: row.screenshotOpenUrl ?? undefined,
    };
    if (row.kind === "product") {
      return {
        ...base,
        kind: "product",
        configuration: row.configuration as ProductCartItem["configuration"],
        priceSnapshot: row.priceSnapshot as ProductCartItem["priceSnapshot"],
      };
    }
    return {
      ...base,
      kind: "closet",
      configuration: row.configuration as ClosetCartItem["configuration"],
      priceSnapshot: row.priceSnapshot as ClosetCartItem["priceSnapshot"],
    };
  });

  // Fetch shipping address for snapshot
  const shippingAddr = await db.query.address.findFirst({
    where: eq(address.id, shippingAddressId),
  });

  if (!shippingAddr || shippingAddr.userId !== user.id) {
    throw new Error("Address not found");
  }

  const totals = calcCartTotals(items);
  const totalCents = Math.round(totals.grandTotal * 100);

  const discountCents = coupon ? Math.min(coupon.discountAmount, totalCents) : 0;
  const discountedTotal = totalCents - discountCents;
  const deliveryCents = Math.round(totals.delivery * 100);

  // Create order
  const orderId = crypto.randomUUID();
  const orderNumber = generateOrderNumber();

  await db.insert(order).values({
    id: orderId,
    userId: user.id,
    orderNumber,
    status: "pending",
    totalAmount: discountedTotal,
    shippingAddressId,
    billingAddressId: shippingAddressId,
    shippingAddressSnapshot: shippingAddr,
    billingAddressSnapshot: shippingAddr,
    couponCode: coupon?.couponCode ?? null,
    discountAmount: coupon ? discountCents : null,
  });

  // Create order items (dispatch by kind)
  for (const item of items) {
    const kind = item.kind;
    const closetKind =
      kind === "closet" ? resolveClosetKind(item.configuration) : null;
    const sanityId =
      kind === "product" ? item.configuration.sanityProductId : `custom-${closetKind}`;
    const productName =
      kind === "product"
        ? item.configuration.productName
        : CLOSET_TYPE_LABELS[closetKind!];
    const lineNetEur = lineNetOfDelivery(item);
    const unitPriceCents = Math.round(lineNetEur * 100);

    await db.insert(orderItem).values({
      id: crypto.randomUUID(),
      orderId,
      sanityProductId: sanityId,
      productName,
      kind,
      // The coupon is an order-level concept and lives on the order row. It
      // used to be stamped onto every closet line too, which made a
      // multi-cabinet order show the discount once per cabinet.
      configurationSnapshot: {
        configuration: item.configuration,
        priceSnapshot: item.priceSnapshot,
        screenshotClosedUrl: item.screenshotClosedUrl ?? null,
        screenshotOpenUrl: item.screenshotOpenUrl ?? null,
      },
      quantity: item.quantity,
      unitPrice: unitPriceCents,
      totalPrice: unitPriceCents * item.quantity,
    });
  }

  // Build Stripe line items: each line bills (line.total − deliveryCost) × qty.
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
    (item) => {
      const unitAmount = Math.round(lineNetOfDelivery(item) * 100);
      if (item.kind === "product") {
        const cfg = item.configuration;
        return {
          price_data: {
            currency: "eur",
            product_data: {
              name: cfg.productName,
              description: `${cfg.widthCm}×${cfg.heightCm} cm · ${cfg.materialName}`,
            },
            unit_amount: unitAmount,
          },
          quantity: item.quantity,
        };
      }
      const cfg = item.configuration;
      const spec = buildClosetSpec(cfg, item.priceSnapshot);
      const moduleTotal = spec.sections.reduce((sum, s) => sum + s.moduleCount, 0);
      return {
        price_data: {
          currency: "eur",
          product_data: {
            name: spec.title,
            description: `${moduleTotal} modules · ${getMaterialName(cfg.buitenkantMaterialId)}`,
          },
          unit_amount: unitAmount,
        },
        quantity: item.quantity,
      };
    }
  );

  // One deduplicated delivery line.
  if (deliveryCents > 0) {
    lineItems.push({
      price_data: {
        currency: "eur",
        product_data: { name: "Bezorging" },
        unit_amount: deliveryCents,
      },
      quantity: 1,
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000";

  let stripeDiscounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
  if (coupon && discountCents > 0) {
    const stripeCoupon = await stripe.coupons.create({
      amount_off: discountCents,
      currency: "eur",
      duration: "once",
      name: `Korting (${coupon.couponCode})`,
    });
    stripeDiscounts = [{ coupon: stripeCoupon.id }];
  }

  // Create Stripe Checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    ...(stripeDiscounts && { discounts: stripeDiscounts }),
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
