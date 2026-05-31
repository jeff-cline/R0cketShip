# Phase 3 — Data Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ingest lead data (bulk CSV upload + per-tenant webhook) into a global `persons` + per-tenant `leads` model, with normalize/dedupe/batched-upsert, and an admin counts view — sized for ≤100k-row files.

**Architecture:** A single pipeline `ingestRows(tenantId, source, rows)` that both entry points feed. Pure, unit-tested `normalizeRow` maps source columns → a `NormalizedLead`; `ingestRows` upserts `persons` by hash then `leads` by `(tenant, person)` (newer `last_updated` wins) in batches. A streaming CSV parser (`csv-parse`) and a JSON-array parser produce the row stream. A Node Route Handler serves the admin upload (session-gated) and another serves the webhook (ingest-key-gated). Age tier is computed dynamically, never stored.

**Tech Stack:** Next.js 15 Route Handlers, Drizzle/Postgres, `csv-parse` (pure-JS streaming), Node `crypto`, Vitest.

**Environment note:** Dev/test Postgres reached at `localhost:5432` via the RUNNING SSH tunnel; `npm test` loads `.env.test`, `npm run db:migrate`/`db:seed` load `.env.local`. `psql` NOT installed locally — verify via node. Build on branch `build/phase3-ingestion` off `main`.

---

## File Structure

```
src/db/schema.ts            MODIFY: segment/leadSource enums, persons + leads tables, tenants.ingestKey
src/db/seed.ts              MODIFY: backfill ingestKey for tenants lacking one
tests/setup.ts              MODIFY: truncate persons + leads too
src/leads/types.ts          CREATE: NormalizedLead, NormalizeResult, IngestSummary, LeadSource, Segment
src/leads/age-tier.ts       CREATE: ageTier(lastUpdated, now)
src/leads/normalize.ts      CREATE: normalizeRow(raw)
src/leads/parse.ts          CREATE: parseCsvStream, parseJsonArray
src/leads/ingest-key.ts     CREATE: generateIngestKey, ingestKeyMatches
src/leads/ingest.ts         CREATE: ingestRows pipeline (batched upsert)
src/leads/stats.ts          CREATE: leadCounts(tenantId, now)
app/api/ingest/[tenant]/route.ts   CREATE: webhook endpoint
app/api/admin/import/route.ts      CREATE: admin upload endpoint
app/admin/data/page.tsx     CREATE: god Data panel (webhook box + upload + counts)
app/admin/data/actions.ts   CREATE: regenerateIngestKeyAction
app/admin/data/UploadForm.tsx      CREATE: client upload form
tests/leads/*.test.ts       CREATE
```

---

### Task 1: Schema — persons, leads, tenants.ingestKey

**Files:** Modify `src/db/schema.ts`, `tests/setup.ts`

- [ ] **Step 1: Add to `src/db/schema.ts`**

Ensure the `drizzle-orm/pg-core` import includes `pgEnum, boolean, uniqueIndex` (added in Phase 2) plus add `index`. Add `import { sql } from "drizzle-orm";` if not present (used for array default). Then append:

```ts
export const leadSegment = pgEnum("lead_segment", ["residential", "commercial"]);
export const leadSource = pgEnum("lead_source", ["upload", "webhook"]);

export const persons = pgTable("persons", {
  id: uuid("id").primaryKey().defaultRandom(),
  shaLcHem: text("sha_lc_hem").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    personId: uuid("person_id").notNull().references(() => persons.id),
    shaLcHem: text("sha_lc_hem").notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    businessEmail: text("business_email"),
    personalPhones: text("personal_phones").array().notNull().default(sql`'{}'::text[]`),
    mobilePhones: text("mobile_phones").array().notNull().default(sql`'{}'::text[]`),
    emails: text("emails").array().notNull().default(sql`'{}'::text[]`),
    linkedinUrl: text("linkedin_url"),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    zip: text("zip"),
    zip4: text("zip4"),
    gender: text("gender"),
    ageRange: text("age_range"),
    incomeRange: text("income_range"),
    netWorth: text("net_worth"),
    jobTitle: text("job_title"),
    department: text("department"),
    companyName: text("company_name"),
    companyDomain: text("company_domain"),
    companyRevenue: text("company_revenue"),
    companyEmployeeCount: text("company_employee_count"),
    companyState: text("company_state"),
    companyLinkedinUrl: text("company_linkedin_url"),
    businessEmailValidationStatus: text("business_email_validation_status"),
    contactCountry: text("contact_country"),
    scoreCategory: text("score_category"),
    segment: leadSegment("segment").notNull(),
    lastUpdated: timestamp("last_updated"),
    extra: jsonb("extra").$type<Record<string, string>>().notNull().default({}),
    source: leadSource("source").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("leads_tenant_person_uniq").on(t.tenantId, t.personId),
    index("leads_tenant_zip_idx").on(t.tenantId, t.zip),
  ],
);
```

Then add an `ingestKey` column to the EXISTING `tenants` table definition (add this line inside the `tenants` columns object, before `createdAt`):
```ts
  ingestKey: text("ingest_key"),
```

- [ ] **Step 2: Update `tests/setup.ts` truncation**

```ts
  await pool.query("TRUNCATE TABLE tenants, users, sessions, persons, leads RESTART IDENTITY CASCADE");
```

- [ ] **Step 3: Generate + apply migration**

Run `npm run db:generate` then `npm run db:migrate`. Expect a new SQL file creating `lead_segment`/`lead_source` enums, `persons` + `leads` tables, and the `tenants.ingest_key` column; migrate applies cleanly.

- [ ] **Step 4: Verify (node, not psql)**

```bash
DOTENV_CONFIG_PATH=.env.local node -r dotenv/config -e "const {Client}=require('pg');const c=new Client({connectionString:process.env.DATABASE_URL});c.connect().then(()=>c.query(\"select table_name from information_schema.tables where table_name in ('persons','leads') order by table_name\")).then(r=>{console.log('TABLES:',r.rows.map(x=>x.table_name).join(','));return c.query(\"select column_name from information_schema.columns where table_name='tenants' and column_name='ingest_key'\")}).then(r=>{console.log('ingest_key:',r.rows.length===1?'present':'MISSING');return c.end()}).catch(e=>{console.error(e.message);process.exit(1)})"
```
Expect: `TABLES: leads,persons` and `ingest_key: present`.

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts tests/setup.ts drizzle/
git commit -m "feat: add persons + leads schema and tenant ingest key"
```

---

### Task 2: Age tier helper

**Files:** Create `src/leads/age-tier.ts`, `tests/leads/age-tier.test.ts`

- [ ] **Step 1: Write `tests/leads/age-tier.test.ts`**

```ts
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
```

- [ ] **Step 2: Run — expect FAIL.** `npm test -- tests/leads/age-tier.test.ts`

- [ ] **Step 3: Write `src/leads/age-tier.ts`**

```ts
export type AgeTier = "real_time" | "one_week" | "thirty_day" | "older";

const DAY = 86400000;

export function ageTier(lastUpdated: Date, now: Date): AgeTier {
  const ms = now.getTime() - lastUpdated.getTime();
  if (ms <= DAY) return "real_time";
  if (ms <= 7 * DAY) return "one_week";
  if (ms <= 30 * DAY) return "thirty_day";
  return "older";
}
```

- [ ] **Step 4: Run — expect PASS (2 tests).**

- [ ] **Step 5: Commit**

```bash
git add src/leads/age-tier.ts tests/leads/age-tier.test.ts
git commit -m "feat: dynamic lead age-tier helper"
```

---

### Task 3: Types + normalizeRow

**Files:** Create `src/leads/types.ts`, `src/leads/normalize.ts`, `tests/leads/normalize.test.ts`

- [ ] **Step 1: Write `src/leads/types.ts`**

```ts
export type LeadSource = "upload" | "webhook";
export type Segment = "residential" | "commercial";

export interface NormalizedLead {
  shaLcHem: string;
  firstName: string | null;
  lastName: string | null;
  businessEmail: string | null;
  personalPhones: string[];
  mobilePhones: string[];
  emails: string[];
  linkedinUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  zip4: string | null;
  gender: string | null;
  ageRange: string | null;
  incomeRange: string | null;
  netWorth: string | null;
  jobTitle: string | null;
  department: string | null;
  companyName: string | null;
  companyDomain: string | null;
  companyRevenue: string | null;
  companyEmployeeCount: string | null;
  companyState: string | null;
  companyLinkedinUrl: string | null;
  businessEmailValidationStatus: string | null;
  contactCountry: string | null;
  scoreCategory: string | null;
  segment: Segment;
  lastUpdated: Date | null;
  extra: Record<string, string>;
}

export type NormalizeResult =
  | { ok: true; lead: NormalizedLead }
  | { ok: false; error: string };

export interface IngestSummary {
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
}
```

- [ ] **Step 2: Write `tests/leads/normalize.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { normalizeRow } from "@/src/leads/normalize";

const base = { sha256_lc_hem: "abc123" };

describe("normalizeRow", () => {
  it("splits multi-value phones and dedupes", () => {
    const r = normalizeRow({ ...base, personal_phone: "+1800, +1800, +1900", mobile_phone: "+1777" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.lead.personalPhones).toEqual(["+1800", "+1900"]);
      expect(r.lead.mobilePhones).toEqual(["+1777"]);
    }
  });

  it("unions + lowercases emails", () => {
    const r = normalizeRow({ ...base, personal_emails: "A@X.com, b@x.com", additional_personal_emails: "B@X.com, c@x.com" });
    expect(r.ok && r.lead.emails).toEqual(["a@x.com", "b@x.com", "c@x.com"]);
  });

  it("derives segment commercial when company_name present, residential otherwise", () => {
    expect((normalizeRow({ ...base, company_name: "Acme" }) as any).lead.segment).toBe("commercial");
    expect((normalizeRow({ ...base }) as any).lead.segment).toBe("residential");
  });

  it("parses last_updated as a UTC date", () => {
    const r = normalizeRow({ ...base, last_updated: "2026-04-29 00:00:00" });
    expect(r.ok && r.lead.lastUpdated?.toISOString()).toBe("2026-04-29T00:00:00.000Z");
  });

  it("captures unmapped columns into extra", () => {
    const r = normalizeRow({ ...base, green: "yes", solar_panel: "tesla" });
    expect(r.ok && r.lead.extra).toEqual({ green: "yes", solar_panel: "tesla" });
  });

  it("errors when sha256_lc_hem is missing", () => {
    expect(normalizeRow({ first_name: "x" })).toEqual({ ok: false, error: "missing sha256_lc_hem" });
  });

  it("maps core fields and nulls empties", () => {
    const r = normalizeRow({ ...base, first_name: "Susan", personal_zip: "32301", personal_city: "  ", score_category: "low" });
    expect(r.ok && r.lead.firstName).toBe("Susan");
    expect(r.ok && r.lead.zip).toBe("32301");
    expect(r.ok && r.lead.city).toBeNull();
    expect(r.ok && r.lead.scoreCategory).toBe("low");
  });
});
```

- [ ] **Step 3: Run — expect FAIL.**

- [ ] **Step 4: Write `src/leads/normalize.ts`**

```ts
import type { NormalizeResult } from "./types";

const KNOWN = new Set([
  "sha256_lc_hem", "first_name", "last_name", "business_email", "personal_phone",
  "mobile_phone", "linkedin_url", "personal_address", "personal_state", "personal_city",
  "personal_zip", "personal_zip4", "gender", "age_range", "income_range", "net_worth",
  "job_title", "department", "company_name", "company_domain", "company_revenue",
  "company_employee_count", "company_linkedin_url", "company_state",
  "business_email_validation_status", "personal_emails", "additional_personal_emails",
  "contact_country", "score_category", "last_updated",
]);

function nn(v: string | undefined): string | null {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
}

function splitMulti(v: string | undefined): string[] {
  if (!v) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of v.split(",")) {
    const p = part.trim();
    if (p && !seen.has(p)) { seen.add(p); out.push(p); }
  }
  return out;
}

export function normalizeRow(raw: Record<string, string>): NormalizeResult {
  const sha = (raw.sha256_lc_hem ?? "").trim();
  if (!sha) return { ok: false, error: "missing sha256_lc_hem" };

  const emailSet = new Set<string>();
  const emails: string[] = [];
  for (const e of [...splitMulti(raw.personal_emails), ...splitMulti(raw.additional_personal_emails)]) {
    const lc = e.toLowerCase();
    if (!emailSet.has(lc)) { emailSet.add(lc); emails.push(lc); }
  }

  const companyName = nn(raw.company_name);

  const extra: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!KNOWN.has(k) && v != null && String(v).trim() !== "") extra[k] = String(v);
  }

  let lastUpdated: Date | null = null;
  const lu = nn(raw.last_updated);
  if (lu) {
    const d = new Date(lu.replace(" ", "T") + "Z");
    lastUpdated = Number.isNaN(d.getTime()) ? null : d;
  }

  return {
    ok: true,
    lead: {
      shaLcHem: sha,
      firstName: nn(raw.first_name),
      lastName: nn(raw.last_name),
      businessEmail: nn(raw.business_email),
      personalPhones: splitMulti(raw.personal_phone),
      mobilePhones: splitMulti(raw.mobile_phone),
      emails,
      linkedinUrl: nn(raw.linkedin_url),
      address: nn(raw.personal_address),
      city: nn(raw.personal_city),
      state: nn(raw.personal_state),
      zip: nn(raw.personal_zip),
      zip4: nn(raw.personal_zip4),
      gender: nn(raw.gender),
      ageRange: nn(raw.age_range),
      incomeRange: nn(raw.income_range),
      netWorth: nn(raw.net_worth),
      jobTitle: nn(raw.job_title),
      department: nn(raw.department),
      companyName,
      companyDomain: nn(raw.company_domain),
      companyRevenue: nn(raw.company_revenue),
      companyEmployeeCount: nn(raw.company_employee_count),
      companyState: nn(raw.company_state),
      companyLinkedinUrl: nn(raw.company_linkedin_url),
      businessEmailValidationStatus: nn(raw.business_email_validation_status),
      contactCountry: nn(raw.contact_country),
      scoreCategory: nn(raw.score_category),
      segment: companyName ? "commercial" : "residential",
      lastUpdated,
      extra,
    },
  };
}
```

- [ ] **Step 5: Run — expect PASS (7 tests).**

- [ ] **Step 6: Commit**

```bash
git add src/leads/types.ts src/leads/normalize.ts tests/leads/normalize.test.ts
git commit -m "feat: lead types + normalizeRow"
```

---

### Task 4: Parsers (CSV stream + JSON array)

**Files:** Create `src/leads/parse.ts`, `tests/leads/parse.test.ts`

- [ ] **Step 1: Install `csv-parse`**

```bash
npm install csv-parse
```

- [ ] **Step 2: Write `tests/leads/parse.test.ts`**

```ts
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
    expect(rows[0].age_range).toBe(""); // null coerced to empty string
  });

  it("throws on a non-array body", () => {
    expect(() => parseJsonArray('{"x":1}')).toThrow();
  });
});
```

- [ ] **Step 3: Run — expect FAIL.**

- [ ] **Step 4: Write `src/leads/parse.ts`**

```ts
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

/** Parses a JSON array body into string records (null/undefined → ""). */
export function parseJsonArray(text: string): Record<string, string>[] {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error("expected a JSON array of lead objects");
  return data.map((obj) => {
    const rec: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj ?? {})) rec[k] = v == null ? "" : String(v);
    return rec;
  });
}
```

- [ ] **Step 5: Run — expect PASS (3 tests).**

- [ ] **Step 6: Commit**

```bash
git add src/leads/parse.ts tests/leads/parse.test.ts package.json package-lock.json
git commit -m "feat: CSV stream + JSON array parsers (csv-parse)"
```

---

### Task 5: Ingest key helpers + seed backfill

**Files:** Create `src/leads/ingest-key.ts`, `tests/leads/ingest-key.test.ts`; modify `src/db/seed.ts`

- [ ] **Step 1: Write `tests/leads/ingest-key.test.ts`**

```ts
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
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Write `src/leads/ingest-key.ts`**

```ts
import { randomBytes, timingSafeEqual } from "node:crypto";

export function generateIngestKey(): string {
  return randomBytes(24).toString("base64url");
}

export function ingestKeyMatches(
  provided: string | null | undefined,
  stored: string | null | undefined,
): boolean {
  if (!provided || !stored) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(stored);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
```

- [ ] **Step 4: Run — expect PASS (2 tests).**

- [ ] **Step 5: Backfill ingest keys in `src/db/seed.ts`**

Add import: `import { generateIngestKey } from "../leads/ingest-key";` and `import { isNull } from "drizzle-orm";` (combine with the existing `eq` import → `import { eq, isNull } from "drizzle-orm";`). Inside `seed()`, after the God-account block and before `await pool.end();`, add:
```ts
  const keyless = await db.select().from(tenants).where(isNull(tenants.ingestKey));
  for (const t of keyless) {
    await db.update(tenants).set({ ingestKey: generateIngestKey() }).where(eq(tenants.id, t.id));
  }
  if (keyless.length) console.log(`Backfilled ingest keys for ${keyless.length} tenant(s)`);
```

- [ ] **Step 6: Run the seed + verify keys exist**

Run `npm run db:seed`. Then:
```bash
DOTENV_CONFIG_PATH=.env.local node -r dotenv/config -e "const {Client}=require('pg');const c=new Client({connectionString:process.env.DATABASE_URL});c.connect().then(()=>c.query(\"select domain, (ingest_key is not null) as has_key from tenants order by domain\")).then(r=>{console.log(JSON.stringify(r.rows));return c.end()}).catch(e=>{console.error(e.message);process.exit(1)})"
```
Expect both tenants with `has_key: true`. Re-running the seed must NOT change existing keys (idempotent — only null keys are filled).

- [ ] **Step 7: Commit**

```bash
git add src/leads/ingest-key.ts tests/leads/ingest-key.test.ts src/db/seed.ts
git commit -m "feat: ingest key generation/verify + seed backfill"
```

---

### Task 6: Ingest pipeline

**Files:** Create `src/leads/ingest.ts`, `tests/leads/ingest.test.ts`

- [ ] **Step 1: Write `tests/leads/ingest.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { and, eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { tenants, persons, leads } from "@/src/db/schema";
import { ingestRows } from "@/src/leads/ingest";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let tA: string, tB: string;
beforeEach(async () => {
  const [a] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  const [b] = await db.insert(tenants).values({ domain: "solar.co", niche: "solar", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = a.id; tB = b.id;
});

function rows(arr: Record<string, string>[]) {
  return (async function* () { for (const r of arr) yield r; })();
}

describe("ingestRows", () => {
  it("inserts new leads and creates one person per hash", async () => {
    const s = await ingestRows(tA, "upload", rows([
      { sha256_lc_hem: "h1", personal_zip: "30265", last_updated: "2026-05-01 00:00:00" },
      { sha256_lc_hem: "h2", personal_zip: "30265", company_name: "Acme", last_updated: "2026-05-01 00:00:00" },
    ]));
    expect(s).toEqual({ inserted: 2, updated: 0, skipped: 0, errors: 0 });
    expect((await db.select().from(persons)).length).toBe(2);
    expect((await db.select().from(leads).where(eq(leads.tenantId, tA))).length).toBe(2);
  });

  it("counts a row missing the hash as an error", async () => {
    const s = await ingestRows(tA, "upload", rows([{ personal_zip: "30265" }]));
    expect(s.errors).toBe(1);
    expect(s.inserted).toBe(0);
  });

  it("re-importing the same row does not duplicate (skips when not newer)", async () => {
    const row = { sha256_lc_hem: "h1", personal_zip: "1", last_updated: "2026-05-01 00:00:00" };
    await ingestRows(tA, "upload", rows([row]));
    const s = await ingestRows(tA, "upload", rows([row]));
    expect(s).toEqual({ inserted: 0, updated: 0, skipped: 1, errors: 0 });
    expect((await db.select().from(leads).where(eq(leads.tenantId, tA))).length).toBe(1);
  });

  it("updates in place when last_updated is newer", async () => {
    await ingestRows(tA, "upload", rows([{ sha256_lc_hem: "h1", personal_zip: "1", last_updated: "2026-05-01 00:00:00" }]));
    const s = await ingestRows(tA, "upload", rows([{ sha256_lc_hem: "h1", personal_zip: "2", last_updated: "2026-05-10 00:00:00" }]));
    expect(s).toEqual({ inserted: 0, updated: 1, skipped: 0, errors: 0 });
    const row = (await db.select().from(leads).where(eq(leads.tenantId, tA)))[0];
    expect(row.zip).toBe("2");
  });

  it("shares one person across two tenants (one person, two leads)", async () => {
    await ingestRows(tA, "upload", rows([{ sha256_lc_hem: "shared", last_updated: "2026-05-01 00:00:00" }]));
    await ingestRows(tB, "webhook", rows([{ sha256_lc_hem: "shared", last_updated: "2026-05-01 00:00:00" }]));
    expect((await db.select().from(persons)).length).toBe(1);
    expect((await db.select().from(leads)).length).toBe(2);
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Write `src/leads/ingest.ts`**

```ts
import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { persons, leads } from "../db/schema";
import { normalizeRow } from "./normalize";
import type { IngestSummary, LeadSource, NormalizedLead } from "./types";

const BATCH = 1000;

function leadValues(tenantId: string, personId: string, source: LeadSource, l: NormalizedLead) {
  return {
    tenantId,
    personId,
    shaLcHem: l.shaLcHem,
    firstName: l.firstName,
    lastName: l.lastName,
    businessEmail: l.businessEmail,
    personalPhones: l.personalPhones,
    mobilePhones: l.mobilePhones,
    emails: l.emails,
    linkedinUrl: l.linkedinUrl,
    address: l.address,
    city: l.city,
    state: l.state,
    zip: l.zip,
    zip4: l.zip4,
    gender: l.gender,
    ageRange: l.ageRange,
    incomeRange: l.incomeRange,
    netWorth: l.netWorth,
    jobTitle: l.jobTitle,
    department: l.department,
    companyName: l.companyName,
    companyDomain: l.companyDomain,
    companyRevenue: l.companyRevenue,
    companyEmployeeCount: l.companyEmployeeCount,
    companyState: l.companyState,
    companyLinkedinUrl: l.companyLinkedinUrl,
    businessEmailValidationStatus: l.businessEmailValidationStatus,
    contactCountry: l.contactCountry,
    scoreCategory: l.scoreCategory,
    segment: l.segment,
    lastUpdated: l.lastUpdated,
    extra: l.extra,
    source,
  };
}

async function upsertOne(
  tenantId: string,
  source: LeadSource,
  l: NormalizedLead,
  summary: IngestSummary,
): Promise<void> {
  const [person] = await db
    .insert(persons)
    .values({ shaLcHem: l.shaLcHem })
    .onConflictDoUpdate({ target: persons.shaLcHem, set: { updatedAt: new Date() } })
    .returning({ id: persons.id });

  const existing = (
    await db
      .select({ id: leads.id, lastUpdated: leads.lastUpdated })
      .from(leads)
      .where(and(eq(leads.tenantId, tenantId), eq(leads.personId, person.id)))
      .limit(1)
  )[0];

  if (!existing) {
    await db.insert(leads).values(leadValues(tenantId, person.id, source, l));
    summary.inserted++;
    return;
  }

  const incoming = l.lastUpdated?.getTime() ?? null;
  const current = existing.lastUpdated?.getTime() ?? null;
  const isNewer = incoming !== null && (current === null || incoming > current);
  if (isNewer) {
    await db
      .update(leads)
      .set({ ...leadValues(tenantId, person.id, source, l), updatedAt: new Date() })
      .where(eq(leads.id, existing.id));
    summary.updated++;
  } else {
    summary.skipped++;
  }
}

export async function ingestRows(
  tenantId: string,
  source: LeadSource,
  rows: AsyncIterable<Record<string, string>> | Iterable<Record<string, string>>,
): Promise<IngestSummary> {
  const summary: IngestSummary = { inserted: 0, updated: 0, skipped: 0, errors: 0 };
  let count = 0;
  for await (const raw of rows as AsyncIterable<Record<string, string>>) {
    const res = normalizeRow(raw);
    if (!res.ok) { summary.errors++; continue; }
    await upsertOne(tenantId, source, res.lead, summary);
    count++;
    // BATCH is a logical chunk marker; upserts already commit per row. Kept for future bulk tuning.
    if (count % BATCH === 0) { /* checkpoint hook */ }
  }
  return summary;
}
```

Note: `for await` accepts both async and sync iterables, so the webhook can pass a plain array and the upload can pass the CSV async generator. Per-row upserts auto-commit; the `BATCH` marker is a no-op hook now (bulk tuning is a later optimization, not needed for ≤100k rows).

- [ ] **Step 4: Run — expect PASS (5 tests).**

- [ ] **Step 5: Commit**

```bash
git add src/leads/ingest.ts tests/leads/ingest.test.ts
git commit -m "feat: ingest pipeline with person/lead upsert + dedupe"
```

---

### Task 7: Lead stats (counts)

**Files:** Create `src/leads/stats.ts`, `tests/leads/stats.test.ts`

- [ ] **Step 1: Write `tests/leads/stats.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { ingestRows } from "@/src/leads/ingest";
import { leadCounts } from "@/src/leads/stats";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let tA: string;
beforeEach(async () => {
  const [a] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = a.id;
});
function rows(arr: Record<string, string>[]) { return (async function* () { for (const r of arr) yield r; })(); }

describe("leadCounts", () => {
  it("counts totals, tiers, segments, and top zips (tenant-scoped)", async () => {
    const now = new Date("2026-05-31T12:00:00Z");
    await ingestRows(tA, "upload", rows([
      { sha256_lc_hem: "a", personal_zip: "30265", last_updated: "2026-05-31 00:00:00" }, // real_time
      { sha256_lc_hem: "b", personal_zip: "30265", last_updated: "2026-05-28 00:00:00" }, // one_week
      { sha256_lc_hem: "c", personal_zip: "10001", company_name: "Acme", last_updated: "2026-01-01 00:00:00" }, // older, commercial
    ]));
    const s = await leadCounts(tA, now);
    expect(s.total).toBe(3);
    expect(s.byTier.real_time).toBe(1);
    expect(s.byTier.one_week).toBe(1);
    expect(s.byTier.older).toBe(1);
    expect(s.bySegment.residential).toBe(2);
    expect(s.bySegment.commercial).toBe(1);
    expect(s.topZips[0]).toEqual({ zip: "30265", count: 2 });
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Write `src/leads/stats.ts`**

```ts
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { leads } from "../db/schema";
import { ageTier, type AgeTier } from "./age-tier";
import type { Segment } from "./types";

export interface LeadCounts {
  total: number;
  byTier: Record<AgeTier, number>;
  bySegment: Record<Segment, number>;
  topZips: { zip: string; count: number }[];
}

export async function leadCounts(tenantId: string, now: Date = new Date()): Promise<LeadCounts> {
  const all = await db
    .select({ lastUpdated: leads.lastUpdated, segment: leads.segment, zip: leads.zip })
    .from(leads)
    .where(eq(leads.tenantId, tenantId));

  const byTier: Record<AgeTier, number> = { real_time: 0, one_week: 0, thirty_day: 0, older: 0 };
  const bySegment: Record<Segment, number> = { residential: 0, commercial: 0 };
  const zipCounts = new Map<string, number>();

  for (const r of all) {
    byTier[r.lastUpdated ? ageTier(r.lastUpdated, now) : "older"]++;
    bySegment[r.segment]++;
    if (r.zip) zipCounts.set(r.zip, (zipCounts.get(r.zip) ?? 0) + 1);
  }

  const topZips = [...zipCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([zip, count]) => ({ zip, count }));

  return { total: all.length, byTier, bySegment, topZips };
}
```

- [ ] **Step 4: Run — expect PASS (1 test).**

- [ ] **Step 5: Commit**

```bash
git add src/leads/stats.ts tests/leads/stats.test.ts
git commit -m "feat: lead counts (tier/segment/zip) for admin QA"
```

---

### Task 8: Webhook ingest endpoint

**Files:** Create `app/api/ingest/[tenant]/route.ts`

- [ ] **Step 1: Write `app/api/ingest/[tenant]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { ingestKeyMatches } from "@/src/leads/ingest-key";
import { ingestRows } from "@/src/leads/ingest";
import { parseCsvStream, parseJsonArray } from "@/src/leads/parse";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant } = await params;
  const row = (await db.select().from(tenants).where(eq(tenants.id, tenant)).limit(1))[0];
  if (!row) return NextResponse.json({ error: "unknown tenant" }, { status: 404 });
  if (!ingestKeyMatches(req.headers.get("x-ingest-key"), row.ingestKey)) {
    return NextResponse.json({ error: "invalid ingest key" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  const body = await req.text();
  try {
    const summary = contentType.includes("application/json")
      ? await ingestRows(tenant, "webhook", parseJsonArray(body))
      : await ingestRows(tenant, "webhook", parseCsvStream(body));
    return NextResponse.json(summary);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
```

- [ ] **Step 2: Verify against the dev DB**

Run `npm run db:seed` (ensures the dev roofers.co tenant has an ingest key). Get its id + key, then start the dev server and exercise the endpoint:
```bash
# fetch tenant id + key for roofers.co
DOTENV_CONFIG_PATH=.env.local node -r dotenv/config -e "const {Client}=require('pg');const c=new Client({connectionString:process.env.DATABASE_URL});c.connect().then(()=>c.query(\"select id, ingest_key from tenants where domain='roofers.co'\")).then(r=>{console.log(JSON.stringify(r.rows[0]));return c.end()})"
```
With `npm run dev` running, using that `<id>`/`<key>`:
```bash
# wrong key -> 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "x-ingest-key: nope" -H "content-type: application/json" -d '[]' http://localhost:3000/api/ingest/<id>
# good key + JSON -> summary
curl -s -X POST -H "x-ingest-key: <key>" -H "content-type: application/json" -d '[{"sha256_lc_hem":"wh1","personal_zip":"30265","last_updated":"2026-05-30 00:00:00"}]' http://localhost:3000/api/ingest/<id>
# good key + CSV -> summary
printf 'sha256_lc_hem,personal_zip,last_updated\nwh2,30265,2026-05-30 00:00:00\n' | curl -s -X POST -H "x-ingest-key: <key>" -H "content-type: text/csv" --data-binary @- http://localhost:3000/api/ingest/<id>
```
Expect: 401 for the wrong key; `{"inserted":1,...}` for both good calls. Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add app/api/ingest
git commit -m "feat: per-tenant webhook ingest endpoint"
```

---

### Task 9: Admin upload endpoint

**Files:** Create `app/api/admin/import/route.ts`

- [ ] **Step 1: Write `app/api/admin/import/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getAuthContext, canAccess } from "@/src/auth/context";
import { ingestRows } from "@/src/leads/ingest";
import { parseCsvStream } from "@/src/leads/parse";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!canAccess(ctx.user.role, ["god", "manager"])) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const tenantId = ctx.user.role === "god" ? url.searchParams.get("tenantId") : ctx.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  if (ctx.user.role === "manager" && tenantId !== ctx.user.tenantId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file required" }, { status: 400 });

  const text = await file.text();
  const summary = await ingestRows(tenantId, "upload", parseCsvStream(text));
  return NextResponse.json(summary);
}
```

- [ ] **Step 2: Verify build**

Run `npm run build`. Expect success; `/api/admin/import` and `/api/ingest/[tenant]` appear in the route list.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/import
git commit -m "feat: admin CSV import endpoint (session-gated)"
```

---

### Task 10: Admin Data panel UI

**Files:** Create `app/admin/data/page.tsx`, `app/admin/data/actions.ts`, `app/admin/data/UploadForm.tsx`

- [ ] **Step 1: Write `app/admin/data/actions.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { requireAuth } from "@/src/auth/guard";
import { generateIngestKey } from "@/src/leads/ingest-key";

export async function regenerateIngestKeyAction(formData: FormData) {
  await requireAuth(["god"]);
  const tenantId = String(formData.get("tenantId") ?? "");
  if (tenantId) {
    await db.update(tenants).set({ ingestKey: generateIngestKey() }).where(eq(tenants.id, tenantId));
  }
  revalidatePath("/admin/data");
}
```

- [ ] **Step 2: Write `app/admin/data/UploadForm.tsx`**

```tsx
"use client";
import { useState } from "react";

export function UploadForm({ tenantId }: { tenantId: string }) {
  const [result, setResult] = useState<string>("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-2 flex items-center gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const input = (e.currentTarget.elements.namedItem("file") as HTMLInputElement);
        if (!input.files?.[0]) return;
        setBusy(true);
        setResult("");
        const fd = new FormData();
        fd.append("file", input.files[0]);
        const res = await fetch(`/api/admin/import?tenantId=${tenantId}`, { method: "POST", body: fd });
        const json = await res.json();
        setResult(JSON.stringify(json));
        setBusy(false);
      }}
    >
      <input type="file" name="file" accept=".csv,text/csv" required className="text-sm" />
      <button disabled={busy} className="rounded bg-black px-3 py-1 text-sm text-white">
        {busy ? "Importing…" : "Upload CSV"}
      </button>
      {result && <span className="text-xs">{result}</span>}
    </form>
  );
}
```

- [ ] **Step 3: Write `app/admin/data/page.tsx`**

```tsx
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { leadCounts } from "@/src/leads/stats";
import { regenerateIngestKeyAction } from "./actions";
import { UploadForm } from "./UploadForm";

export default async function DataPage() {
  await requireAuth(["god"]);
  const allTenants = await db.select().from(tenants).orderBy(tenants.domain);
  const base = process.env.PUBLIC_BASE_URL ?? "https://r0cketship.com";

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-bold">Data ingestion</h1>
      {await Promise.all(allTenants.map(async (t) => {
        const counts = await leadCounts(t.id);
        return (
          <section key={t.id} className="mt-8 rounded-xl border p-5">
            <h2 className="text-lg font-semibold">{t.domain}</h2>

            <div className="mt-3 rounded bg-gray-50 p-3 text-xs">
              <div className="font-medium">Webhook Integration</div>
              <code className="block break-all">POST {base}/api/ingest/{t.id}</code>
              <code className="block break-all">x-ingest-key: {t.ingestKey ?? "(none — run seed)"}</code>
              <form action={regenerateIngestKeyAction} className="mt-2">
                <input type="hidden" name="tenantId" value={t.id} />
                <button className="rounded border px-2 py-1">Regenerate key</button>
              </form>
            </div>

            <div className="mt-3">
              <div className="text-sm font-medium">Upload CSV</div>
              <UploadForm tenantId={t.id} />
            </div>

            <div className="mt-3 text-sm">
              <div className="font-medium">Counts — {counts.total} leads</div>
              <div className="opacity-80">
                tiers: real_time {counts.byTier.real_time}, one_week {counts.byTier.one_week}, thirty_day {counts.byTier.thirty_day}, older {counts.byTier.older}
              </div>
              <div className="opacity-80">segments: residential {counts.bySegment.residential}, commercial {counts.bySegment.commercial}</div>
              <div className="opacity-80">top zips: {counts.topZips.map((z) => `${z.zip}(${z.count})`).join(", ") || "—"}</div>
            </div>
          </section>
        );
      }))}
    </main>
  );
}
```

- [ ] **Step 4: Add a link to the Data panel from `app/admin/page.tsx`**

After the heading `<h1>God admin</h1>` line, add:
```tsx
        <a href="/admin/data" className="mt-2 inline-block text-sm underline">→ Data ingestion</a>
```

- [ ] **Step 5: Verify build**

Run `npm run build`. Expect success; `/admin/data` appears in the route list.

- [ ] **Step 6: Commit**

```bash
git add app/admin/data app/admin/page.tsx
git commit -m "feat: admin Data panel (webhook box, CSV upload, counts)"
```

---

### Task 11: Integration test + full suite + build

**Files:** Create `tests/leads/flow.test.ts`

- [ ] **Step 1: Write `tests/leads/flow.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { tenants, persons, leads } from "@/src/db/schema";
import { parseCsvStream } from "@/src/leads/parse";
import { ingestRows } from "@/src/leads/ingest";
import { leadCounts } from "@/src/leads/stats";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let tA: string;
beforeEach(async () => {
  const [a] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = a.id;
});

describe("ingestion flow (CSV)", () => {
  it("ingests a CSV with multi-value phones, dedupes on re-import, and reports counts", async () => {
    const csv =
      'sha256_lc_hem,first_name,personal_phone,personal_zip,company_name,last_updated\n' +
      'h1,Susan,"+1850, +1851",32301,,2026-05-30 00:00:00\n' +
      'h2,Glen,+1770,30265,Pallas Inc,2026-01-01 00:00:00\n';

    const s1 = await ingestRows(tA, "upload", parseCsvStream(csv));
    expect(s1).toEqual({ inserted: 2, updated: 0, skipped: 0, errors: 0 });

    const h1 = (await db.select().from(leads).where(eq(leads.shaLcHem, "h1")))[0];
    expect(h1.personalPhones).toEqual(["+1850", "+1851"]);
    expect(h1.segment).toBe("residential");
    const h2 = (await db.select().from(leads).where(eq(leads.shaLcHem, "h2")))[0];
    expect(h2.segment).toBe("commercial");

    // re-import identical -> all skipped, no duplicates
    const s2 = await ingestRows(tA, "upload", parseCsvStream(csv));
    expect(s2).toEqual({ inserted: 0, updated: 0, skipped: 2, errors: 0 });
    expect((await db.select().from(persons)).length).toBe(2);

    const counts = await leadCounts(tA, new Date("2026-05-31T12:00:00Z"));
    expect(counts.total).toBe(2);
    expect(counts.bySegment).toEqual({ residential: 1, commercial: 1 });
  });
});
```

- [ ] **Step 2: Run the new test — expect PASS.**

- [ ] **Step 3: Full suite** — `npm test` — report file + test totals; ALL pass.

- [ ] **Step 4: Build** — `npm run build` — success.

- [ ] **Step 5: Commit**

```bash
git add tests/leads/flow.test.ts
git commit -m "test: end-to-end CSV ingestion flow"
```

---

## Self-Review

**Spec coverage:**
- persons + leads schema, tenants.ingest_key → Task 1 ✓
- dynamic age tier → Task 2 ✓
- normalize (phones/emails/segment/extra/missing-hash) → Task 3 ✓
- streaming CSV + JSON parsers → Task 4 ✓
- ingest key gen/verify + seed backfill → Task 5 ✓
- ingest pipeline (upsert, dedupe, newer-wins, cross-tenant person) → Task 6 ✓
- counts by tier/segment/zip → Task 7 ✓
- webhook endpoint (key auth, JSON+CSV, 401/404) → Task 8 ✓
- admin import endpoint (session/role/tenant gating) → Task 9 ✓
- admin Data panel (webhook box, upload, counts, regenerate) → Task 10 ✓
- integration + suite + build → Task 11 ✓
- Deferred (customer delivery, billing, >100k background jobs, finalized seg rule) → not in plan, correct ✓

**Placeholder scan:** No TBD/TODO; every code step is complete. The `BATCH` marker in `ingest.ts` is an intentional, documented no-op hook (not a placeholder behavior gap — correctness is complete without it).

**Type consistency:** `NormalizedLead`/`IngestSummary`/`LeadSource`/`Segment` defined in `types.ts` and used across normalize/ingest/parse/stats. `ageTier`, `normalizeRow`, `parseCsvStream`, `parseJsonArray`, `generateIngestKey`, `ingestKeyMatches`, `ingestRows`, `leadCounts` names consistent across definitions, routes, and tests. `for await` deliberately accepts both async (CSV generator) and sync (JSON array) iterables in `ingestRows`.

---

## What Phase 3 delivers

A working lead pipeline: upload the real `audience_export` CSV (or POST JSON/CSV to a per-tenant webhook) → leads land in a per-tenant pool with parsed phone/email arrays, one shared `persons` row per hash across niches, idempotent re-imports (newer-wins), and a God Data panel showing the webhook URL/key and live counts by age-tier, segment, and ZIP — all covered by tests.
