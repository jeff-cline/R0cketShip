# Phase 6 — Lead Delivery & Customer CRM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let customers browse/filter the tenant lead pool, buy leads (atomically debiting the Phase 5a wallet by age-tier price, non-exclusive, never double-charged), work them in a CRM (status/notes/sale value + counts + CSV), and push each delivered lead to a generic outbound webhook.

**Architecture:** A `src/delivery/*` domain over Drizzle: `search` (pool availability minus owned leads, preview-only), `purchase` (transactional balance-check + deliveries + `lead_charge` ledger entries), `crm` (deliveries with full contact, status updates, stats, CSV), `webhook` (best-effort outbound POST). Thin Next.js customer pages (`/leads`, `/crm`, `/settings/integrations`) wire them, firing the webhook after purchase. TDD against the test DB; webhook tested with a stubbed `fetch`.

**Tech Stack:** Next.js 15 App Router, Drizzle/Postgres (transactions, SQL sum), Vitest.

**Environment note:** Dev/test Postgres at `localhost:5432` via the RUNNING SSH tunnel; `npm test` loads `.env.test`, `npm run db:migrate` loads `.env.local`. `psql` NOT installed — verify via node. Build on branch `build/phase6-delivery` off `main`.

---

## File Structure

```
src/db/schema.ts                 MODIFY: deliveryStatus enum; lead_deliveries, customer_integrations
tests/setup.ts                   MODIFY: truncate the 2 new tables
src/delivery/types.ts            CREATE: LeadFilters, LeadPreview, PurchaseResult, DeliveryStats
src/delivery/search.ts           CREATE: searchAvailableLeads, availableCount, pickAvailableLeads
src/delivery/purchase.ts         CREATE: purchaseLeads
src/delivery/crm.ts              CREATE: myDeliveries, updateDelivery, deliveryStats, deliveriesCsv
src/delivery/webhook.ts          CREATE: getIntegration, setIntegration, deliverLeadToWebhook, testIntegration
app/leads/page.tsx + actions.ts + FilterBuy.tsx   CREATE: browse/buy
app/crm/page.tsx + actions.ts    CREATE: CRM list + edit
app/api/crm/export/route.ts      CREATE: CSV download
app/settings/integrations/page.tsx + actions.ts + form.tsx  CREATE: webhook settings
app/dashboard/page.tsx           MODIFY: links
tests/delivery/*.test.ts         CREATE
```

---

### Task 1: Schema — lead_deliveries, customer_integrations

**Files:** Modify `src/db/schema.ts`, `tests/setup.ts`

- [ ] **Step 1: Append to `src/db/schema.ts`** (imports already include everything needed)

```ts
export const deliveryStatus = pgEnum("delivery_status", ["new", "contacted", "booked", "sold", "dead"]);

export const leadDeliveries = pgTable(
  "lead_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull(),
    customerId: uuid("customer_id").notNull().references(() => users.id),
    walletId: uuid("wallet_id").notNull().references(() => wallets.id),
    leadId: uuid("lead_id").notNull().references(() => leads.id),
    priceCredits: numeric("price_credits").notNull(),
    tierAtDelivery: text("tier_at_delivery").notNull(),
    status: deliveryStatus("status").notNull().default("new"),
    notes: text("notes"),
    saleValue: numeric("sale_value"),
    deliveredAt: timestamp("delivered_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("lead_deliveries_customer_lead_uniq").on(t.customerId, t.leadId)],
);

export const customerIntegrations = pgTable("customer_integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  customerId: uuid("customer_id").notNull().references(() => users.id).unique(),
  webhookUrl: text("webhook_url"),
  webhookSecret: text("webhook_secret"),
  active: boolean("active").notNull().default(true),
  lastStatus: text("last_status"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

- [ ] **Step 2: Edit `tests/setup.ts` truncation to add the two tables**

```ts
  await pool.query("TRUNCATE TABLE tenants, users, sessions, persons, leads, wallets, credit_ledger, payments, coupons, lead_deliveries, customer_integrations RESTART IDENTITY CASCADE");
```

- [ ] **Step 3: Generate + apply migration**

`npm run db:generate` then `npm run db:migrate`. Expect a new SQL file creating `delivery_status` enum + the two tables; migrate applies cleanly.

- [ ] **Step 4: Verify (node)**

```bash
DOTENV_CONFIG_PATH=.env.local node -r dotenv/config -e "const {Client}=require('pg');const c=new Client({connectionString:process.env.DATABASE_URL});c.connect().then(()=>c.query(\"select table_name from information_schema.tables where table_name in ('lead_deliveries','customer_integrations') order by table_name\")).then(r=>{console.log('TABLES:',r.rows.map(x=>x.table_name).join(','));return c.end()}).catch(e=>{console.error(e.message);process.exit(1)})"
```
Expect: `TABLES: customer_integrations,lead_deliveries`.

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts tests/setup.ts drizzle/
git commit -m "feat: add lead_deliveries and customer_integrations schema"
```

---

### Task 2: Pool search (types + search)

**Files:** Create `src/delivery/types.ts`, `src/delivery/search.ts`, `tests/delivery/search.test.ts`

- [ ] **Step 1: Write `src/delivery/types.ts`**

```ts
import type { AgeTier } from "../leads/age-tier";

export interface LeadFilters {
  zips?: string[];
  segment?: "residential" | "commercial";
  tier?: AgeTier;
  score?: string;
}

export interface LeadPreview {
  leadId: string;
  zip: string | null;
  city: string | null;
  state: string | null;
  segment: "residential" | "commercial";
  scoreCategory: string | null;
  tier: AgeTier;
  price: number;
}

export interface PurchaseResult {
  delivered: { deliveryId: string; leadId: string; price: number }[];
  totalCharged: number;
  skipped: number;
}

export interface DeliveryStats {
  delivered: number;
  conversions: number;
  revenue: number;
  creditsSpent: number;
}
```

- [ ] **Step 2: Write `tests/delivery/search.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants, leads, persons } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { searchAvailableLeads, availableCount, pickAvailableLeads } from "@/src/delivery/search";
import { purchaseLeads } from "@/src/delivery/purchase";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
const now = new Date("2026-05-31T12:00:00Z");
let tA: string, customerId: string;

async function addLead(sha: string, opts: { zip?: string; segment?: "residential" | "commercial"; lastUpdated?: string; score?: string }) {
  const [p] = await db.insert(persons).values({ shaLcHem: sha }).returning();
  const [l] = await db.insert(leads).values({
    tenantId: tA, personId: p.id, shaLcHem: sha, zip: opts.zip ?? "30265",
    segment: opts.segment ?? "residential", scoreCategory: opts.score ?? "low",
    lastUpdated: opts.lastUpdated ? new Date(opts.lastUpdated) : null, source: "upload",
  }).returning();
  return l.id;
}

beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
  const u = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c@roofers.co", role: "customer", tempPassword: "x" });
  customerId = u.id;
});

describe("searchAvailableLeads", () => {
  it("returns preview rows with tier + price and no PII", async () => {
    await addLead("h1", { lastUpdated: "2026-05-31 00:00:00" }); // real_time -> 11
    const rows = await searchAvailableLeads(customerId, tA, {}, 100, now);
    expect(rows.length).toBe(1);
    expect(rows[0]).toMatchObject({ zip: "30265", tier: "real_time", price: 11 });
    expect(rows[0]).not.toHaveProperty("firstName");
    expect(rows[0]).not.toHaveProperty("personalPhones");
  });

  it("honors zip / segment / score / tier filters", async () => {
    await addLead("h1", { zip: "30265", segment: "residential", score: "high", lastUpdated: "2026-05-31 00:00:00" });
    await addLead("h2", { zip: "10001", segment: "commercial", score: "low", lastUpdated: "2026-01-01 00:00:00" });
    expect((await searchAvailableLeads(customerId, tA, { zips: ["30265"] }, 100, now)).length).toBe(1);
    expect((await searchAvailableLeads(customerId, tA, { segment: "commercial" }, 100, now)).length).toBe(1);
    expect((await searchAvailableLeads(customerId, tA, { score: "high" }, 100, now)).length).toBe(1);
    expect((await searchAvailableLeads(customerId, tA, { tier: "older" }, 100, now)).length).toBe(1);
  });

  it("excludes leads the customer already purchased", async () => {
    const id = await addLead("h1", { lastUpdated: "2026-01-01 00:00:00" }); // older -> 1.44
    await purchaseLeads(customerId, [id], now);
    expect((await searchAvailableLeads(customerId, tA, {}, 100, now)).length).toBe(0);
    expect(await availableCount(customerId, tA, {}, now)).toBe(0);
  });

  it("pickAvailableLeads returns freshest-first ids up to the limit", async () => {
    const older = await addLead("h1", { lastUpdated: "2026-01-01 00:00:00" });
    const newer = await addLead("h2", { lastUpdated: "2026-05-30 00:00:00" });
    const picked = await pickAvailableLeads(customerId, tA, {}, 1, now);
    expect(picked).toEqual([newer]);
  });
});
```

- [ ] **Step 3: Run — expect FAIL** (search + purchase modules missing). `npm test -- tests/delivery/search.test.ts`

- [ ] **Step 4: Write `src/delivery/search.ts`**

```ts
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { leads, leadDeliveries } from "../db/schema";
import { ageTier, type AgeTier } from "../leads/age-tier";
import { leadPrice } from "../billing/pricing";
import type { LeadFilters, LeadPreview } from "./types";

type LeadRow = typeof leads.$inferSelect;

async function ownedLeadIds(customerId: string): Promise<Set<string>> {
  const rows = await db
    .select({ leadId: leadDeliveries.leadId })
    .from(leadDeliveries)
    .where(eq(leadDeliveries.customerId, customerId));
  return new Set(rows.map((r) => r.leadId));
}

function tierOf(lead: LeadRow, now: Date): AgeTier {
  return lead.lastUpdated ? ageTier(lead.lastUpdated, now) : "older";
}

function matches(lead: LeadRow, f: LeadFilters, now: Date): boolean {
  if (f.zips && f.zips.length > 0 && (!lead.zip || !f.zips.includes(lead.zip))) return false;
  if (f.segment && lead.segment !== f.segment) return false;
  if (f.score && lead.scoreCategory !== f.score) return false;
  if (f.tier && tierOf(lead, now) !== f.tier) return false;
  return true;
}

async function availableRows(customerId: string, tenantId: string, f: LeadFilters, now: Date): Promise<LeadRow[]> {
  const owned = await ownedLeadIds(customerId);
  const rows = await db.select().from(leads).where(eq(leads.tenantId, tenantId));
  return rows.filter((l) => !owned.has(l.id) && matches(l, f, now));
}

export async function searchAvailableLeads(
  customerId: string,
  tenantId: string,
  filters: LeadFilters,
  limit = 100,
  now: Date = new Date(),
): Promise<LeadPreview[]> {
  const rows = await availableRows(customerId, tenantId, filters, now);
  return rows.slice(0, limit).map((l) => {
    const tier = tierOf(l, now);
    return {
      leadId: l.id, zip: l.zip, city: l.city, state: l.state,
      segment: l.segment, scoreCategory: l.scoreCategory, tier, price: leadPrice(tier),
    };
  });
}

export async function availableCount(customerId: string, tenantId: string, filters: LeadFilters, now: Date = new Date()): Promise<number> {
  return (await availableRows(customerId, tenantId, filters, now)).length;
}

export async function pickAvailableLeads(
  customerId: string,
  tenantId: string,
  filters: LeadFilters,
  limit: number,
  now: Date = new Date(),
): Promise<string[]> {
  const rows = await availableRows(customerId, tenantId, filters, now);
  rows.sort((a, b) => (b.lastUpdated?.getTime() ?? 0) - (a.lastUpdated?.getTime() ?? 0));
  return rows.slice(0, limit).map((l) => l.id);
}
```

Note: filtering is in-memory over the tenant's leads. Fine for MVP/QA scale; a SQL-pushdown for zip/segment/score (tier stays dynamic) is a future optimization.

- [ ] **Step 5: Run — expect PASS (4 tests).** (Depends on Task 3's `purchaseLeads`; if implementing strictly in order, write Task 3 first, OR temporarily skip the two tests that import purchase and run them after Task 3. Recommended: implement Task 3 immediately after Step 4 here, then run both suites. The plan keeps them as separate commits.)

- [ ] **Step 6: Commit**

```bash
git add src/delivery/types.ts src/delivery/search.ts tests/delivery/search.test.ts
git commit -m "feat: lead pool search (availability, filters, preview)"
```

---

### Task 3: Purchase (atomic debit)

**Files:** Create `src/delivery/purchase.ts`, `tests/delivery/purchase.test.ts`

- [ ] **Step 1: Write `tests/delivery/purchase.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { tenants, leads, persons, leadDeliveries } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { getWalletForUser } from "@/src/billing/wallet";
import { walletBalance } from "@/src/billing/ledger";
import { purchaseLeads } from "@/src/delivery/purchase";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
const now = new Date("2026-05-31T12:00:00Z");
let tA: string, customerId: string;

async function addLead(sha: string, lastUpdated: string) {
  const [p] = await db.insert(persons).values({ shaLcHem: sha }).returning();
  const [l] = await db.insert(leads).values({ tenantId: tA, personId: p.id, shaLcHem: sha, zip: "30265", segment: "residential", lastUpdated: new Date(lastUpdated), source: "upload" }).returning();
  return l.id;
}

beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
  const u = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c@roofers.co", role: "customer", tempPassword: "x" });
  customerId = u.id;
});

describe("purchaseLeads", () => {
  it("debits the summed price and creates deliveries", async () => {
    const a = await addLead("h1", "2026-01-01 00:00:00"); // older 1.44
    const b = await addLead("h2", "2026-01-01 00:00:00"); // older 1.44
    const res = await purchaseLeads(customerId, [a, b], now);
    expect(res.totalCharged).toBe(2.88);
    expect(res.delivered.length).toBe(2);
    const w = (await getWalletForUser(customerId))!;
    expect(await walletBalance(w.id)).toBe(47.12); // 50 - 2.88
    expect((await db.select().from(leadDeliveries)).length).toBe(2);
  });

  it("rejects when balance is insufficient and charges nothing", async () => {
    // 5 real_time leads at 11 each = 55 > 50
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) ids.push(await addLead(`r${i}`, "2026-05-31 00:00:00"));
    await expect(purchaseLeads(customerId, ids, now)).rejects.toThrow(/insufficient/i);
    const w = (await getWalletForUser(customerId))!;
    expect(await walletBalance(w.id)).toBe(50); // unchanged
    expect((await db.select().from(leadDeliveries)).length).toBe(0);
  });

  it("skips leads the customer already owns (no double charge)", async () => {
    const a = await addLead("h1", "2026-01-01 00:00:00");
    await purchaseLeads(customerId, [a], now);
    const res = await purchaseLeads(customerId, [a], now);
    expect(res).toMatchObject({ totalCharged: 0, skipped: 1 });
    const w = (await getWalletForUser(customerId))!;
    expect(await walletBalance(w.id)).toBe(48.56); // charged once: 50 - 1.44
  });

  it("ignores lead ids from another tenant", async () => {
    const [tB] = await db.insert(tenants).values({ domain: "solar.co", niche: "solar", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
    const [p] = await db.insert(persons).values({ shaLcHem: "x" }).returning();
    const [foreign] = await db.insert(leads).values({ tenantId: tB.id, personId: p.id, shaLcHem: "x", segment: "residential", source: "upload" }).returning();
    const res = await purchaseLeads(customerId, [foreign.id], now);
    expect(res.delivered.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Write `src/delivery/purchase.ts`**

```ts
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/client";
import { leads, leadDeliveries, creditLedger, wallets } from "../db/schema";
import { ageTier } from "../leads/age-tier";
import { leadPrice } from "../billing/pricing";
import type { PurchaseResult } from "./types";

export async function purchaseLeads(
  customerId: string,
  leadIds: string[],
  now: Date = new Date(),
): Promise<PurchaseResult> {
  const wallet = (await db.select().from(wallets).where(eq(wallets.userId, customerId)).limit(1))[0];
  if (!wallet) throw new Error("wallet not found");
  if (leadIds.length === 0) return { delivered: [], totalCharged: 0, skipped: 0 };

  const candidates = await db
    .select()
    .from(leads)
    .where(and(eq(leads.tenantId, wallet.tenantId), inArray(leads.id, leadIds)));

  const ownedRows = await db
    .select({ leadId: leadDeliveries.leadId })
    .from(leadDeliveries)
    .where(eq(leadDeliveries.customerId, customerId));
  const owned = new Set(ownedRows.map((r) => r.leadId));

  const toBuy = candidates.filter((l) => !owned.has(l.id));
  const skipped = leadIds.length - toBuy.length;
  if (toBuy.length === 0) return { delivered: [], totalCharged: 0, skipped };

  const priced = toBuy.map((l) => {
    const tier = l.lastUpdated ? ageTier(l.lastUpdated, now) : "older";
    return { lead: l, tier, price: leadPrice(tier) };
  });
  const total = Math.round(priced.reduce((s, p) => s + p.price, 0) * 100) / 100;

  return db.transaction(async (tx) => {
    await tx.select().from(wallets).where(eq(wallets.id, wallet.id)).for("update");
    const [bal] = await tx
      .select({ total: sql<string>`coalesce(sum(${creditLedger.amount}), 0)` })
      .from(creditLedger)
      .where(eq(creditLedger.walletId, wallet.id));
    const balance = parseFloat(bal.total);
    if (balance < total) throw new Error("insufficient balance");

    const delivered: PurchaseResult["delivered"] = [];
    for (const p of priced) {
      const [d] = await tx
        .insert(leadDeliveries)
        .values({
          tenantId: wallet.tenantId, customerId, walletId: wallet.id, leadId: p.lead.id,
          priceCredits: String(p.price), tierAtDelivery: p.tier, status: "new",
        })
        .returning({ id: leadDeliveries.id });
      await tx.insert(creditLedger).values({
        walletId: wallet.id, tenantId: wallet.tenantId, amount: String(-p.price),
        type: "lead_charge", description: `Lead ${p.lead.id}`, refId: p.lead.id,
      });
      delivered.push({ deliveryId: d.id, leadId: p.lead.id, price: p.price });
    }
    return { delivered, totalCharged: total, skipped };
  });
}
```

- [ ] **Step 4: Run — expect PASS (4 tests).** Then run `npm test -- tests/delivery/search.test.ts` to confirm the search suite (which uses purchase) now fully passes too.

- [ ] **Step 5: Commit**

```bash
git add src/delivery/purchase.ts tests/delivery/purchase.test.ts
git commit -m "feat: atomic lead purchase with wallet debit"
```

---

### Task 4: CRM (deliveries, update, stats, CSV)

**Files:** Create `src/delivery/crm.ts`, `tests/delivery/crm.test.ts`

- [ ] **Step 1: Write `tests/delivery/crm.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants, leads, persons } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { purchaseLeads } from "@/src/delivery/purchase";
import { myDeliveries, updateDelivery, deliveryStats, deliveriesCsv } from "@/src/delivery/crm";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
const now = new Date("2026-05-31T12:00:00Z");
let tA: string, c1: string, c2: string;

async function addLead(sha: string) {
  const [p] = await db.insert(persons).values({ shaLcHem: sha }).returning();
  const [l] = await db.insert(leads).values({ tenantId: tA, personId: p.id, shaLcHem: sha, firstName: "Sue", zip: "30265", segment: "residential", lastUpdated: new Date("2026-01-01"), source: "upload" }).returning();
  return l.id;
}

beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
  c1 = (await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c1@roofers.co", role: "customer", tempPassword: "x" })).id;
  c2 = (await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c2@roofers.co", role: "customer", tempPassword: "x" })).id;
});

describe("crm", () => {
  it("myDeliveries returns full contact for the owner", async () => {
    const id = await addLead("h1");
    await purchaseLeads(c1, [id], now);
    const rows = await myDeliveries(c1);
    expect(rows.length).toBe(1);
    expect(rows[0].firstName).toBe("Sue");
    expect(rows[0].status).toBe("new");
  });

  it("updateDelivery: owner can update; another customer cannot", async () => {
    const id = await addLead("h1");
    const res = await purchaseLeads(c1, [id], now);
    const deliveryId = res.delivered[0].deliveryId;
    await updateDelivery(c1, deliveryId, { status: "sold", saleValue: 9000, notes: "won" });
    expect((await myDeliveries(c1))[0].status).toBe("sold");
    await expect(updateDelivery(c2, deliveryId, { status: "dead" })).rejects.toThrow();
  });

  it("deliveryStats counts conversions and revenue", async () => {
    const a = await addLead("h1"); const b = await addLead("h2");
    const r = await purchaseLeads(c1, [a, b], now);
    await updateDelivery(c1, r.delivered[0].deliveryId, { status: "sold", saleValue: 9000 });
    await updateDelivery(c1, r.delivered[1].deliveryId, { status: "booked" });
    const s = await deliveryStats(c1);
    expect(s.delivered).toBe(2);
    expect(s.conversions).toBe(2); // booked + sold
    expect(s.revenue).toBe(9000);
    expect(s.creditsSpent).toBe(2.88);
  });

  it("deliveriesCsv produces a header + rows", () => {
    const csv = deliveriesCsv([
      { firstName: "Sue", lastName: "X", zip: "30265", status: "new", priceCredits: "1.44", saleValue: null, phones: "+1800", emails: "a@b.co" } as any,
    ]);
    expect(csv.split("\n")[0]).toContain("first_name");
    expect(csv).toContain("Sue");
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Write `src/delivery/crm.ts`**

```ts
import { and, eq, desc, inArray } from "drizzle-orm";
import { db } from "../db/client";
import { leadDeliveries, leads } from "../db/schema";
import type { DeliveryStats } from "./types";

export async function myDeliveries(customerId: string) {
  return db
    .select({
      deliveryId: leadDeliveries.id,
      status: leadDeliveries.status,
      notes: leadDeliveries.notes,
      saleValue: leadDeliveries.saleValue,
      priceCredits: leadDeliveries.priceCredits,
      tier: leadDeliveries.tierAtDelivery,
      deliveredAt: leadDeliveries.deliveredAt,
      leadId: leads.id,
      firstName: leads.firstName,
      lastName: leads.lastName,
      zip: leads.zip,
      city: leads.city,
      state: leads.state,
      address: leads.address,
      phones: leads.personalPhones,
      mobilePhones: leads.mobilePhones,
      emails: leads.emails,
      segment: leads.segment,
      scoreCategory: leads.scoreCategory,
    })
    .from(leadDeliveries)
    .innerJoin(leads, eq(leadDeliveries.leadId, leads.id))
    .where(eq(leadDeliveries.customerId, customerId))
    .orderBy(desc(leadDeliveries.deliveredAt));
}

export async function updateDelivery(
  customerId: string,
  deliveryId: string,
  patch: { status?: "new" | "contacted" | "booked" | "sold" | "dead"; notes?: string; saleValue?: number | null },
) {
  const existing = (
    await db.select().from(leadDeliveries).where(eq(leadDeliveries.id, deliveryId)).limit(1)
  )[0];
  if (!existing || existing.customerId !== customerId) throw new Error("Not authorized");
  const [row] = await db
    .update(leadDeliveries)
    .set({
      status: patch.status ?? existing.status,
      notes: patch.notes ?? existing.notes,
      saleValue: patch.saleValue === undefined ? existing.saleValue : patch.saleValue === null ? null : String(patch.saleValue),
      updatedAt: new Date(),
    })
    .where(eq(leadDeliveries.id, deliveryId))
    .returning();
  return row;
}

export async function deliveryStats(customerId: string): Promise<DeliveryStats> {
  const rows = await db
    .select({ status: leadDeliveries.status, saleValue: leadDeliveries.saleValue, priceCredits: leadDeliveries.priceCredits })
    .from(leadDeliveries)
    .where(eq(leadDeliveries.customerId, customerId));
  let conversions = 0, revenue = 0, creditsSpent = 0;
  for (const r of rows) {
    if (r.status === "booked" || r.status === "sold") conversions++;
    if (r.saleValue) revenue += parseFloat(r.saleValue);
    creditsSpent += parseFloat(r.priceCredits);
  }
  return {
    delivered: rows.length,
    conversions,
    revenue: Math.round(revenue * 100) / 100,
    creditsSpent: Math.round(creditsSpent * 100) / 100,
  };
}

export function deliveriesCsv(rows: Record<string, unknown>[]): string {
  const cols = ["first_name", "last_name", "address", "city", "state", "zip", "phones", "emails", "status", "sale_value", "price_credits"];
  const map: Record<string, string> = {
    first_name: "firstName", last_name: "lastName", address: "address", city: "city",
    state: "state", zip: "zip", phones: "phones", emails: "emails", status: "status",
    sale_value: "saleValue", price_credits: "priceCredits",
  };
  const esc = (v: unknown) => {
    const s = Array.isArray(v) ? v.join("; ") : v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = cols.join(",");
  const lines = rows.map((r) => cols.map((c) => esc(r[map[c]])).join(","));
  return [header, ...lines].join("\n");
}
```

- [ ] **Step 4: Run — expect PASS (4 tests).**

- [ ] **Step 5: Commit**

```bash
git add src/delivery/crm.ts tests/delivery/crm.test.ts
git commit -m "feat: CRM deliveries, update, stats, CSV"
```

---

### Task 5: Outbound webhook

**Files:** Create `src/delivery/webhook.ts`, `tests/delivery/webhook.test.ts`

- [ ] **Step 1: Write `tests/delivery/webhook.test.ts`**

```ts
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { getIntegration, setIntegration, deliverLeadToWebhook } from "@/src/delivery/webhook";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let tA: string, customerId: string;
beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
  customerId = (await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c@roofers.co", role: "customer", tempPassword: "x" })).id;
});
afterEach(() => vi.unstubAllGlobals());

describe("webhook integration", () => {
  it("setIntegration upserts and getIntegration reads it back", async () => {
    await setIntegration(customerId, tA, { webhookUrl: "https://x.test/hook", webhookSecret: "s3cr3t", active: true });
    const i = await getIntegration(customerId);
    expect(i?.webhookUrl).toBe("https://x.test/hook");
    await setIntegration(customerId, tA, { webhookUrl: "https://y.test/hook", webhookSecret: null, active: false });
    const i2 = await getIntegration(customerId);
    expect(i2?.webhookUrl).toBe("https://y.test/hook");
    expect(i2?.active).toBe(false);
  });

  it("posts JSON with the secret header when configured", async () => {
    const calls: any[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init: any) => { calls.push({ url, init }); return new Response("ok", { status: 200 }); }));
    await setIntegration(customerId, tA, { webhookUrl: "https://x.test/hook", webhookSecret: "s3cr3t", active: true });
    const integ = (await getIntegration(customerId))!;
    const status = await deliverLeadToWebhook(integ, { leadId: "l1", zip: "30265" });
    expect(status).toBe("ok");
    expect(calls[0].url).toBe("https://x.test/hook");
    expect(calls[0].init.headers["x-webhook-secret"]).toBe("s3cr3t");
    expect(JSON.parse(calls[0].init.body).zip).toBe("30265");
  });

  it("a failing endpoint does not throw and records last_status", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));
    await setIntegration(customerId, tA, { webhookUrl: "https://x.test/hook", webhookSecret: null, active: true });
    const integ = (await getIntegration(customerId))!;
    const status = await deliverLeadToWebhook(integ, { leadId: "l1" });
    expect(status).toMatch(/fail/i);
    const after = await getIntegration(customerId);
    expect(after?.lastStatus).toMatch(/fail/i);
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Write `src/delivery/webhook.ts`**

```ts
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { customerIntegrations } from "../db/schema";

export type IntegrationRow = typeof customerIntegrations.$inferSelect;

export async function getIntegration(customerId: string): Promise<IntegrationRow | null> {
  return (
    await db.select().from(customerIntegrations).where(eq(customerIntegrations.customerId, customerId)).limit(1)
  )[0] ?? null;
}

export async function setIntegration(
  customerId: string,
  tenantId: string,
  input: { webhookUrl: string | null; webhookSecret: string | null; active: boolean },
): Promise<IntegrationRow> {
  const [row] = await db
    .insert(customerIntegrations)
    .values({ customerId, tenantId, webhookUrl: input.webhookUrl, webhookSecret: input.webhookSecret, active: input.active })
    .onConflictDoUpdate({
      target: customerIntegrations.customerId,
      set: { webhookUrl: input.webhookUrl, webhookSecret: input.webhookSecret, active: input.active },
    })
    .returning();
  return row;
}

/** Best-effort POST of a lead payload. Never throws; records last_status. */
export async function deliverLeadToWebhook(integration: IntegrationRow, payload: unknown): Promise<string> {
  if (!integration.active || !integration.webhookUrl) return "skipped";
  let status: string;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (integration.webhookSecret) headers["x-webhook-secret"] = integration.webhookSecret;
    const res = await fetch(integration.webhookUrl, {
      method: "POST", headers, body: JSON.stringify(payload), signal: controller.signal,
    });
    clearTimeout(timer);
    status = res.ok ? "ok" : `failed: ${res.status}`;
  } catch (e) {
    status = `failed: ${(e as Error).message}`;
  }
  await db.update(customerIntegrations).set({ lastStatus: status }).where(eq(customerIntegrations.id, integration.id));
  return status;
}

export async function testIntegration(customerId: string): Promise<string> {
  const integ = await getIntegration(customerId);
  if (!integ) return "no integration configured";
  return deliverLeadToWebhook(integ, { test: true, at: new Date().toISOString() });
}
```

- [ ] **Step 4: Run — expect PASS (3 tests).**

- [ ] **Step 5: Commit**

```bash
git add src/delivery/webhook.ts tests/delivery/webhook.test.ts
git commit -m "feat: customer outbound webhook (best-effort delivery)"
```

---

### Task 6: Browse/buy UI (`/leads`)

**Files:** Create `app/leads/page.tsx`, `app/leads/actions.ts`, `app/leads/FilterBuy.tsx`

- [ ] **Step 1: Write `app/leads/actions.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/src/auth/guard";
import { pickAvailableLeads } from "@/src/delivery/search";
import { purchaseLeads } from "@/src/delivery/purchase";
import { getIntegration, deliverLeadToWebhook } from "@/src/delivery/webhook";
import { myDeliveries } from "@/src/delivery/crm";
import type { LeadFilters } from "@/src/delivery/types";

function filtersFrom(formData: FormData): LeadFilters {
  const zip = String(formData.get("zip") ?? "").trim();
  const segment = String(formData.get("segment") ?? "");
  const tier = String(formData.get("tier") ?? "");
  const score = String(formData.get("score") ?? "");
  return {
    zips: zip ? zip.split(",").map((z) => z.trim()).filter(Boolean) : undefined,
    segment: segment === "residential" || segment === "commercial" ? segment : undefined,
    tier: (tier || undefined) as LeadFilters["tier"],
    score: score || undefined,
  };
}

export async function buyAction(_prev: unknown, formData: FormData): Promise<{ error?: string; ok?: string }> {
  const ctx = await requireAuth(["customer"]);
  const qty = Math.max(1, Math.min(100, Number(formData.get("qty") ?? 1)));
  const filters = filtersFrom(formData);
  const ids = await pickAvailableLeads(ctx.user.id, ctx.user.tenantId, filters, qty);
  if (ids.length === 0) return { error: "No matching leads available." };
  try {
    const res = await purchaseLeads(ctx.user.id, ids);
    // fire webhooks best-effort for the just-delivered leads
    const integ = await getIntegration(ctx.user.id);
    if (integ) {
      const delivered = await myDeliveries(ctx.user.id);
      const boughtIds = new Set(res.delivered.map((d) => d.leadId));
      for (const row of delivered.filter((r) => boughtIds.has(r.leadId))) {
        await deliverLeadToWebhook(integ, row);
      }
    }
    revalidatePath("/leads");
    revalidatePath("/crm");
    return { ok: `Bought ${res.delivered.length} lead(s) for ${res.totalCharged} credits.` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
```

- [ ] **Step 2: Write `app/leads/FilterBuy.tsx`**

```tsx
"use client";
import { useActionState } from "react";
import { buyAction } from "./actions";

export function FilterBuy() {
  const [state, action, pending] = useActionState(buyAction, {});
  return (
    <form action={action} className="mt-4 flex flex-wrap items-end gap-2">
      <input name="zip" placeholder="ZIP(s) comma-sep" className="rounded border p-2" />
      <select name="segment" className="rounded border p-2"><option value="">any segment</option><option value="residential">residential</option><option value="commercial">commercial</option></select>
      <select name="tier" className="rounded border p-2"><option value="">any age</option><option value="real_time">real_time</option><option value="one_week">one_week</option><option value="thirty_day">thirty_day</option><option value="older">older</option></select>
      <select name="score" className="rounded border p-2"><option value="">any score</option><option value="low">low</option><option value="medium">medium</option><option value="high">high</option></select>
      <input name="qty" type="number" min="1" max="100" defaultValue="5" className="w-20 rounded border p-2" />
      <button disabled={pending} className="rounded bg-black px-3 py-2 text-white">{pending ? "Buying…" : "Buy freshest"}</button>
      {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      {state?.ok && <span className="text-sm text-green-700">{state.ok}</span>}
    </form>
  );
}
```

- [ ] **Step 3: Write `app/leads/page.tsx`**

```tsx
import { requireAuth } from "@/src/auth/guard";
import { getWalletForUser, ensureWalletWithBonus } from "@/src/billing/wallet";
import { walletBalance } from "@/src/billing/ledger";
import { searchAvailableLeads, availableCount } from "@/src/delivery/search";
import { FilterBuy } from "./FilterBuy";

export default async function LeadsPage() {
  const ctx = await requireAuth(["customer"]);
  const wallet = (await getWalletForUser(ctx.user.id)) ?? (await ensureWalletWithBonus(ctx.user.id));
  const balance = await walletBalance(wallet.id);
  const preview = await searchAvailableLeads(ctx.user.id, ctx.user.tenantId, {}, 25);
  const total = await availableCount(ctx.user.id, ctx.user.tenantId, {});

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-bold">Buy leads</h1>
      <p className="mt-1 text-sm opacity-70">Balance: {balance} credits · {total} available</p>
      <FilterBuy />
      <h2 className="mt-8 font-semibold">Available (preview — full contact unlocks on purchase)</h2>
      <table className="mt-2 w-full text-sm">
        <thead><tr className="text-left opacity-60"><th>ZIP</th><th>City</th><th>State</th><th>Segment</th><th>Score</th><th>Age</th><th>Price</th></tr></thead>
        <tbody>
          {preview.map((p) => (
            <tr key={p.leadId} className="border-t">
              <td>{p.zip}</td><td>{p.city}</td><td>{p.state}</td><td>{p.segment}</td><td>{p.scoreCategory}</td><td>{p.tier}</td><td>{p.price}</td>
            </tr>
          ))}
          {preview.length === 0 && <tr><td colSpan={7} className="py-2 opacity-60">none available</td></tr>}
        </tbody>
      </table>
    </main>
  );
}
```

- [ ] **Step 4: Verify build** — `npm run build` — success; `/leads` in the route list.

- [ ] **Step 5: Commit**

```bash
git add app/leads
git commit -m "feat: customer buy-leads page"
```

---

### Task 7: CRM UI + CSV download

**Files:** Create `app/crm/page.tsx`, `app/crm/actions.ts`, `app/api/crm/export/route.ts`

- [ ] **Step 1: Write `app/crm/actions.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/src/auth/guard";
import { updateDelivery } from "@/src/delivery/crm";

export async function updateDeliveryAction(formData: FormData) {
  const ctx = await requireAuth(["customer"]);
  const deliveryId = String(formData.get("deliveryId") ?? "");
  const status = String(formData.get("status") ?? "new") as "new" | "contacted" | "booked" | "sold" | "dead";
  const notes = String(formData.get("notes") ?? "");
  const saleRaw = String(formData.get("saleValue") ?? "").trim();
  const saleValue = saleRaw === "" ? null : Number(saleRaw);
  try {
    await updateDelivery(ctx.user.id, deliveryId, { status, notes, saleValue });
  } catch {
    // not authorized / not found — ignore
  }
  revalidatePath("/crm");
}
```

- [ ] **Step 2: Write `app/crm/page.tsx`**

```tsx
import { requireAuth } from "@/src/auth/guard";
import { myDeliveries, deliveryStats } from "@/src/delivery/crm";
import { updateDeliveryAction } from "./actions";

export default async function CrmPage() {
  const ctx = await requireAuth(["customer"]);
  const rows = await myDeliveries(ctx.user.id);
  const stats = await deliveryStats(ctx.user.id);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-bold">My leads</h1>
      <p className="mt-1 text-sm opacity-70">
        {stats.delivered} delivered · {stats.conversions} conversions · ${stats.revenue} revenue · {stats.creditsSpent} credits spent
        {" · "}<a className="underline" href="/api/crm/export">Download CSV</a>
      </p>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.deliveryId} className="rounded border p-3 text-sm">
            <div className="font-medium">{r.firstName} {r.lastName} — {r.zip} {r.city}, {r.state}</div>
            <div className="opacity-70">{(r.phones ?? []).join(", ")} · {(r.emails ?? []).join(", ")}</div>
            <form action={updateDeliveryAction} className="mt-2 flex flex-wrap items-center gap-2">
              <input type="hidden" name="deliveryId" value={r.deliveryId} />
              <select name="status" defaultValue={r.status} className="rounded border p-1">
                {["new", "contacted", "booked", "sold", "dead"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input name="saleValue" defaultValue={r.saleValue ?? ""} placeholder="sale $" className="w-24 rounded border p-1" />
              <input name="notes" defaultValue={r.notes ?? ""} placeholder="notes" className="flex-1 rounded border p-1" />
              <button className="rounded border px-2 py-1">Save</button>
            </form>
          </li>
        ))}
        {rows.length === 0 && <li className="opacity-60">No leads yet — buy some on the Leads page.</li>}
      </ul>
    </main>
  );
}
```

- [ ] **Step 3: Write `app/api/crm/export/route.ts`**

```ts
import { getAuthContext, canAccess } from "@/src/auth/context";
import { myDeliveries, deliveriesCsv } from "@/src/delivery/crm";

export const runtime = "nodejs";

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx || !canAccess(ctx.user.role, ["customer"])) {
    return new Response("forbidden", { status: 403 });
  }
  const rows = await myDeliveries(ctx.user.id);
  const csv = deliveriesCsv(rows as unknown as Record<string, unknown>[]);
  return new Response(csv, {
    headers: { "content-type": "text/csv", "content-disposition": 'attachment; filename="leads.csv"' },
  });
}
```

- [ ] **Step 4: Verify build** — `npm run build` — success; `/crm` and `/api/crm/export` in the route list.

- [ ] **Step 5: Commit**

```bash
git add app/crm app/api/crm
git commit -m "feat: customer CRM page + CSV export"
```

---

### Task 8: Integration settings UI

**Files:** Create `app/settings/integrations/page.tsx`, `app/settings/integrations/actions.ts`, `app/settings/integrations/form.tsx`; modify `app/dashboard/page.tsx`

- [ ] **Step 1: Write `app/settings/integrations/actions.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/src/auth/guard";
import { setIntegration, testIntegration } from "@/src/delivery/webhook";

export async function saveIntegrationAction(formData: FormData) {
  const ctx = await requireAuth(["customer"]);
  const webhookUrl = String(formData.get("webhookUrl") ?? "").trim() || null;
  const webhookSecret = String(formData.get("webhookSecret") ?? "").trim() || null;
  const active = formData.get("active") != null;
  await setIntegration(ctx.user.id, ctx.user.tenantId, { webhookUrl, webhookSecret, active });
  revalidatePath("/settings/integrations");
}

export async function testIntegrationAction() {
  const ctx = await requireAuth(["customer"]);
  await testIntegration(ctx.user.id);
  revalidatePath("/settings/integrations");
}
```

- [ ] **Step 2: Write `app/settings/integrations/page.tsx`**

```tsx
import { requireAuth } from "@/src/auth/guard";
import { getIntegration } from "@/src/delivery/webhook";
import { saveIntegrationAction, testIntegrationAction } from "./actions";

export default async function IntegrationsPage() {
  const ctx = await requireAuth(["customer"]);
  const integ = await getIntegration(ctx.user.id);

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-bold">CRM integration</h1>
      <p className="mt-1 text-sm opacity-70">Each lead you buy is POSTed to this URL as JSON.</p>
      <form action={saveIntegrationAction} className="mt-4 flex flex-col gap-2">
        <input name="webhookUrl" defaultValue={integ?.webhookUrl ?? ""} placeholder="https://your-crm/webhook" className="rounded border p-2" />
        <input name="webhookSecret" defaultValue={integ?.webhookSecret ?? ""} placeholder="secret (optional)" className="rounded border p-2" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={integ?.active ?? true} /> active</label>
        <button className="self-start rounded bg-black px-3 py-2 text-white">Save</button>
      </form>
      {integ?.lastStatus && <p className="mt-3 text-sm opacity-70">Last delivery: {integ.lastStatus}</p>}
      <form action={testIntegrationAction} className="mt-3"><button className="rounded border px-3 py-1 text-sm">Send test</button></form>
    </main>
  );
}
```

- [ ] **Step 3: Add links in `app/dashboard/page.tsx`**

After the existing `→ Credits & billing` link, add:
```tsx
        <a href="/leads" className="mt-3 ml-3 inline-block text-sm underline">→ Buy leads</a>
        <a href="/crm" className="mt-3 ml-3 inline-block text-sm underline">→ My leads (CRM)</a>
        <a href="/settings/integrations" className="mt-3 ml-3 inline-block text-sm underline">→ Integration</a>
```

- [ ] **Step 4: Verify build** — `npm run build` — success; `/settings/integrations` in the route list.

- [ ] **Step 5: Commit**

```bash
git add app/settings app/dashboard/page.tsx
git commit -m "feat: customer integration settings page"
```

---

### Task 9: Integration test + full suite + build

**Files:** Create `tests/delivery/flow.test.ts`

- [ ] **Step 1: Write `tests/delivery/flow.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants, leads, persons } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { getWalletForUser } from "@/src/billing/wallet";
import { walletBalance } from "@/src/billing/ledger";
import { searchAvailableLeads } from "@/src/delivery/search";
import { purchaseLeads } from "@/src/delivery/purchase";
import { myDeliveries, updateDelivery, deliveryStats } from "@/src/delivery/crm";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
const now = new Date("2026-05-31T12:00:00Z");
let tA: string, c1: string, c2: string;

async function addLead(sha: string) {
  const [p] = await db.insert(persons).values({ shaLcHem: sha }).returning();
  const [l] = await db.insert(leads).values({ tenantId: tA, personId: p.id, shaLcHem: sha, firstName: "Sue", zip: "30265", segment: "residential", lastUpdated: new Date("2026-01-01"), source: "upload" }).returning();
  return l.id;
}

beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
  c1 = (await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c1@roofers.co", role: "customer", tempPassword: "x" })).id;
  c2 = (await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c2@roofers.co", role: "customer", tempPassword: "x" })).id;
});

describe("delivery flow", () => {
  it("buy → CRM → mark sold → non-exclusive for second customer", async () => {
    const a = await addLead("h1"); const b = await addLead("h2");
    const res = await purchaseLeads(c1, [a, b], now);
    expect(res.totalCharged).toBe(2.88);
    const w1 = (await getWalletForUser(c1))!;
    expect(await walletBalance(w1.id)).toBe(47.12);

    // c1's pool now excludes a,b; c2 can still buy them (non-exclusive)
    expect((await searchAvailableLeads(c1, tA, {}, 100, now)).length).toBe(0);
    expect((await searchAvailableLeads(c2, tA, {}, 100, now)).length).toBe(2);
    await purchaseLeads(c2, [a], now);
    const w2 = (await getWalletForUser(c2))!;
    expect(await walletBalance(w2.id)).toBe(48.56);

    // mark sold and check stats
    const d = (await myDeliveries(c1))[0];
    await updateDelivery(c1, d.deliveryId, { status: "sold", saleValue: 9000 });
    const s = await deliveryStats(c1);
    expect(s.conversions).toBe(1);
    expect(s.revenue).toBe(9000);
  });
});
```

- [ ] **Step 2: Run the new test — expect PASS.**

- [ ] **Step 3: Full suite** — `npm test` — report file + test totals; ALL pass.

- [ ] **Step 4: Build** — `npm run build` — success.

- [ ] **Step 5: Commit**

```bash
git add tests/delivery/flow.test.ts
git commit -m "test: end-to-end lead delivery flow"
```

---

## Self-Review

**Spec coverage:**
- lead_deliveries + customer_integrations schema → Task 1 ✓
- pool search (availability minus owned, filters, preview-only, price/tier) → Task 2 ✓
- atomic purchase (debit, insufficient blocks, skip owned, cross-tenant ignore, non-exclusive) → Task 3 ✓
- CRM (deliveries w/ full contact, update authority, stats conversions/revenue/spend, CSV) → Task 4 ✓
- outbound webhook (best-effort, secret header, last_status) → Task 5 ✓
- buy UI → Task 6; CRM UI + CSV → Task 7; integration settings → Task 8 ✓
- webhook fired after purchase → Task 6 action ✓
- integration + suite + build → Task 9 ✓
- Deferred (subscriptions/exclusivity 5b, radius, automated conversions, provider OAuth) → not in plan ✓

**Placeholder scan:** No TBD/TODO; every code step complete. Task 2 Step 5 notes the search suite depends on Task 3's `purchaseLeads` (the two excluded-leads tests) — implement Task 3 right after, which the plan sequences next.

**Type consistency:** `LeadFilters`/`LeadPreview`/`PurchaseResult`/`DeliveryStats`/`IntegrationRow`/`AgeTier` consistent. `searchAvailableLeads`/`availableCount`/`pickAvailableLeads`/`purchaseLeads`/`myDeliveries`/`updateDelivery`/`deliveryStats`/`deliveriesCsv`/`getIntegration`/`setIntegration`/`deliverLeadToWebhook`/`testIntegration` match across modules, UI, and tests. Numeric columns written as strings, read via `Number()/parseFloat`. `lead_charge` ledger type (defined in Phase 5a) is used for debits.

---

## What Phase 6 delivers

Customers browse the tenant lead pool (previews only), buy leads that atomically debit their wallet by age tier (insufficient funds blocked, never double-charged, non-exclusive), then work them in a CRM with status/notes/sale-value, see leads-vs-conversions-vs-revenue, download a CSV, and auto-push each delivered lead to their own CRM webhook — closing the loop from credits to worked leads. Covered by tests.
