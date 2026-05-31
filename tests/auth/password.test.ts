import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/src/auth/password";

describe("password hashing", () => {
  it("verifies a correct password", async () => {
    const enc = await hashPassword("TEMP!234");
    expect(enc.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("TEMP!234", enc)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const enc = await hashPassword("TEMP!234");
    expect(await verifyPassword("wrong", enc)).toBe(false);
  });

  it("uses a unique salt per hash", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).not.toBe(b);
  });

  it("returns false for a malformed encoded value", async () => {
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
  });
});
