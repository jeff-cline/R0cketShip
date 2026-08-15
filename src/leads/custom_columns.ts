/**
 * Helper for god-defined custom canonical lead columns.
 *
 * The hard-coded `KNOWN_COLUMNS` set in `normalize.ts` handles the original
 * audience-export schema. Anything beyond that is registered in the
 * `lead_custom_columns` table and unioned in here so the import preview's
 * mapping check accepts those keys (and downstream consumers can still hit
 * them via `leads.extra->>'key'`).
 */
import { asc } from "drizzle-orm";
import { db } from "../db/client";
import { leadCustomColumns } from "../db/schema";
import { KNOWN_COLUMNS } from "./normalize";

export interface CustomColumn {
  id: string;
  key: string;
  label: string;
  description: string | null;
  kind: "string" | "number" | "date" | "boolean";
  createdAt: Date;
}

let _cache: { rows: CustomColumn[]; expiresAt: number } | null = null;
const TTL_MS = 30_000;

export async function listCustomColumns(): Promise<CustomColumn[]> {
  if (_cache && _cache.expiresAt > Date.now()) return _cache.rows;
  const rows = await db.select().from(leadCustomColumns).orderBy(asc(leadCustomColumns.key));
  const mapped: CustomColumn[] = rows.map((r) => ({
    id: r.id,
    key: r.key,
    label: r.label,
    description: r.description,
    kind: (r.kind ?? "string") as CustomColumn["kind"],
    createdAt: r.createdAt,
  }));
  _cache = { rows: mapped, expiresAt: Date.now() + TTL_MS };
  return mapped;
}

/** Force-clear the cache — called from the admin actions when keys change. */
export function invalidateCustomColumnCache(): void {
  _cache = null;
}

/** Combined set of canonical column keys = hard-coded KNOWN + god-registered. */
export async function recognizedColumnKeys(): Promise<Set<string>> {
  const custom = await listCustomColumns();
  const out = new Set<string>(KNOWN_COLUMNS);
  for (const c of custom) out.add(c.key);
  return out;
}
