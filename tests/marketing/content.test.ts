import { describe, it, expect } from "vitest";
import { marketingContent } from "@/src/marketing/content";

const tenant: any = { moneyWord: "roofing leads", niche: "roofing", offers: [{ id: 1, title: "Data", description: "d", price: "$1,500/mo" }], footerHtml: "<p>f</p>", style: "bold" };

describe("marketingContent", () => {
  it("parameterizes copy by niche and passes offers through", () => {
    const c = marketingContent(tenant);
    expect(c.subhead).toContain("roofing");
    expect(c.features.length).toBeGreaterThanOrEqual(6);
    expect(c.offers[0].price).toBe("$1,500/mo");
    expect(c.steps.length).toBe(4);
  });
});
