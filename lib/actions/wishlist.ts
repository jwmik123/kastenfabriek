"use server";

import { db } from "@/db";
import { wishlistItem, cartItem } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "./auth";
import type {
  CartItem,
  ClosetCartItem,
  ProductCartItem,
} from "@/lib/cart/types";

function rowToWishlistItem(row: {
  id: string;
  kind: string;
  addedAt: Date;
  configuration: unknown;
  priceSnapshot: unknown;
  screenshotClosedUrl: string | null;
  screenshotOpenUrl: string | null;
}): CartItem {
  const base = {
    id: row.id,
    addedAt: row.addedAt.toISOString(),
    quantity: 1,
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
}

export async function syncWishlistItems(items: CartItem[]): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  for (const item of items) {
    await db
      .insert(wishlistItem)
      .values({
        id: item.id,
        userId: user.id,
        kind: item.kind,
        configuration: item.configuration as unknown as Record<string, unknown>,
        priceSnapshot: item.priceSnapshot as unknown as Record<string, unknown>,
        screenshotClosedUrl: item.screenshotClosedUrl ?? null,
        screenshotOpenUrl: item.screenshotOpenUrl ?? null,
        addedAt: new Date(item.addedAt),
      })
      .onConflictDoUpdate({
        target: wishlistItem.id,
        set: {
          kind: item.kind,
          configuration: item.configuration as unknown as Record<string, unknown>,
          priceSnapshot: item.priceSnapshot as unknown as Record<string, unknown>,
          screenshotClosedUrl: item.screenshotClosedUrl ?? null,
          screenshotOpenUrl: item.screenshotOpenUrl ?? null,
          updatedAt: new Date(),
        },
      });
  }
}

export async function getDbWishlistItems(): Promise<CartItem[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const rows = await db.query.wishlistItem.findMany({
    where: eq(wishlistItem.userId, user.id),
    orderBy: (t, { asc }) => [asc(t.addedAt)],
  });

  return rows.map(rowToWishlistItem);
}

export async function removeDbWishlistItem(itemId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  await db
    .delete(wishlistItem)
    .where(and(eq(wishlistItem.id, itemId), eq(wishlistItem.userId, user.id)));
}

export async function clearDbWishlist(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  await db.delete(wishlistItem).where(eq(wishlistItem.userId, user.id));
}

/**
 * Move a wishlist line to the cart (same id, quantity 1), then remove it
 * from the wishlist. No-op if the wishlist row doesn't exist.
 */
export async function moveDbWishlistItemToCart(itemId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const row = await db.query.wishlistItem.findFirst({
    where: and(eq(wishlistItem.id, itemId), eq(wishlistItem.userId, user.id)),
  });
  if (!row) return;

  await db
    .insert(cartItem)
    .values({
      id: row.id,
      userId: user.id,
      kind: row.kind,
      configuration: row.configuration as Record<string, unknown>,
      priceSnapshot: row.priceSnapshot as Record<string, unknown>,
      quantity: 1,
      screenshotClosedUrl: row.screenshotClosedUrl,
      screenshotOpenUrl: row.screenshotOpenUrl,
      addedAt: row.addedAt,
    })
    .onConflictDoUpdate({
      target: cartItem.id,
      set: {
        kind: row.kind,
        configuration: row.configuration as Record<string, unknown>,
        priceSnapshot: row.priceSnapshot as Record<string, unknown>,
        screenshotClosedUrl: row.screenshotClosedUrl,
        screenshotOpenUrl: row.screenshotOpenUrl,
        updatedAt: new Date(),
      },
    });

  await db.delete(wishlistItem).where(eq(wishlistItem.id, itemId));
}
