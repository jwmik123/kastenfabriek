import type { CartItem, ProductCartItem } from "./types";

/**
 * Merge a product item into a cart, or append it.
 *
 * Identity for merging: same `(sanityProductId, widthCm, heightCm, materialId)`.
 * On match, the existing line's quantity is incremented by the incoming
 * item's quantity. On no match, the item is appended.
 *
 * Closet items are never considered for merging.
 */
export function mergeOrAddProduct(
  items: CartItem[],
  incoming: ProductCartItem,
): CartItem[] {
  const idx = items.findIndex(
    (it) =>
      it.kind === 'product' &&
      it.configuration.sanityProductId === incoming.configuration.sanityProductId &&
      it.configuration.widthCm === incoming.configuration.widthCm &&
      it.configuration.heightCm === incoming.configuration.heightCm &&
      it.configuration.materialId === incoming.configuration.materialId,
  );

  if (idx === -1) {
    return [...items, incoming];
  }

  const next = items.slice();
  const existing = next[idx] as ProductCartItem;
  next[idx] = {
    ...existing,
    quantity: existing.quantity + incoming.quantity,
  };
  return next;
}
