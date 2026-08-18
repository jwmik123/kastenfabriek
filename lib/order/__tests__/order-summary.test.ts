import { describe, it, expect } from "vitest";
import { buildOrderSummary, type SummaryLine } from "../order-summary";
import { calcCartTotals } from "@/lib/cart/totals";
import type { CartItem, PriceSnapshot, ProductPriceSnapshot } from "@/lib/cart/types";

const closetPrice = (o: Partial<PriceSnapshot> = {}): PriceSnapshot => ({
  calculatedAt: "2026-01-01T00:00:00Z",
  currency: "EUR",
  moduleCost: 1000,
  doorCost: 0,
  mechanismCost: 0,
  ledCost: 0,
  deliveryCost: 95,
  subtotal: 1095,
  installationTierName: "Klein project",
  installationCost: 300,
  total: 1395,
  ...o,
});

const productPrice: ProductPriceSnapshot = {
  calculatedAt: "2026-01-01T00:00:00Z",
  currency: "EUR",
  unitPrice: 80,
  materialSurcharge: 0,
  deliveryCost: 95,
  total: 80,
};

const closet = (o: Partial<PriceSnapshot> = {}, quantity = 1): SummaryLine => ({
  kind: "closet",
  quantity,
  priceSnapshot: closetPrice(o),
});

const product = (quantity = 1): SummaryLine => ({
  kind: "product",
  quantity,
  priceSnapshot: productPrice,
});

describe("buildOrderSummary", () => {
  it("charges delivery once no matter how many lines", () => {
    const summary = buildOrderSummary([closet(), closet(), product(3)]);
    expect(summary.delivery).toBe(95);
    // 2 × €1000 of cabinet + 3 × €80 of product
    expect(summary.lineSubtotal).toBe(2240);
    expect(summary.installation).toBe(600);
    expect(summary.total).toBe(2240 + 95 + 600);
  });

  it("applies the coupon once, at order level", () => {
    const summary = buildOrderSummary([closet(), closet()], {
      code: "SAVE25",
      amountCents: 2500,
    });
    expect(summary.discount).toBe(25);
    expect(summary.discountCode).toBe("SAVE25");
    expect(summary.total).toBe(2000 + 95 + 600 - 25);
  });

  it("reports montage gross and the promo separately so the rows add up", () => {
    const summary = buildOrderSummary([
      closet({ installationCost: 0, freeMontageApplied: true, freeMontageDiscount: 720 }),
    ]);
    expect(summary.installationGross).toBe(720);
    expect(summary.freeMontageDiscount).toBe(720);
    expect(summary.installationGross - summary.freeMontageDiscount).toBe(summary.installation);
  });

  it("multiplies by quantity", () => {
    const summary = buildOrderSummary([closet({}, 2)]);
    expect(summary.lineSubtotal).toBe(2000);
    expect(summary.installation).toBe(600);
  });

  it("is empty for an empty order", () => {
    const summary = buildOrderSummary([]);
    expect(summary).toMatchObject({ lineSubtotal: 0, delivery: 0, installation: 0, total: 0 });
  });

  it("matches what calcCartTotals bills through Stripe", () => {
    const items: CartItem[] = [
      {
        id: "a",
        addedAt: "2026-01-01T00:00:00Z",
        kind: "closet",
        quantity: 1,
        // Configuration is irrelevant to the money maths.
        configuration: {} as CartItem["configuration"],
        priceSnapshot: closetPrice(),
      } as CartItem,
      {
        id: "b",
        addedAt: "2026-01-01T00:00:00Z",
        kind: "product",
        quantity: 2,
        configuration: {} as CartItem["configuration"],
        priceSnapshot: productPrice,
      } as CartItem,
    ];
    const cart = calcCartTotals(items);
    const summary = buildOrderSummary(items);

    expect(summary.lineSubtotal).toBe(cart.lineSubtotal);
    expect(summary.delivery).toBe(cart.delivery);
    expect(summary.installation).toBe(cart.install);
    expect(summary.total).toBe(cart.grandTotal);
  });
});
