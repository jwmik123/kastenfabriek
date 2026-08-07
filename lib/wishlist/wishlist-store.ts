import type { CartItem } from "@/lib/cart/types";

// Wishlist items reuse the CartItem shape so a wishlist line can be moved to
// the cart (and back) without conversion. Quantity is always 1 on a wishlist.
export interface WishlistData {
  version: number;
  items: CartItem[];
  updatedAt: string;
}

export const WISHLIST_VERSION = 1;
export const WISHLIST_LS_KEY = "kf-wishlist";

function emptyWishlist(): WishlistData {
  return { version: WISHLIST_VERSION, items: [], updatedAt: new Date().toISOString() };
}

function dispatch() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("wishlist-updated"));
  }
}

export function getWishlist(): WishlistData {
  if (typeof window === "undefined") return emptyWishlist();
  try {
    const raw = localStorage.getItem(WISHLIST_LS_KEY);
    if (!raw) return emptyWishlist();
    const parsed = JSON.parse(raw) as WishlistData;
    // Discard incompatible versions
    if (parsed.version !== WISHLIST_VERSION) return emptyWishlist();
    return parsed;
  } catch {
    return emptyWishlist();
  }
}

function saveWishlist(wishlist: WishlistData) {
  wishlist.updatedAt = new Date().toISOString();
  localStorage.setItem(WISHLIST_LS_KEY, JSON.stringify(wishlist));
  dispatch();
}

export function addWishlistItem(item: CartItem): void {
  const wishlist = getWishlist();
  const idx = wishlist.items.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    wishlist.items[idx] = item;
  } else {
    wishlist.items.push(item);
  }
  saveWishlist(wishlist);
}

export function removeWishlistItem(itemId: string): void {
  const wishlist = getWishlist();
  wishlist.items = wishlist.items.filter((i) => i.id !== itemId);
  saveWishlist(wishlist);
}

export function clearWishlist(): void {
  localStorage.removeItem(WISHLIST_LS_KEY);
  dispatch();
}

export function getWishlistItemCount(): number {
  return getWishlist().items.length;
}
