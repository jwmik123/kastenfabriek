import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCommit = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockInc = vi.hoisted(() => vi.fn().mockReturnValue({ commit: mockCommit }));
const mockPatch = vi.hoisted(() => vi.fn().mockReturnValue({ inc: mockInc }));
const mockWriteFetch = vi.hoisted(() => vi.fn());

vi.mock("@/sanity/lib/client", () => ({
  client: {
    fetch: vi.fn(),
  },
  writeClient: {
    fetch: mockWriteFetch,
    patch: mockPatch,
  },
}));

import { validateCoupon, incrementCouponUseCount } from "../coupon";
import { client } from "@/sanity/lib/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch = client.fetch as unknown as { mockResolvedValueOnce: (v: any) => void; mock: { calls: unknown[][] } };

const futureDate = new Date(Date.now() + 86400_000).toISOString();
const pastDate = new Date(Date.now() - 86400_000).toISOString();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("validateCoupon", () => {
  it("returns valid result with discount for a valid coupon", async () => {
    mockFetch.mockResolvedValueOnce({
      code: "SAVE10",
      discountType: "percent",
      discountValue: 10,
      expiresAt: futureDate,
      maxUses: 100,
      currentUses: 5,
    });

    const result = await validateCoupon("SAVE10");

    expect(result).toEqual({
      valid: true,
      discount: { code: "SAVE10", discountType: "percent", discountValue: 10 },
    });
  });

  it("returns not_found for unknown code", async () => {
    mockFetch.mockResolvedValueOnce(null);

    const result = await validateCoupon("UNKNOWN");

    expect(result).toEqual({ valid: false, error: "not_found" });
  });

  it("returns expired when expiresAt is in the past", async () => {
    mockFetch.mockResolvedValueOnce({
      code: "OLD10",
      discountType: "fixed",
      discountValue: 20,
      expiresAt: pastDate,
      maxUses: 100,
      currentUses: 0,
    });

    const result = await validateCoupon("OLD10");

    expect(result).toEqual({ valid: false, error: "expired" });
  });

  it("returns limit_reached when currentUses >= maxUses", async () => {
    mockFetch.mockResolvedValueOnce({
      code: "FULL",
      discountType: "percent",
      discountValue: 15,
      expiresAt: futureDate,
      maxUses: 10,
      currentUses: 10,
    });

    const result = await validateCoupon("FULL");

    expect(result).toEqual({ valid: false, error: "limit_reached" });
  });

  it("normalizes input to uppercase and trims before querying", async () => {
    mockFetch.mockResolvedValueOnce(null);

    await validateCoupon("  save10  ");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ code: "SAVE10" })
    );
  });
});

describe("incrementCouponUseCount", () => {
  it("patches currentUses by 1 when coupon document found", async () => {
    mockWriteFetch.mockResolvedValueOnce({ _id: "coupon-doc-123" });

    await incrementCouponUseCount("SAVE10");

    expect(mockPatch).toHaveBeenCalledWith("coupon-doc-123");
    expect(mockInc).toHaveBeenCalledWith({ currentUses: 1 });
    expect(mockCommit).toHaveBeenCalled();
  });

  it("does nothing when coupon not found in Sanity", async () => {
    mockWriteFetch.mockResolvedValueOnce(null);

    await expect(incrementCouponUseCount("UNKNOWN")).resolves.toBeUndefined();
    expect(mockPatch).not.toHaveBeenCalled();
  });
});
