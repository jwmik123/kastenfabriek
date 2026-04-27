import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSessionsCreate = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ id: "sess_1", url: "https://stripe.com/pay/sess_1" })
);
const mockGetCurrentUser = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ id: "user_1", email: "test@example.com" })
);
const mockFindMany = vi.hoisted(() => vi.fn());
const mockFindFirst = vi.hoisted(() => vi.fn());
const mockDbInsert = vi.hoisted(() => vi.fn());
const mockDbUpdate = vi.hoisted(() => vi.fn());

vi.mock("stripe", () => ({
  default: vi.fn().mockImplementation(function () {
    return { checkout: { sessions: { create: mockSessionsCreate } } };
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
    powerCableHolesEnabled: false,
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
  it("includes negative Stripe line item labeled 'Korting (CODE)' when coupon applied", async () => {
    await createCheckoutSession("addr_1", { couponCode: "SAVE10", discountAmount: 1000 });

    const { line_items } = mockSessionsCreate.mock.calls[0][0];
    const discountLine = line_items.find(
      (item: { price_data: { product_data: { name: string } } }) =>
        item.price_data.product_data.name === "Korting (SAVE10)"
    );

    expect(discountLine).toBeDefined();
    expect(discountLine.price_data.unit_amount).toBe(-1000);
    expect(discountLine.price_data.currency).toBe("eur");
    expect(discountLine.quantity).toBe(1);
  });

  it("writes couponCode and discountAmount to order record", async () => {
    await createCheckoutSession("addr_1", { couponCode: "SAVE10", discountAmount: 1000 });

    const orderData = mockInsertValues.mock.calls[0][0];
    expect(orderData).toMatchObject({ couponCode: "SAVE10", discountAmount: 1000 });
  });

  it("does not include discount line item when no coupon", async () => {
    await createCheckoutSession("addr_1");

    const { line_items } = mockSessionsCreate.mock.calls[0][0];
    const discountLine = line_items.find(
      (item: { price_data: { product_data: { name: string } } }) =>
        item.price_data.product_data.name?.startsWith("Korting")
    );

    expect(discountLine).toBeUndefined();
  });

  it("writes null coupon fields to order when no coupon", async () => {
    await createCheckoutSession("addr_1");

    const orderData = mockInsertValues.mock.calls[0][0];
    expect(orderData).toMatchObject({ couponCode: null, discountAmount: null });
  });

  it("caps negative line item at totalCents when discount exceeds order total", async () => {
    const oversizedDiscount = TOTAL_CENTS + 5000;

    await createCheckoutSession("addr_1", { couponCode: "BIG10", discountAmount: oversizedDiscount });

    const { line_items } = mockSessionsCreate.mock.calls[0][0];
    const discountLine = line_items.find(
      (item: { price_data: { product_data: { name: string } } }) =>
        item.price_data.product_data.name === "Korting (BIG10)"
    );

    expect(discountLine.price_data.unit_amount).toBe(-TOTAL_CENTS);
  });
});
