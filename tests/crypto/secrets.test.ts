import { describe, it, expect } from "vitest";
import { encryptSecret, decryptSecret, maskSecret } from "@/src/crypto/secrets";

describe("secrets", () => {
  it("round-trips encrypt -> decrypt", () => {
    const enc = encryptSecret("sk_live_abc123")!;
    expect(enc.startsWith("v1:")).toBe(true);
    expect(decryptSecret(enc)).toBe("sk_live_abc123");
  });
  it("uses a random IV (ciphertext differs each call)", () => {
    expect(encryptSecret("same")).not.toBe(encryptSecret("same"));
  });
  it("null/empty pass through as null", () => {
    expect(encryptSecret(null)).toBeNull();
    expect(encryptSecret("")).toBeNull();
    expect(decryptSecret(null)).toBeNull();
  });
  it("tampered ciphertext throws", () => {
    const enc = encryptSecret("secret")!;
    const parts = enc.split(":");
    parts[3] = Buffer.from("tampered").toString("base64");
    expect(() => decryptSecret(parts.join(":"))).toThrow();
  });
  it("maskSecret shows only last 4", () => {
    expect(maskSecret("sk_live_abcd1234")).toBe("••••1234");
    expect(maskSecret(null)).toBe("");
  });
});
