import type { Cart, CartItem } from "./types";
import { CART_LS_KEY, CART_VERSION } from "./types";

function emptyCart(): Cart {
  return { version: CART_VERSION, items: [], updatedAt: new Date().toISOString() };
}

function dispatch() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cart-updated"));
  }
}

export function getCart(): Cart {
  if (typeof window === "undefined") return emptyCart();
  try {
    const raw = localStorage.getItem(CART_LS_KEY);
    if (!raw) return emptyCart();
    const parsed = JSON.parse(raw) as Cart;
    // Discard incompatible versions
    if (parsed.version !== CART_VERSION) return emptyCart();
    return parsed;
  } catch {
    return emptyCart();
  }
}

function saveCart(cart: Cart) {
  cart.updatedAt = new Date().toISOString();
  localStorage.setItem(CART_LS_KEY, JSON.stringify(cart));
  dispatch();
}

export function addItem(item: CartItem): void {
  const cart = getCart();
  // Replace if same id already exists (prevents duplicates)
  const idx = cart.items.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    cart.items[idx] = item;
  } else {
    cart.items.push(item);
  }
  saveCart(cart);
}

export function removeItem(itemId: string): void {
  const cart = getCart();
  cart.items = cart.items.filter((i) => i.id !== itemId);
  saveCart(cart);
}

export function updateItemQuantity(itemId: string, quantity: number): void {
  if (quantity < 1) {
    removeItem(itemId);
    return;
  }
  const cart = getCart();
  const item = cart.items.find((i) => i.id === itemId);
  if (item) {
    item.quantity = quantity;
    saveCart(cart);
  }
}

export function clearCart(): void {
  localStorage.removeItem(CART_LS_KEY);
  dispatch();
}

export function getCartItemCount(): number {
  return getCart().items.reduce((sum, i) => sum + i.quantity, 0);
}
