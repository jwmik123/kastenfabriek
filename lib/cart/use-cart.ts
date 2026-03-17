"use client";

import { useEffect, useState, useCallback } from "react";
import type { CartItem } from "./types";
import {
  getCart,
  addItem as storeAdd,
  removeItem as storeRemove,
  updateItemQuantity as storeUpdateQty,
  clearCart as storeClear,
  getCartItemCount,
} from "./cart-store";

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const sync = useCallback(() => {
    setItems(getCart().items);
  }, []);

  useEffect(() => {
    sync();
    setIsHydrated(true);

    window.addEventListener("cart-updated", sync);
    window.addEventListener("storage", sync); // cross-tab sync
    return () => {
      window.removeEventListener("cart-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, [sync]);

  const addItem = useCallback((item: CartItem) => {
    storeAdd(item);
  }, []);

  const removeItem = useCallback((id: string) => {
    storeRemove(id);
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    storeUpdateQty(id, quantity);
  }, []);

  const clearCart = useCallback(() => {
    storeClear();
  }, []);

  return {
    items,
    itemCount: isHydrated ? getCartItemCount() : 0,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    isHydrated,
  };
}
