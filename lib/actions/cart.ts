"use server";

import { db } from "@/db";
import { cartItem } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "./auth";
import type { CartItem } from "@/lib/cart/types";

export async function syncCartItems(items: CartItem[]): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  for (const item of items) {
    await db
      .insert(cartItem)
      .values({
        id: item.id,
        userId: user.id,
        configuration: item.configuration as unknown as Record<string, unknown>,
        priceSnapshot: item.priceSnapshot as unknown as Record<string, unknown>,
        quantity: item.quantity,
        screenshotClosedUrl: item.screenshotClosedUrl ?? null,
        screenshotOpenUrl: item.screenshotOpenUrl ?? null,
        addedAt: new Date(item.addedAt),
      })
      .onConflictDoUpdate({
        target: cartItem.id,
        set: {
          configuration: item.configuration as unknown as Record<string, unknown>,
          priceSnapshot: item.priceSnapshot as unknown as Record<string, unknown>,
          quantity: item.quantity,
          screenshotClosedUrl: item.screenshotClosedUrl ?? null,
          screenshotOpenUrl: item.screenshotOpenUrl ?? null,
          updatedAt: new Date(),
        },
      });
  }
}

export async function getDbCartItems(): Promise<CartItem[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const rows = await db.query.cartItem.findMany({
    where: eq(cartItem.userId, user.id),
    orderBy: (t, { asc }) => [asc(t.addedAt)],
  });

  return rows.map((row) => ({
    id: row.id,
    addedAt: row.addedAt.toISOString(),
    configuration: row.configuration as CartItem["configuration"],
    priceSnapshot: row.priceSnapshot as CartItem["priceSnapshot"],
    quantity: row.quantity,
    screenshotClosedUrl: row.screenshotClosedUrl ?? undefined,
    screenshotOpenUrl: row.screenshotOpenUrl ?? undefined,
  }));
}

export async function removeDbCartItem(itemId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  // Only delete if it belongs to the user
  await db
    .delete(cartItem)
    .where(and(eq(cartItem.id, itemId), eq(cartItem.userId, user.id)));
}

export async function getDbCartItemById(itemId: string): Promise<CartItem | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const row = await db.query.cartItem.findFirst({
    where: and(eq(cartItem.id, itemId), eq(cartItem.userId, user.id)),
  });

  if (!row) return null;

  return {
    id: row.id,
    addedAt: row.addedAt.toISOString(),
    configuration: row.configuration as CartItem["configuration"],
    priceSnapshot: row.priceSnapshot as CartItem["priceSnapshot"],
    quantity: row.quantity,
    screenshotClosedUrl: row.screenshotClosedUrl ?? undefined,
    screenshotOpenUrl: row.screenshotOpenUrl ?? undefined,
  };
}

export async function clearDbCart(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  await db.delete(cartItem).where(eq(cartItem.userId, user.id));
}
