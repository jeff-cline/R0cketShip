import { describe, it, expect } from "vitest";
import { predictiveScore } from "@/src/predictive/scoring";

describe("predictiveScore", () => {
  it("ranks a high-intent cross-site converter (recent) above a cold low-intent old lead", () => {
    const hot = predictiveScore({ scoreCategory: "high", convertedElsewhere: true, ageTier: "real_time", hasCompany: true });
    const cold = predictiveScore({ scoreCategory: "low", convertedElsewhere: false, ageTier: "older", hasCompany: false });
    expect(hot).toBeGreaterThan(cold);
    expect(hot).toBeLessThanOrEqual(100);
    expect(cold).toBe(12); // 10 + 0 + 2 + 0
  });
  it("the cross-site converted signal adds 30", () => {
    const base = { scoreCategory: "medium" as const, ageTier: "one_week" as const, hasCompany: false };
    expect(predictiveScore({ ...base, convertedElsewhere: true }) - predictiveScore({ ...base, convertedElsewhere: false })).toBe(30);
  });
});
