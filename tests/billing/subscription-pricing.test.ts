import { describe, it, expect } from "vitest";
import { baseMonthlyPrice, volumeDiscountedPrice } from "@/src/billing/subscription-pricing";

describe("subscription pricing", () => {
  it("base price by offer", () => {
    expect(baseMonthlyPrice("1500", "data")).toBe(1500);
    expect(baseMonthlyPrice("1500", "booking")).toBe(4500);
    expect(baseMonthlyPrice("1500", "epartner")).toBe(0);
  });
  it("volume discount ladder", () => {
    expect(volumeDiscountedPrice(1500, 0)).toBe(1500);
    expect(volumeDiscountedPrice(1500, 1)).toBe(1350);
    expect(volumeDiscountedPrice(1500, 2)).toBe(1200);
    expect(volumeDiscountedPrice(1500, 3)).toBe(1050);
    expect(volumeDiscountedPrice(1500, 4)).toBe(1050);
  });
});
