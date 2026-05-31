import { describe, it, expect } from "vitest";
import { tenantFilter } from "@/src/tenant/scope";

describe("tenantFilter", () => {
  it("returns the tenantId for a non-god role", () => {
    expect(tenantFilter({ role: "manager", tenantId: "t1" })).toBe("t1");
    expect(tenantFilter({ role: "customer", tenantId: "t1" })).toBe("t1");
  });

  it("returns null (no filter / cross-tenant) for god", () => {
    expect(tenantFilter({ role: "god", tenantId: "t1" })).toBeNull();
  });
});
