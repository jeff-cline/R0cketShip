import { describe, it, expect } from "vitest";
import { manualProvider, getProvider } from "@/src/billing/provider";

describe("payment provider", () => {
  it("manual provider returns kind=manual with no redirect", async () => {
    expect(await manualProvider.startTopup({ id: "p1", amountUsd: 20 })).toEqual({ kind: "manual" });
  });

  it("getProvider falls back to manual for stripe/paypal until wired", () => {
    expect(getProvider("manual")).toBe(manualProvider);
    expect(getProvider("stripe")).toBe(manualProvider);
    expect(getProvider("paypal")).toBe(manualProvider);
  });
});
