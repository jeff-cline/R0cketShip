import { describe, it, expect } from "vitest";
import { parseCsvStream, parseJsonArray } from "@/src/leads/parse";

async function collect(gen: AsyncIterable<Record<string, string>>) {
  const out: Record<string, string>[] = [];
  for await (const r of gen) out.push(r);
  return out;
}

describe("parseCsvStream", () => {
  it("parses CSV with a header and quoted multi-value cells", async () => {
    const csv = 'sha256_lc_hem,personal_phone\nabc,"+1800, +1900"\ndef,+1777\n';
    const rows = await collect(parseCsvStream(csv));
    expect(rows.length).toBe(2);
    expect(rows[0].sha256_lc_hem).toBe("abc");
    expect(rows[0].personal_phone).toBe("+1800, +1900");
    expect(rows[1].sha256_lc_hem).toBe("def");
  });
});

describe("parseJsonArray", () => {
  it("parses a JSON array of objects to string records", () => {
    const rows = parseJsonArray('[{"sha256_lc_hem":"abc","age_range":null},{"sha256_lc_hem":"def"}]');
    expect(rows.length).toBe(2);
    expect(rows[0].sha256_lc_hem).toBe("abc");
    expect(rows[0].age_range).toBe("");
  });

  it("throws on a non-array body", () => {
    expect(() => parseJsonArray('{"x":1}')).toThrow();
  });
});
