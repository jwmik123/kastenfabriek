import type {
  CartItem,
  ProductCartItem,
  ProductConfigSnapshot,
} from "./types";

/**
 * Would these two product lines be produced identically? Compares every option
 * a customer can pick, so a zijpaneel never merges into a door line and a left
 * door never merges into a right one.
 */
export function sameProductLine(
  a: ProductConfigSnapshot,
  b: ProductConfigSnapshot,
): boolean {
  return (
    a.sanityProductId === b.sanityProductId &&
    (a.doorType ?? 'deuren') === (b.doorType ?? 'deuren') &&
    a.widthCm === b.widthCm &&
    a.widthLabel === b.widthLabel &&
    a.heightCm === b.heightCm &&
    (a.isVerlengd ?? false) === (b.isVerlengd ?? false) &&
    a.doorSide === b.doorSide &&
    a.depthCm === b.depthCm &&
    a.materialId === b.materialId
  );
}

/**
 * Merge a product item into a cart, or append it.
 *
 * Identity for merging: every configured option a customer can pick — product,
 * type, size, material, hinge side and zijpaneel depth. Two lines only merge
 * when they would be produced identically. On match, the existing line's
 * quantity is incremented by the incoming item's quantity. On no match, the
 * item is appended.
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
      sameProductLine(it.configuration, incoming.configuration),
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
