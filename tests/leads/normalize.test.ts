import { describe, it, expect } from "vitest";
import { normalizeRow } from "@/src/leads/normalize";

const base = { sha256_lc_hem: "abc123" };

describe("normalizeRow", () => {
  it("splits multi-value phones and dedupes", () => {
    const r = normalizeRow({ ...base, personal_phone: "+1800, +1800, +1900", mobile_phone: "+1777" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.lead.personalPhones).toEqual(["+1800", "+1900"]);
      expect(r.lead.mobilePhones).toEqual(["+1777"]);
    }
  });

  it("unions + lowercases emails", () => {
    const r = normalizeRow({ ...base, personal_emails: "A@X.com, b@x.com", additional_personal_emails: "B@X.com, c@x.com" });
    expect(r.ok && r.lead.emails).toEqual(["a@x.com", "b@x.com", "c@x.com"]);
  });

  it("derives segment commercial when company_name present, residential otherwise", () => {
    expect((normalizeRow({ ...base, company_name: "Acme" }) as any).lead.segment).toBe("commercial");
    expect((normalizeRow({ ...base }) as any).lead.segment).toBe("residential");
  });

  it("parses last_updated as a UTC date", () => {
    const r = normalizeRow({ ...base, last_updated: "2026-04-29 00:00:00" });
    expect(r.ok && r.lead.lastUpdated?.toISOString()).toBe("2026-04-29T00:00:00.000Z");
  });

  it("captures unmapped columns into extra", () => {
    const r = normalizeRow({ ...base, green: "yes", solar_panel: "tesla" });
    expect(r.ok && r.lead.extra).toEqual({ green: "yes", solar_panel: "tesla" });
  });

  it("derives a key when sha256_lc_hem is missing but the row has data", () => {
    const r = normalizeRow({ first_name: "x", business_email: "X@Y.com" });
    expect(r.ok).toBe(true);
    expect(r.ok && r.lead.shaLcHem).toBe("alt:email:x@y.com");
  });

  it("errors only on a completely empty row", () => {
    expect(normalizeRow({ first_name: "", personal_zip: "" })).toEqual({ ok: false, error: "empty row" });
  });

  it("maps core fields and nulls empties", () => {
    const r = normalizeRow({ ...base, first_name: "Susan", personal_zip: "32301", personal_city: "  ", score_category: "low" });
    expect(r.ok && r.lead.firstName).toBe("Susan");
    expect(r.ok && r.lead.zip).toBe("32301");
    expect(r.ok && r.lead.city).toBeNull();
    expect(r.ok && r.lead.scoreCategory).toBe("low");
  });
});
