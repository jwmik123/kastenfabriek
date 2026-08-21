import { describe, it, expect } from "vitest";
import { render } from "@react-email/components";
import React from "react";
import OrderConfirmation from "../OrderConfirmation";
import OrderAdminNotification from "../OrderAdminNotification";
import { buildOrderSummary } from "@/lib/order/order-summary";
import type {
  AddressSnapshot,
  ClosetOrderLine,
  OrderDocumentProps,
  OrderLine,
  ProductOrderLine,
} from "@/lib/order/types";
import type { ClosetConfigSnapshot, PriceSnapshot } from "@/lib/cart/types";

const basePrice: PriceSnapshot = {
  calculatedAt: "2026-01-01T00:00:00Z",
  currency: "EUR",
  moduleCost: 1000,
  doorCost: 0,
  mechanismCost: 0,
  ledCost: 0,
  deliveryCost: 95,
  subtotal: 1095,
  installationTierName: null,
  installationCost: 0,
  total: 1095,
};

const baseConfig: ClosetConfigSnapshot = {
  id: "test-id",
  capturedAt: "2026-01-01T00:00:00Z",
  productType: "kledingkast",
  widthCm: 200,
  heightCm: 220,
  depthCm: 60,
  moduleCount: 2,
  modules: [],
  buitenkantMaterialId: "white",
  binnenkantMaterialId: "white",
  doorHandleId: "none",
  diagonalSide: "none",
  leftDiagStartHeight: 0,
  rightDiagStartHeight: 0,
  leftDiagTopWidth: 0,
  rightDiagTopWidth: 0,
  placementType: "vrijstaand",
  lightStripsEnabled: false,
  hasTopCabinet: false,
  topCabinetHeightCm: 0,
};

const baseClosetItem: ClosetOrderLine = {
  kind: "closet",
  configuration: baseConfig,
  priceSnapshot: basePrice,
  quantity: 1,
};

const paxItem: ProductOrderLine = {
  kind: "product",
  configuration: {
    id: "p1",
    capturedAt: "2026-01-01T00:00:00Z",
    sanityProductId: "pax-1",
    productType: "pax-doors",
    productSlug: "pax-deuren",
    productName: "PAX Deur",
    widthCm: 50,
    heightCm: 229,
    materialId: "white",
    materialName: "Wit",
  },
  priceSnapshot: {
    calculatedAt: "2026-01-01T00:00:00Z",
    currency: "EUR",
    unitPrice: 80,
    materialSurcharge: 0,
    deliveryCost: 20,
    total: 80,
  },
  quantity: 2,
};

const address: AddressSnapshot = {
  firstName: "Jan",
  lastName: "Jansen",
  street: "Teststraat",
  houseNumber: "1",
  postalCode: "1234AB",
  city: "Amsterdam",
  country: "NL",
};

function props(
  items: OrderLine[] = [baseClosetItem],
  coupon?: { code: string | null; amountCents: number | null },
  overrides: Partial<OrderDocumentProps> = {},
): OrderDocumentProps {
  return {
    orderNumber: "KF-001",
    orderDate: new Date("2026-01-01"),
    customerEmail: "test@example.com",
    shippingAddress: address,
    items,
    summary: buildOrderSummary(items, coupon),
    ...overrides,
  };
}

describe("OrderConfirmation", () => {
  it("shows Geschatte aankomst cell anchored to orderDate", async () => {
    // orderDate 2026-01-01 → +56d = 2026-02-26, +84d = 2026-03-26 (same year, no year suffix)
    const html = await render(<OrderConfirmation {...props()} />);
    expect(html).toContain("Geschatte aankomst");
    expect(html).toContain("26. feb");
    expect(html).toContain("26. mrt");
  });

  it("shows year in delivery window when it crosses into a different calendar year", async () => {
    // orderDate 2026-11-15 → +56d = 2027-01-10, +84d = 2027-02-07
    const html = await render(
      <OrderConfirmation {...props([baseClosetItem], undefined, { orderDate: new Date("2026-11-15") })} />,
    );
    expect(html).toContain("2027");
  });

  it("names the product after the configurator it came from", async () => {
    const html = await render(<OrderConfirmation {...props()} />);
    expect(html).toContain("Kledingkast");
    expect(html).not.toContain("Maatwerkkast");
  });

  it("renders the order-level discount once", async () => {
    const html = await render(
      <OrderConfirmation {...props([baseClosetItem], { code: "SAVE25", amountCents: 2500 })} />,
    );
    expect(html.match(/Korting \(SAVE25\)/g)).toHaveLength(1);
    // €1000 stuff + €95 delivery − €25 = €1070
    expect(html).toContain("1.070,00");
  });

  it("counts delivery once for a two-cabinet order", async () => {
    const html = await render(<OrderConfirmation {...props([baseClosetItem, baseClosetItem])} />);
    expect(html.match(/Bezorging/g)).toHaveLength(1);
    // 2 × €1000 stuff + one €95 delivery
    expect(html).toContain("2.095,00");
  });

  it("omits discount row when there is no coupon", async () => {
    const html = await render(<OrderConfirmation {...props()} />);
    expect(html).not.toContain("Korting");
  });

  it("shows Gratis montage as a discount off the list montage price", async () => {
    const item: ClosetOrderLine = {
      ...baseClosetItem,
      priceSnapshot: {
        ...basePrice,
        installationTierName: "Groot project",
        installationCost: 0,
        freeMontageApplied: true,
        freeMontageDiscount: 720,
      },
    };
    const html = await render(<OrderConfirmation {...props([item])} />);
    expect(html).toContain("Montage (Groot project)");
    expect(html).toContain("Gratis montage");
    expect(html).toContain("720");
  });

  it("omits Gratis montage row when freeMontageApplied is false", async () => {
    const html = await render(<OrderConfirmation {...props()} />);
    expect(html).not.toContain("Gratis montage");
  });

  it("omits Gratis montage row when freeMontageDiscount is 0", async () => {
    const item: ClosetOrderLine = {
      ...baseClosetItem,
      priceSnapshot: { ...basePrice, freeMontageApplied: true, freeMontageDiscount: 0 },
    };
    const html = await render(<OrderConfirmation {...props([item])} />);
    expect(html).not.toContain("Gratis montage");
  });

  it("renders PAX product line with size, material, qty", async () => {
    const html = await render(<OrderConfirmation {...props([paxItem])} />);
    expect(html).toContain("PAX Deur");
    expect(html).toContain("50");
    expect(html).toContain("229");
    expect(html).toContain("Wit");
    expect(html).toContain("Aantal");
  });

  it("renders both line types in a mixed cart", async () => {
    const html = await render(<OrderConfirmation {...props([baseClosetItem, paxItem])} />);
    expect(html).toContain("Kledingkast");
    expect(html).toContain("PAX Deur");
  });
});

describe("OrderConfirmation — wasmachinekast", () => {
  const wasm: ClosetConfigSnapshot = {
    ...baseConfig,
    productType: "wasmachinekast",
    widthCm: 150,
    heightCm: 240,
    moduleCount: 1,
    layout: "low-left",
    // Doors carry a handle, the lage-kast drawer fronts are push-to-open.
    doorHandleId: "greep-recht-160",
    doorHandleName: "Rechte greep 160 mm",
    drawerHandleId: "none",
    drawerHandleName: "Greeploos (push-to-open)",
    washerModules: [{ slotIndex: 0, layoutId: 11, section: "low" }],
    modules: [
      {
        slotIndex: 0,
        layoutId: 1,
        layoutName: "Hoge planken",
        hasDoor: true,
        span: 1,
        hasPowerHole: false,
      },
    ],
    lowSection: {
      width: 120,
      height: 90,
      moduleCount: 2,
      topPanelThicknessMm: 36,
      countertopMaterialId: "h1199-thermo-eik",
      modules: [
        {
          slotIndex: 0,
          layoutId: 11,
          layoutName: "Wasmachine",
          hasDoor: true,
          span: 1,
          fixedWidth: 65,
          pushToOpen: true,
          hasPowerHole: false,
        },
        {
          slotIndex: 1,
          layoutId: 20,
          layoutName: "Lades onder",
          hasDoor: true,
          span: 1,
          hasPowerHole: true,
        },
      ],
    },
  };

  const item: ClosetOrderLine = {
    kind: "closet",
    configuration: wasm,
    priceSnapshot: basePrice,
    quantity: 1,
  };

  it("lists the low section's modules, which used to be dropped entirely", async () => {
    const html = await render(<OrderConfirmation {...props([item])} />);
    expect(html).toContain("Lage kast");
    expect(html).toContain("Wasmachine");
    expect(html).toContain("Lades onder");
    expect(html).toContain("Hoge planken");
  });

  it("adds up both sections in the title and the dimensions", async () => {
    const html = await render(<OrderConfirmation {...props([item])} />);
    expect(html).toContain("Wasmachinekast");
    // 150 (high) + 120 (low) wide, tallest section 240 high
    expect(html).toContain("270 × 240 × 60 cm");
  });

  it("shows the countertop and the separate drawer handle", async () => {
    const html = await render(<OrderConfirmation {...props([item])} />);
    expect(html).toContain("Werkblad");
    expect(html).toContain("Thermo Eik Zwartbruin");
    expect(html).toContain("36 mm");
    expect(html).toContain("Lades: Greeploos (push-to-open)");
  });

  it("counts a low-section socket in the extras", async () => {
    const html = await render(<OrderConfirmation {...props([item])} />);
    expect(html).toContain("Kabeldoorvoer (1×)");
  });
});

describe("OrderAdminNotification", () => {
  it("announces a new order and includes the customer's email", async () => {
    const html = await render(<OrderAdminNotification {...props()} />);
    expect(html).toContain("Nieuwe bestelling");
    expect(html).toContain("test@example.com");
  });

  it("carries the same specification as the customer mail", async () => {
    const p = props([baseClosetItem, paxItem]);
    const admin = await render(<OrderAdminNotification {...p} />);
    expect(admin).toContain("Kledingkast");
    expect(admin).toContain("PAX Deur");
    expect(admin).toContain("Totaal betaald");
  });
});

describe("LED strips on a wasmachinekast", () => {
  const wasm: ClosetConfigSnapshot = {
    ...baseConfig,
    productType: "wasmachinekast",
    layout: "high-only",
    lightStripsEnabled: true,
  };

  const item: ClosetOrderLine = {
    kind: "closet",
    configuration: wasm,
    priceSnapshot: { ...basePrice, ledCost: 120, subtotal: 1215, total: 1215 },
    quantity: 1,
  };

  it("reaches the confirmation mail as both an extra and a price row", async () => {
    const html = await render(<OrderConfirmation {...props([item])} />);
    expect(html).toContain("LED-strips");
    expect(html).toContain("120,00");
  });

  it("reaches the admin mail too", async () => {
    const html = await render(<OrderAdminNotification {...props([item])} />);
    expect(html).toContain("LED-strips");
  });
});
