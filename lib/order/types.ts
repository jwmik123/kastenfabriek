import type {
  ClosetConfigSnapshot,
  PriceSnapshot,
  ProductConfigSnapshot,
  ProductPriceSnapshot,
} from "@/lib/cart/types";
import type { OrderSummary } from "./order-summary";

/** Shipping/billing address as snapshotted onto the order row. */
export interface AddressSnapshot {
  firstName: string;
  lastName: string;
  company?: string | null;
  street: string;
  houseNumber: string;
  houseNumberAddition?: string | null;
  postalCode: string;
  city: string;
  country: string;
  phone?: string | null;
}

export interface ClosetOrderLine {
  kind: "closet";
  configuration: ClosetConfigSnapshot;
  priceSnapshot: PriceSnapshot;
  quantity: number;
  screenshotClosedUrl?: string;
  screenshotOpenUrl?: string;
}

export interface ProductOrderLine {
  kind: "product";
  configuration: ProductConfigSnapshot;
  priceSnapshot: ProductPriceSnapshot;
  quantity: number;
}

export type OrderLine = ClosetOrderLine | ProductOrderLine;

/**
 * Everything the confirmation email, the admin email and the spec PDF render.
 * Assembled once in the Stripe webhook so all three describe the same order.
 */
export interface OrderDocumentProps {
  orderNumber: string;
  orderDate: Date;
  customerEmail: string;
  shippingAddress: AddressSnapshot;
  items: OrderLine[];
  summary: OrderSummary;
}

export function formatAddressLines(a: AddressSnapshot): string[] {
  return [
    [`${a.firstName} ${a.lastName}`, a.company].filter(Boolean).join(" · "),
    `${a.street} ${a.houseNumber}${a.houseNumberAddition ?? ""}`,
    `${a.postalCode} ${a.city}`,
    a.country,
    a.phone ?? "",
  ].filter((l) => l.trim().length > 0);
}

export const PRODUCT_DOOR_TYPE_LABELS: Record<string, string> = {
  deuren: "Deuren",
  hoekdeuren: "Hoekdeuren",
  afwerkpaneel: "Zijpaneel",
};

export const PRODUCT_SIDE_LABELS: Record<string, string> = {
  left: "linkerdeur",
  right: "rechterdeur",
  pair: "set links + rechts",
};

/**
 * The size as a customer picked it. A zijpaneel has no width — it is a height
 * plus a depth the customer typed in — so it never reads "0 cm × 236 cm".
 */
export function formatProductSize(c: ProductConfigSnapshot): string {
  const verlengd = c.isVerlengd ? " (verlengd)" : "";
  if ((c.doorType ?? "deuren") === "afwerkpaneel") {
    const depth = c.depthCm != null ? `${c.depthCm} cm diep · ` : "";
    return `${depth}${c.heightCm} cm hoog${verlengd}`;
  }
  return `${c.widthLabel ?? `${c.widthCm} cm`} × ${c.heightCm} cm${verlengd}`;
}

/** The spec lines for a non-configurator product (PAX doors and friends). */
export function describeProductLine(c: ProductConfigSnapshot): string[] {
  const isAfwerk = (c.doorType ?? "deuren") === "afwerkpaneel";
  return [
    `Type: ${PRODUCT_DOOR_TYPE_LABELS[c.doorType ?? "deuren"]}`,
    isAfwerk
      ? `Maat: ${c.heightCm} cm hoog${c.isVerlengd ? " (verlengd)" : ""}`
      : `Maat: ${c.widthLabel ?? `${c.widthCm} cm`} × ${c.heightCm} cm${c.isVerlengd ? " (verlengd)" : ""}`,
    c.depthCm != null ? `Diepte: ${c.depthCm} cm` : null,
    c.doorSide ? `Uitvoering: ${PRODUCT_SIDE_LABELS[c.doorSide]}` : null,
    `Materiaal: ${c.materialName}`,
  ].filter((l): l is string => l !== null);
}
