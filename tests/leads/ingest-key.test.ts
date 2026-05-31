import { describe, it, expect } from "vitest";
import { generateIngestKey, ingestKeyMatches } from "@/src/leads/ingest-key";

describe("ingest key", () => {
  it("generates distinct url-safe keys", () => {
    const a = generateIngestKey(), b = generateIngestKey();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("matches only the exact key", () => {
    const k = generateIngestKey();
    expect(ingestKeyMatches(k, k)).toBe(true);
    expect(ingestKeyMatches("wrong", k)).toBe(false);
    expect(ingestKeyMatches(null, k)).toBe(false);
    expect(ingestKeyMatches(k, null)).toBe(false);
  });
});
