import { parse } from "csv-parse";
import { Readable } from "node:stream";

/** Streams CSV text (with header row) into row objects keyed by column name. */
export async function* parseCsvStream(
  input: string | Readable,
): AsyncGenerator<Record<string, string>> {
  const parser = parse({ columns: true, skip_empty_lines: true, relax_column_count: true });
  if (typeof input === "string") {
    parser.write(input);
    parser.end();
  } else {
    input.pipe(parser);
  }
  for await (const record of parser) {
    yield record as Record<string, string>;
  }
}

/** Parses a JSON array body into string records (null/undefined -> ""). */
export function parseJsonArray(text: string): Record<string, string>[] {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error("expected a JSON array of lead objects");
  return data.map((obj) => {
    const rec: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj ?? {})) rec[k] = v == null ? "" : String(v);
    return rec;
  });
}
