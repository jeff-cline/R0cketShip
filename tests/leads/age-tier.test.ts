import { describe, it, expect } from "vitest";
import { ageTier } from "@/src/leads/age-tier";

const now = new Date("2026-05-31T12:00:00Z");
const ago = (ms: number) => new Date(now.getTime() - ms);
const H = 3600000, D = 86400000;

describe("ageTier", () => {
  it("classifies by recency", () => {
    expect(ageTier(ago(2 * H), now)).toBe("real_time");
    expect(ageTier(ago(23 * H), now)).toBe("real_time");
    expect(ageTier(ago(2 * D), now)).toBe("one_week");
    expect(ageTier(ago(7 * D), now)).toBe("one_week");
    expect(ageTier(ago(20 * D), now)).toBe("thirty_day");
    expect(ageTier(ago(30 * D), now)).toBe("thirty_day");
    expect(ageTier(ago(60 * D), now)).toBe("older");
  });

  it("treats a future date as real_time", () => {
    expect(ageTier(new Date(now.getTime() + D), now)).toBe("real_time");
  });
});
