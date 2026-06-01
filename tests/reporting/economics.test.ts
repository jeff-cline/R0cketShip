import { describe, it, expect } from "vitest";
import { computeEconomics } from "@/src/reporting/economics";

describe("computeEconomics", () => {
  it("splits 60/40 by default fee rate", () => {
    const e = computeEconomics(1000, 0.6, 0);
    expect(e.platformRevenue).toBe(600);
    expect(e.whitelabelNet).toBe(400);
  });

  it("gross profit = platform revenue minus data cost", () => {
    const e = computeEconomics(1000, 0.6, 0.35);
    expect(e.platformRevenue).toBe(600);
    expect(e.dataCost).toBe(350);
    expect(e.grossProfit).toBe(250);
    expect(e.grossMargin).toBeCloseTo(250 / 600, 5);
  });

  it("gross profit equals platform revenue when data cost rate is 0", () => {
    const e = computeEconomics(2000, 0.6, 0);
    expect(e.grossProfit).toBe(1200);
    expect(e.grossMargin).toBe(1);
  });

  it("treats negative or non-finite sales as zero", () => {
    expect(computeEconomics(-50, 0.6, 0).sales).toBe(0);
    expect(computeEconomics(NaN, 0.6, 0).platformRevenue).toBe(0);
  });

  it("clamps fee and data-cost rates into [0,1]", () => {
    const e = computeEconomics(1000, 1.5, -0.2);
    expect(e.feeRate).toBe(1);
    expect(e.dataCostRate).toBe(0);
    expect(e.platformRevenue).toBe(1000);
    expect(e.whitelabelNet).toBe(0);
  });

  it("reports zero gross margin when there is no revenue", () => {
    const e = computeEconomics(0, 0.6, 0.35);
    expect(e.grossMargin).toBe(0);
  });
});
