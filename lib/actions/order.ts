"use server";

import { db } from "@/db";
import { order, orderItem, address } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `KF-${year}-${random}`;
}

export type OrderItemInput = {
  sanityProductId: string;
  productName: string;
  configurationSnapshot: Record<string, unknown>;
  quantity: number;
  unitPrice: number; // in cents
};

export type CreateOrderInput = {
  items: OrderItemInput[];
  shippingAddressId: string;
  billingAddressId?: string;
  notes?: string;
};

export async function getOrders() {
  const user = await getCurrentUser();
  if (!user) return [];

  return db.query.order.findMany({
    where: (o, { and, ne }) =>
      and(eq(o.userId, user.id), ne(o.status, "pending")),
    orderBy: (order, { desc }) => [desc(order.createdAt)],
  });
}

export async function getOrderById(orderId: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const result = await db.query.order.findFirst({
    where: eq(order.id, orderId),
  });

  if (!result || result.userId !== user.id) return null;
  return result;
}

export async function createOrder(data: CreateOrderInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  // Calculate total
  const totalAmount = data.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  // Get address snapshots
  const shippingAddr = await db.query.address.findFirst({
    where: eq(address.id, data.shippingAddressId),
  });

  const billingAddr = data.billingAddressId
    ? await db.query.address.findFirst({
        where: eq(address.id, data.billingAddressId),
      })
    : shippingAddr;

  // Create order
  const orderId = crypto.randomUUID();
  await db.insert(order).values({
    id: orderId,
    userId: user.id,
    orderNumber: generateOrderNumber(),
    status: "pending",
    totalAmount,
    shippingAddressId: data.shippingAddressId,
    billingAddressId: data.billingAddressId || data.shippingAddressId,
    shippingAddressSnapshot: shippingAddr,
    billingAddressSnapshot: billingAddr,
    notes: data.notes,
  });

  // Create order items
  for (const item of data.items) {
    await db.insert(orderItem).values({
      id: crypto.randomUUID(),
      orderId,
      sanityProductId: item.sanityProductId,
      productName: item.productName,
      configurationSnapshot: item.configurationSnapshot,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.unitPrice * item.quantity,
    });
  }

  revalidatePath("/account");
  return { orderId, orderNumber: generateOrderNumber() };
}
