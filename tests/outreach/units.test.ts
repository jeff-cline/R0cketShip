import { describe, it, expect } from "vitest";
import { spreadSchedule } from "@/src/outreach/enqueue";
import { requiredMailboxes } from "@/src/outreach/capacity";
import { leadEmail, validSyntax } from "@/src/outreach/verify";
import { pickSubject, brandFromDomain, renderOutreach } from "@/src/outreach/render";

describe("spreadSchedule", () => {
  it("n=1 returns the start time", () => {
    expect(spreadSchedule(1, 1000, 5000)).toEqual([1000]);
  });
  it("n=0 returns empty", () => {
    expect(spreadSchedule(0, 1000, 5000)).toEqual([]);
  });
  it("spreads evenly: first at start, last at start+window", () => {
    const t = spreadSchedule(5, 0, 4000);
    expect(t[0]).toBe(0);
    expect(t[4]).toBe(4000);
    expect(t[1]).toBe(1000);
  });
});

describe("requiredMailboxes", () => {
  it("zero queue needs zero mailboxes", () => {
    expect(requiredMailboxes(0, 7, 50)).toBe(0);
  });
  it("5000 leads over 5 days at 50/day → 20 mailboxes", () => {
    expect(requiredMailboxes(5000, 5, 50)).toBe(20);
  });
  it("clamps days to at least 1", () => {
    expect(requiredMailboxes(100, 0, 50)).toBe(2);
  });
});

describe("leadEmail / validSyntax", () => {
  it("prefers the first emails[] entry, lowercased", () => {
    expect(leadEmail({ emails: ["Bob@Example.com"], businessEmail: "x@y.com" })).toBe("bob@example.com");
  });
  it("falls back to businessEmail when emails empty", () => {
    expect(leadEmail({ emails: [], businessEmail: "Biz@Co.com" })).toBe("biz@co.com");
  });
  it("returns null when no address", () => {
    expect(leadEmail({ emails: [], businessEmail: null })).toBeNull();
  });
  it("syntax checks", () => {
    expect(validSyntax("a@b.com")).toBe(true);
    expect(validSyntax("no-at")).toBe(false);
    expect(validSyntax("a@b")).toBe(false);
  });
});

describe("render", () => {
  it("brandFromDomain", () => {
    expect(brandFromDomain("roofers.co")).toBe("Roofers");
    expect(brandFromDomain("www.bath.ws")).toBe("Bath");
  });
  it("pickSubject is deterministic by seed", () => {
    const a = pickSubject("tok123", { brand: "Roofers", title: "Free inspection" });
    const b = pickSubject("tok123", { brand: "Roofers", title: "Free inspection" });
    expect(a).toBe(b);
  });
  it("renderOutreach embeds tracked CTA + unsubscribe + token", () => {
    const { html } = renderOutreach({
      offer: { logoUrl: null, title: "T", description: "D", ctaUrl: "https://x.com" },
      brand: "Roofers", baseUrl: "https://roofers.co", clickToken: "TOK", address: "123 St",
    });
    expect(html).toContain("https://roofers.co/c/TOK");
    expect(html).toContain("https://roofers.co/u/TOK");
    expect(html).toContain("Unsubscribe");
  });
});
