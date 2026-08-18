import type { PriceSnapshot, ProductPriceSnapshot } from "@/lib/cart/types";

/**
 * A line in an order, reduced to what the money maths needs.
 * `CartItem`, the email items and the order-page items all satisfy this.
 */
export type SummaryLine =
  | { kind: "closet"; quantity: number; priceSnapshot: PriceSnapshot }
  | { kind: "product"; quantity: number; priceSnapshot: ProductPriceSnapshot };

export interface OrderSummary {
  /** Σ of the per-line subtotals ("stuff" only, no delivery, no montage). */
  lineSubtotal: number;
  /** Charged once for the whole shipment, matching what Stripe billed. */
  delivery: number;
  /** What montage actually costs after any free-montage promo. */
  installation: number;
  /**
   * Montage before the promo, so a renderer can show the list price and the
   * discount as two rows that still add up to `installation`.
   */
  installationGross: number;
  installationTierName: string | null;
  freeMontageDiscount: number;
  discountCode: string | null;
  discount: number;
  total: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Order totals in euros, mirroring `calcCartTotals` (which drives the Stripe
 * line items) so what the customer is shown reconciles with what was charged.
 *
 * Delivery is deduplicated across lines — one shipment, one delivery fee — and
 * any coupon is applied once, at order level. Both used to be rendered per
 * closet line, which double-counted them on multi-cabinet orders.
 */
export function buildOrderSummary(
  lines: SummaryLine[],
  coupon?: { code: string | null; amountCents: number | null },
): OrderSummary {
  let lineSubtotal = 0;
  let installation = 0;
  let freeMontageDiscount = 0;
  let delivery = 0;
  let installationTierName: string | null = null;

  for (const line of lines) {
    const qty = line.quantity;
    if (line.kind === "closet") {
      const ps = line.priceSnapshot;
      lineSubtotal += (ps.total - ps.deliveryCost - ps.installationCost) * qty;
      installation += ps.installationCost * qty;
      if (ps.freeMontageApplied) freeMontageDiscount += (ps.freeMontageDiscount ?? 0) * qty;
      if (ps.installationTierName) installationTierName ??= ps.installationTierName;
    } else {
      lineSubtotal += line.priceSnapshot.total * qty;
    }
    const deliveryCost = line.priceSnapshot.deliveryCost;
    if (deliveryCost > delivery) delivery = deliveryCost;
  }

  const discount = coupon?.amountCents ? coupon.amountCents / 100 : 0;
  const total = round2(lineSubtotal + delivery + installation - discount);

  return {
    lineSubtotal: round2(lineSubtotal),
    delivery: round2(delivery),
    installation: round2(installation),
    installationGross: round2(installation + freeMontageDiscount),
    installationTierName,
    freeMontageDiscount: round2(freeMontageDiscount),
    discountCode: coupon?.code ?? null,
    discount: round2(discount),
    total,
  };
}
