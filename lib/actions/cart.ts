"use server";

import { db } from "@/db";
import { cartItem } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "./auth";
import type {
  CartItem,
  ClosetCartItem,
  ProductCartItem,
} from "@/lib/cart/types";

export async function syncCartItems(items: CartItem[]): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  for (const item of items) {
    await db
      .insert(cartItem)
      .values({
        id: item.id,
        userId: user.id,
        kind: item.kind,
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
          kind: item.kind,
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

function rowToCartItem(row: {
  id: string;
  kind: string;
  addedAt: Date;
  configuration: unknown;
  priceSnapshot: unknown;
  quantity: number;
  screenshotClosedUrl: string | null;
  screenshotOpenUrl: string | null;
}): CartItem {
  const base = {
    id: row.id,
    addedAt: row.addedAt.toISOString(),
    quantity: row.quantity,
    screenshotClosedUrl: row.screenshotClosedUrl ?? undefined,
    screenshotOpenUrl: row.screenshotOpenUrl ?? undefined,
  };
  if (row.kind === 'product') {
    return {
      ...base,
      kind: 'product',
      configuration: row.configuration as ProductCartItem['configuration'],
      priceSnapshot: row.priceSnapshot as ProductCartItem['priceSnapshot'],
    };
  }
  return {
    ...base,
    kind: 'closet',
    configuration: row.configuration as ClosetCartItem['configuration'],
    priceSnapshot: row.priceSnapshot as ClosetCartItem['priceSnapshot'],
  };
}

export async function getDbCartItems(): Promise<CartItem[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const rows = await db.query.cartItem.findMany({
    where: eq(cartItem.userId, user.id),
    orderBy: (t, { asc }) => [asc(t.addedAt)],
  });

  return rows.map(rowToCartItem);
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

  return rowToCartItem(row);
}

export async function clearDbCart(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  await db.delete(cartItem).where(eq(cartItem.userId, user.id));
}

/**
 * Add or merge a product cart item for the current user.
 *
 * Identity for merging: same `(sanityProductId, widthCm, heightCm, materialId)`.
 * On match, the existing line's quantity increments by `incoming.quantity`.
 * On no match, the incoming item is inserted as a new row.
 */
export async function addProductCartItem(incoming: ProductCartItem): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const existingRows = await db.query.cartItem.findMany({
    where: and(eq(cartItem.userId, user.id), eq(cartItem.kind, 'product')),
  });

  const match = existingRows.find((row) => {
    const cfg = row.configuration as ProductCartItem['configuration'];
    return (
      cfg.sanityProductId === incoming.configuration.sanityProductId &&
      cfg.widthCm === incoming.configuration.widthCm &&
      cfg.heightCm === incoming.configuration.heightCm &&
      cfg.materialId === incoming.configuration.materialId
    );
  });

  if (match) {
    await db
      .update(cartItem)
      .set({
        quantity: match.quantity + incoming.quantity,
        updatedAt: new Date(),
      })
      .where(eq(cartItem.id, match.id));
    return;
  }

  await db.insert(cartItem).values({
    id: incoming.id,
    userId: user.id,
    kind: 'product',
    configuration: incoming.configuration as unknown as Record<string, unknown>,
    priceSnapshot: incoming.priceSnapshot as unknown as Record<string, unknown>,
    quantity: incoming.quantity,
    screenshotClosedUrl: incoming.screenshotClosedUrl ?? null,
    screenshotOpenUrl: incoming.screenshotOpenUrl ?? null,
    addedAt: new Date(incoming.addedAt),
  });
}
