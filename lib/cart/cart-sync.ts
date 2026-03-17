"use client";

import { getCart, clearCart } from "./cart-store";
import { syncCartItems } from "@/lib/actions/cart";

/**
 * Call this client-side after authentication.
 * Reads localStorage cart, pushes items to Supabase, then clears localStorage.
 */
export async function syncLocalCartToServer(): Promise<void> {
  const cart = getCart();
  if (cart.items.length === 0) return;

  await syncCartItems(cart.items);
  clearCart();
}
