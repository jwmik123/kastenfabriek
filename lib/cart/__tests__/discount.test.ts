import { describe, it, expect } from "vitest";
import { calculateDiscount } from "../discount";

describe("calculateDiscount", () => {
  it("applies percent discount: floor(subtotal * rate / 100)", () => {
    const result = calculateDiscount(1000, { discountType: "percent", discountValue: 10 });
    expect(result).toBe(100);
  });

  it("floors percent discount (no fractional euros)", () => {
    // 10% of 105 = 10.5 → floor to 10
    const result = calculateDiscount(105, { discountType: "percent", discountValue: 10 });
    expect(result).toBe(10);
  });

  it("applies fixed discount", () => {
    const result = calculateDiscount(1000, { discountType: "fixed", discountValue: 50 });
    expect(result).toBe(50);
  });

  it("fixed discount cannot exceed subtotal (floors at 0)", () => {
    const result = calculateDiscount(30, { discountType: "fixed", discountValue: 50 });
    expect(result).toBe(30);
  });

  it("100% percent discount returns subtotal", () => {
    const result = calculateDiscount(500, { discountType: "percent", discountValue: 100 });
    expect(result).toBe(500);
  });
});
