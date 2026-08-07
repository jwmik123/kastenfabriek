"use client";

import { getWishlist, clearWishlist } from "./wishlist-store";
import { syncWishlistItems } from "@/lib/actions/wishlist";

/**
 * Call this client-side after authentication.
 * Reads localStorage wishlist, pushes items to the server, then clears localStorage.
 */
export async function syncLocalWishlistToServer(): Promise<void> {
  const wishlist = getWishlist();
  if (wishlist.items.length === 0) return;

  await syncWishlistItems(wishlist.items);
  clearWishlist();
}
