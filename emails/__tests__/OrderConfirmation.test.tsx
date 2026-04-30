import { describe, it, expect } from "vitest";
import { render } from "@react-email/components";
import React from "react";
import OrderConfirmation from "../OrderConfirmation";
import type { OrderConfirmationProps } from "../OrderConfirmation";

const basePrice = {
  calculatedAt: "2026-01-01T00:00:00Z",
  currency: "EUR" as const,
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

const baseConfig = {
  id: "test-id",
  capturedAt: "2026-01-01T00:00:00Z",
  widthCm: 200,
  heightCm: 220,
  depthCm: 60,
  moduleCount: 2,
  modules: [],
  buitenkantMaterialId: "white",
  binnenkantMaterialId: "white",
  doorHandleId: "none",
  diagonalSide: "none" as const,
  leftDiagStartHeight: 0,
  rightDiagStartHeight: 0,
  leftDiagTopWidth: 0,
  rightDiagTopWidth: 0,
  placementType: "vrijstaand" as const,
  lightStripsEnabled: false,
  hasTopCabinet: false,
  topCabinetHeightCm: 0,
};

const baseProps: OrderConfirmationProps = {
  orderNumber: "KF-001",
  orderDate: new Date("2026-01-01"),
  customerEmail: "test@example.com",
  shippingAddress: {
    firstName: "Jan",
    lastName: "Jansen",
    street: "Teststraat",
    houseNumber: "1",
    postalCode: "1234AB",
    city: "Amsterdam",
    country: "NL",
  },
  items: [
    {
      configuration: baseConfig,
      priceSnapshot: basePrice,
    },
  ],
  totalAmountCents: 109500,
};

describe("OrderConfirmation", () => {
  it("shows Geschatte aankomst cell anchored to orderDate", async () => {
    // orderDate 2026-01-01 → +56d = 2026-02-26, +84d = 2026-03-26 (same year, no year suffix)
    const html = await render(<OrderConfirmation {...baseProps} />);
    expect(html).toContain("Geschatte aankomst");
    expect(html).toContain("26. feb");
    expect(html).toContain("26. mrt");
  });

  it("shows year in delivery window when it crosses into a different calendar year", async () => {
    // orderDate 2026-11-15 → +56d = 2027-01-10, +84d = 2027-02-07
    const props: OrderConfirmationProps = {
      ...baseProps,
      orderDate: new Date("2026-11-15"),
    };
    const html = await render(<OrderConfirmation {...props} />);
    expect(html).toContain("2027");
  });

  it("renders discount row when discountAmount > 0", async () => {
    const props: OrderConfirmationProps = {
      ...baseProps,
      items: [
        {
          ...baseProps.items[0],
          priceSnapshot: {
            ...basePrice,
            discountCode: "SAVE25",
            discountAmount: 2500, // €25.00 in cents
          },
        },
      ],
    };
    const html = await render(<OrderConfirmation {...props} />);
    expect(html).toContain("Korting (SAVE25)");
    expect(html).toContain("-");
  });

  it("omits discount row when no discountAmount", async () => {
    const html = await render(<OrderConfirmation {...baseProps} />);
    expect(html).not.toContain("Korting");
  });

  it("shows Gratis montage row when freeMontageApplied and freeMontageDiscount > 0", async () => {
    const props: OrderConfirmationProps = {
      ...baseProps,
      items: [
        {
          ...baseProps.items[0],
          priceSnapshot: {
            ...basePrice,
            installationCost: 0,
            freeMontageApplied: true,
            freeMontageDiscount: 720,
          },
        },
      ],
    };
    const html = await render(<OrderConfirmation {...props} />);
    expect(html).toContain("Gratis montage");
    expect(html).toContain("720");
    expect(html).toContain("-");
  });

  it("omits Gratis montage row when freeMontageApplied is false", async () => {
    const html = await render(<OrderConfirmation {...baseProps} />);
    expect(html).not.toContain("Gratis montage");
  });

  it("omits Gratis montage row when freeMontageDiscount is 0", async () => {
    const props: OrderConfirmationProps = {
      ...baseProps,
      items: [
        {
          ...baseProps.items[0],
          priceSnapshot: {
            ...basePrice,
            freeMontageApplied: true,
            freeMontageDiscount: 0,
          },
        },
      ],
    };
    const html = await render(<OrderConfirmation {...props} />);
    expect(html).not.toContain("Gratis montage");
  });

  it("total reflects discounted amount", async () => {
    const props: OrderConfirmationProps = {
      ...baseProps,
      items: [
        {
          ...baseProps.items[0],
          priceSnapshot: {
            ...basePrice,
            discountCode: "SAVE25",
            discountAmount: 2500, // €25.00 off €1095.00 = €1070.00
          },
        },
      ],
    };
    const html = await render(<OrderConfirmation {...props} />);
    expect(html).toContain("1.070,00");
  });
});
