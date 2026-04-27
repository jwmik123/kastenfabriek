export function calculateDiscount(
  subtotal: number,
  discount: { discountType: "percent" | "fixed"; discountValue: number }
): number {
  if (discount.discountType === "percent") {
    return Math.floor(subtotal * discount.discountValue / 100);
  }
  return Math.min(subtotal, discount.discountValue);
}
