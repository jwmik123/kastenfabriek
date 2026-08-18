import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSessionsCreate = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ id: "sess_1", url: "https://stripe.com/pay/sess_1" })
);
const mockCouponsCreate = vi.hoisted(() => vi.fn().mockResolvedValue({ id: "coupon_1" }));
const mockGetCurrentUser = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ id: "user_1", email: "test@example.com" })
);
const mockFindMany = vi.hoisted(() => vi.fn());
const mockFindFirst = vi.hoisted(() => vi.fn());
const mockDbInsert = vi.hoisted(() => vi.fn());
const mockDbUpdate = vi.hoisted(() => vi.fn());

vi.mock("stripe", () => ({
  default: vi.fn().mockImplementation(function () {
    return {
      checkout: { sessions: { create: mockSessionsCreate } },
      coupons: { create: mockCouponsCreate },
    };
  }),
}));

vi.mock("@/lib/actions/auth", () => ({
  getCurrentUser: mockGetCurrentUser,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    query: {
      cartItem: { findMany: mockFindMany },
      address: { findFirst: mockFindFirst },
    },
    insert: mockDbInsert,
    update: mockDbUpdate,
  },
}));

vi.mock("@/db/schema", () => ({
  order: {},
  orderItem: {},
  cartItem: {},
  address: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn().mockReturnValue({}),
}));

import { createCheckoutSession } from "../checkout";

const TOTAL_EUROS = 1695;
const TOTAL_CENTS = 169500;

const mockAddress = {
  id: "addr_1",
  userId: "user_1",
  firstName: "Jan",
  lastName: "Jansen",
  company: null,
  street: "Teststraat",
  houseNumber: "1",
  houseNumberAddition: null,
  postalCode: "1234AB",
  city: "Amsterdam",
  country: "NL",
  phone: null,
  isDefault: true,
  type: "shipping",
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCartRow = {
  id: "cart_1",
  addedAt: new Date("2024-01-01"),
  userId: "user_1",
  kind: "closet",
  quantity: 1,
  screenshotClosedUrl: null,
  screenshotOpenUrl: null,
  configuration: {
    id: "c1",
    capturedAt: "2024-01-01T00:00:00.000Z",
    widthCm: 200,
    heightCm: 220,
    depthCm: 60,
    moduleCount: 4,
    modules: [],
    buitenkantMaterialId: "white",
    binnenkantMaterialId: "white",
    doorHandleId: "gold",
    diagonalSide: "none",
    leftDiagStartHeight: 0,
    rightDiagStartHeight: 0,
    leftDiagTopWidth: 0,
    rightDiagTopWidth: 0,
    lightStripsEnabled: false,
    hasTopCabinet: false,
    topCabinetHeightCm: 0,
  },
  priceSnapshot: {
    calculatedAt: "2024-01-01T00:00:00.000Z",
    currency: "EUR",
    moduleCost: 1000,
    doorCost: 500,
    mechanismCost: 100,
    ledCost: 0,
    deliveryCost: 95,
    subtotal: 1695,
    installationTierName: null,
    installationCost: 0,
    total: TOTAL_EUROS,
  },
};

let mockInsertValues: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockFindMany.mockResolvedValue([mockCartRow]);
  mockFindFirst.mockResolvedValue(mockAddress);
  mockInsertValues = vi.fn().mockResolvedValue([]);
  mockDbInsert.mockReturnValue({ values: mockInsertValues });
  mockDbUpdate.mockReturnValue({
    set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
  });
});

describe("createCheckoutSession", () => {
  it("attaches a Stripe coupon for the discount", async () => {
    await createCheckoutSession("addr_1", { couponCode: "SAVE10", discountAmount: 1000 });

    expect(mockCouponsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount_off: 1000, currency: "eur", name: "Korting (SAVE10)" })
    );
    expect(mockSessionsCreate.mock.calls[0][0].discounts).toEqual([{ coupon: "coupon_1" }]);
  });

  it("writes couponCode and discountAmount to order record", async () => {
    await createCheckoutSession("addr_1", { couponCode: "SAVE10", discountAmount: 1000 });

    const orderData = mockInsertValues.mock.calls[0][0];
    expect(orderData).toMatchObject({ couponCode: "SAVE10", discountAmount: 1000 });
  });

  it("attaches no discount when there is no coupon", async () => {
    await createCheckoutSession("addr_1");

    expect(mockCouponsCreate).not.toHaveBeenCalled();
    expect(mockSessionsCreate.mock.calls[0][0].discounts).toBeUndefined();
  });

  it("writes null coupon fields to order when no coupon", async () => {
    await createCheckoutSession("addr_1");

    const orderData = mockInsertValues.mock.calls[0][0];
    expect(orderData).toMatchObject({ couponCode: null, discountAmount: null });
  });

  it("caps the discount at the order total", async () => {
    const oversizedDiscount = TOTAL_CENTS + 5000;

    await createCheckoutSession("addr_1", { couponCode: "BIG10", discountAmount: oversizedDiscount });

    expect(mockCouponsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount_off: TOTAL_CENTS })
    );
    expect(mockInsertValues.mock.calls[0][0]).toMatchObject({ discountAmount: TOTAL_CENTS });
  });

  it("names the order line after the configurator the item came from", async () => {
    await createCheckoutSession("addr_1");

    const itemRow = mockInsertValues.mock.calls[1][0];
    expect(itemRow).toMatchObject({
      kind: "closet",
      productName: "Kledingkast",
      sanityProductId: "custom-kledingkast",
    });
    expect(mockSessionsCreate.mock.calls[0][0].line_items[0].price_data.product_data.name).toBe(
      "Kledingkast — 200 × 220 × 60 cm"
    );
  });

  it("names a wasmachinekast line correctly", async () => {
    mockFindMany.mockResolvedValue([
      {
        ...mockCartRow,
        configuration: {
          ...mockCartRow.configuration,
          productType: "wasmachinekast",
          widthCm: 150,
          layout: "low-left",
          lowSection: {
            width: 120,
            height: 90,
            moduleCount: 2,
            modules: [],
            topPanelThicknessMm: 18,
            countertopMaterialId: "white",
          },
        },
      },
    ]);

    await createCheckoutSession("addr_1");

    expect(mockInsertValues.mock.calls[1][0]).toMatchObject({
      productName: "Wasmachinekast",
      sanityProductId: "custom-wasmachinekast",
    });
  });

  it("does not stamp the order-level coupon onto the line snapshot", async () => {
    await createCheckoutSession("addr_1", { couponCode: "SAVE10", discountAmount: 1000 });

    const snapshot = mockInsertValues.mock.calls[1][0].configurationSnapshot;
    expect(snapshot.priceSnapshot.discountCode).toBeUndefined();
    expect(snapshot.priceSnapshot.discountAmount).toBeUndefined();
  });
});
