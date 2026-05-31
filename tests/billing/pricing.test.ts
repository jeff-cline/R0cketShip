import { describe, it, expect } from "vitest";
import { leadPrice } from "@/src/billing/pricing";

describe("leadPrice", () => {
  it("prices by age tier in credits", () => {
    expect(leadPrice("real_time")).toBe(11);
    expect(leadPrice("one_week")).toBe(4);
    expect(leadPrice("thirty_day")).toBe(1.44);
    expect(leadPrice("older")).toBe(1.44);
  });
});
