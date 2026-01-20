"use server";

import { db } from "@/db";
import { wishlist, wishlistItem } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

export async function getWishlists() {
  const user = await getCurrentUser();
  if (!user) return [];

  return db.query.wishlist.findMany({
    where: eq(wishlist.userId, user.id),
    with: {
      // items: true, // Uncomment when relations are set up
    },
  });
}

export async function createWishlist(name: string = "Mijn verlanglijst") {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const id = crypto.randomUUID();
  await db.insert(wishlist).values({
    id,
    userId: user.id,
    name,
  });

  revalidatePath("/account");
  return { id };
}

export async function addToWishlist(data: {
  wishlistId: string;
  sanityProductId: string;
  productName: string;
  configurationSnapshot: Record<string, unknown>;
  calculatedPrice?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  const id = crypto.randomUUID();
  await db.insert(wishlistItem).values({
    id,
    wishlistId: data.wishlistId,
    sanityProductId: data.sanityProductId,
    productName: data.productName,
    configurationSnapshot: data.configurationSnapshot,
    calculatedPrice: data.calculatedPrice,
  });

  revalidatePath("/account");
  return { id };
}

export async function removeFromWishlist(itemId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  await db.delete(wishlistItem).where(eq(wishlistItem.id, itemId));
  revalidatePath("/account");
}

export async function deleteWishlist(wishlistId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");

  await db
    .delete(wishlist)
    .where(and(eq(wishlist.id, wishlistId), eq(wishlist.userId, user.id)));
  revalidatePath("/account");
}
