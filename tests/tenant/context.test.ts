import { describe, it, expect } from "vitest";
import { pickHost } from "@/src/tenant/context";

describe("pickHost", () => {
  it("uses the host header when present", () => {
    expect(pickHost("roofers.co", undefined)).toBe("roofers.co");
  });

  it("falls back to DEFAULT_TENANT_DOMAIN for localhost", () => {
    expect(pickHost("localhost:3000", "roofers.co")).toBe("roofers.co");
  });

  it("falls back to DEFAULT_TENANT_DOMAIN when host is missing", () => {
    expect(pickHost(null, "roofers.co")).toBe("roofers.co");
  });

  it("returns null when neither host nor default is usable", () => {
    expect(pickHost("localhost", undefined)).toBeNull();
  });
});
