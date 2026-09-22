import { describe, it, expect, vi, beforeEach } from "vitest";

const mockValues = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockFindFirst = vi.hoisted(() => vi.fn());
const mockGetMax = vi.hoisted(() => vi.fn());
const mockSendEmails = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock("@/db", () => ({
  db: {
    query: { sampleRequest: { findFirst: mockFindFirst } },
    insert: vi.fn(() => ({ values: mockValues })),
  },
}));

vi.mock("@/db/schema", () => ({ sampleRequest: {} }));

vi.mock("@/sanity/lib/materials", async () => {
  const { DEFAULT_MATERIALS } = await import("@/lib/materials");
  return { getMaterials: vi.fn(async () => DEFAULT_MATERIALS) };
});

vi.mock("@/sanity/lib/products", () => ({
  getMaxSampleSelections: mockGetMax,
}));

vi.mock("@/lib/email/resend", () => ({
  sendSampleRequestEmails: mockSendEmails,
}));

import { createSampleRequest, type SampleRequestInput } from "../sample-request";

const input = (overrides: Partial<SampleRequestInput> = {}): SampleRequestInput => ({
  materialIds: ["zwart"],
  name: "Sam de Vries",
  email: "sam@example.com",
  street: "Kerkstraat",
  houseNumber: "1",
  postalCode: "1234 AB",
  city: "Utrecht",
  ...overrides,
});

describe("createSampleRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetMax.mockResolvedValue(3);
    // An earlier, still pending request on the same address.
    mockFindFirst.mockResolvedValue({ id: "earlier", status: "pending" });
  });

  it("accepts a second request from the same e-mail address", async () => {
    expect(await createSampleRequest(input())).toEqual({ ok: true });
    expect(await createSampleRequest(input())).toEqual({ ok: true });
    expect(mockValues).toHaveBeenCalledTimes(2);
  });

  it("allows as many samples as the samples product in Sanity", async () => {
    mockGetMax.mockResolvedValue(5);
    const materialIds = ["zwart", "premium-wit", "zandbeige", "mistblauw", "h1199-thermo-eik"];

    expect(await createSampleRequest(input({ materialIds }))).toEqual({ ok: true });
  });

  it("rejects more samples than the Sanity maximum", async () => {
    mockGetMax.mockResolvedValue(2);

    const result = await createSampleRequest(
      input({ materialIds: ["zwart", "premium-wit", "zandbeige"] }),
    );

    expect(result).toEqual({ ok: false, error: "Kies 1 tot 2 materialen." });
    expect(mockValues).not.toHaveBeenCalled();
  });

  it("rejects materials that are not offered", async () => {
    const result = await createSampleRequest(input({ materialIds: ["bestaat-niet"] }));

    expect(result).toEqual({ ok: false, error: "Ongeldig materiaal geselecteerd." });
  });
});
