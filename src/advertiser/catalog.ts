/**
 * Phase 2: catalog helpers for the campaign-edit UI.
 *
 * - `listNiches()` returns the distinct niches/moneyWords across all active
 *   tenants so advertisers see a real dropdown (instead of guessing free text).
 * - `US_STATES` is the canonical 2-letter state list for the "by-state" mode
 *   of the targeting picker.
 */
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { tenants } from "../db/schema";

export interface NicheOption {
  /** Canonical lowercase key — what we send back in `targetingFilters.niches`. */
  value: string;
  /** Human-readable label — title-cased money word when distinct from niche. */
  label: string;
}

export async function listNiches(): Promise<NicheOption[]> {
  const rows = await db
    .select({ niche: tenants.niche, moneyWord: tenants.moneyWord })
    .from(tenants)
    .where(and(eq(tenants.status, "active")))
    .orderBy(asc(tenants.moneyWord));
  // Dedup by lowercase niche; keep the prettiest label seen.
  const seen = new Map<string, NicheOption>();
  for (const r of rows) {
    const key = (r.niche ?? "").trim().toLowerCase();
    if (!key) continue;
    if (seen.has(key)) continue;
    const label = titleCase(r.moneyWord ?? r.niche);
    seen.set(key, { value: key, label });
  }
  return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export const US_STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" },     { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },     { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
  { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" },     { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },      { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },    { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },        { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },    { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },       { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },{ code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },   { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },    { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },    { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },{ code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },{ code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },        { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },      { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },{ code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },{ code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },       { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },     { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },   { code: "WY", name: "Wyoming" },
];
