# Phase 5a — Credit Wallet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the credit economy — wallets, an immutable credit ledger (balance = sum), the per-tenant $50 signup bonus on account creation, one-time top-ups via a PaymentProvider interface (manual provider now), coupons, admin grants, and age-tiered lead pricing.

**Architecture:** A `src/billing/*` domain over Drizzle: a ledger module (append-only entries, SQL-summed balance), a wallet module (`ensureWalletWithBonus`, `grantCredits`), coupons, a `PaymentProvider` interface with a `manual` implementation, and a top-up module (`createTopup` → pending payment; idempotent `confirmPayment` → credits). Thin Next.js pages/actions for customer `/billing` and admin `/admin/billing`. All TDD'd against the test DB.

**Tech Stack:** Next.js 15 App Router, Drizzle/Postgres (numeric columns, SQL `sum`), Vitest.

**Environment note:** Dev/test Postgres at `localhost:5432` via the RUNNING SSH tunnel; `npm test` loads `.env.test`, `npm run db:migrate`/`db:seed` load `.env.local`. `psql` NOT installed locally — verify via node. Build on branch `build/phase5a-wallet` off `main`. Numeric/credit math uses JS numbers rounded to 2 decimals (fine for MVP; a decimal lib is a future hardening note).

---

## File Structure

```
src/db/schema.ts            MODIFY: ledgerType/paymentProvider/paymentStatus/couponKind enums; wallets, credit_ledger, payments, coupons tables; tenants.signupBonusCredits
src/db/seed.ts              MODIFY: backfill signup_bonus_credits (default 50)
tests/setup.ts              MODIFY: truncate the 4 new tables
src/billing/pricing.ts      CREATE: leadPrice(tier)
src/billing/ledger.ts       CREATE: addLedgerEntry, walletBalance, ledgerEntries, LedgerType
src/billing/wallet.ts       CREATE: getWalletForUser, ensureWalletWithBonus, grantCredits
src/billing/coupons.ts      CREATE: validateCoupon, createCoupon, listCoupons
src/billing/provider.ts     CREATE: PaymentProvider, manualProvider, getProvider
src/billing/topup.ts        CREATE: createTopup, confirmPayment, listPendingPayments, paymentsByTenant
src/auth/users.ts           MODIFY: createUser grants wallet+bonus for role=customer
app/billing/page.tsx        CREATE: customer billing (balance, history, top-up)
app/billing/actions.ts      CREATE: topUpAction
app/billing/TopUpForm.tsx   CREATE: client top-up form
app/admin/billing/page.tsx  CREATE: admin billing (pending payments, grant, coupons, report)
app/admin/billing/actions.ts CREATE: markPaidAction, grantCreditsAction, createCouponAction
tests/billing/*.test.ts     CREATE
```

---

### Task 1: Schema — wallets, credit_ledger, payments, coupons

**Files:** Modify `src/db/schema.ts`, `tests/setup.ts`, `src/db/seed.ts`

- [ ] **Step 1: Edit `src/db/schema.ts`**

Add `integer` to the `drizzle-orm/pg-core` import. Add `signupBonusCredits: numeric("signup_bonus_credits").notNull().default("50"),` to the EXISTING `tenants` table (before its `createdAt`). Then append:

```ts
export const ledgerType = pgEnum("ledger_type", [
  "signup_bonus", "topup", "coupon", "admin_grant", "lead_charge", "refund", "adjustment",
]);
export const paymentProvider = pgEnum("payment_provider", ["manual", "stripe", "paypal"]);
export const paymentStatus = pgEnum("payment_status", ["pending", "paid", "failed", "refunded"]);
export const couponKind = pgEnum("coupon_kind", ["percent", "fixed_credits"]);

export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
  userId: uuid("user_id").notNull().references(() => users.id).unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const creditLedger = pgTable("credit_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletId: uuid("wallet_id").notNull().references(() => wallets.id),
  tenantId: uuid("tenant_id").notNull(),
  amount: numeric("amount").notNull(),
  type: ledgerType("type").notNull(),
  description: text("description"),
  refId: uuid("ref_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  walletId: uuid("wallet_id").notNull().references(() => wallets.id),
  provider: paymentProvider("provider").notNull(),
  providerRef: text("provider_ref"),
  amountUsd: numeric("amount_usd").notNull(),
  credits: numeric("credits").notNull(),
  couponCode: text("coupon_code"),
  status: paymentStatus("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  paidAt: timestamp("paid_at"),
});

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id"),
  code: text("code").notNull().unique(),
  kind: couponKind("kind").notNull(),
  value: numeric("value").notNull(),
  maxRedemptions: integer("max_redemptions"),
  timesRedeemed: integer("times_redeemed").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

- [ ] **Step 2: Edit `tests/setup.ts` truncation**

```ts
  await pool.query("TRUNCATE TABLE tenants, users, sessions, persons, leads, wallets, credit_ledger, payments, coupons RESTART IDENTITY CASCADE");
```

- [ ] **Step 3: Backfill `signup_bonus_credits` in `src/db/seed.ts`**

The migration default handles new rows; existing rows already get `50` via the column default on migrate. No seed change is strictly required, but to be explicit add — inside `seed()` before `await pool.end();`:
```ts
  await db.update(tenants).set({ signupBonusCredits: "50" }).where(isNull(tenants.signupBonusCredits));
```
(`isNull` is already imported in seed.ts from Phase 3. If for any reason it is not, add it to the existing `drizzle-orm` import.)

- [ ] **Step 4: Generate + apply migration**

`npm run db:generate` then `npm run db:migrate`. Expect a new SQL file creating the four enums, the four tables, and `tenants.signup_bonus_credits`; migrate applies cleanly.

- [ ] **Step 5: Verify (node)**

```bash
DOTENV_CONFIG_PATH=.env.local node -r dotenv/config -e "const {Client}=require('pg');const c=new Client({connectionString:process.env.DATABASE_URL});c.connect().then(()=>c.query(\"select table_name from information_schema.tables where table_name in ('wallets','credit_ledger','payments','coupons') order by table_name\")).then(r=>{console.log('TABLES:',r.rows.map(x=>x.table_name).join(','));return c.end()}).catch(e=>{console.error(e.message);process.exit(1)})"
```
Expect: `TABLES: coupons,credit_ledger,payments,wallets`.

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts tests/setup.ts src/db/seed.ts drizzle/
git commit -m "feat: add wallets, credit ledger, payments, coupons schema"
```

---

### Task 2: Lead pricing

**Files:** Create `src/billing/pricing.ts`, `tests/billing/pricing.test.ts`

- [ ] **Step 1: Write `tests/billing/pricing.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { leadPrice } from "@/src/billing/pricing";

describe("leadPrice", () => {
  it("prices by age tier in credits", () => {
    expect(leadPrice("real_time")).toBe(11);
    expect(leadPrice("one_week")).toBe(4);
    expect(leadPrice("thirty_day")).toBe(1.44);
    expect(leadPrice("older")).toBe(1.44);
  });
});
```

- [ ] **Step 2: Run — expect FAIL.** `npm test -- tests/billing/pricing.test.ts`

- [ ] **Step 3: Write `src/billing/pricing.ts`**

```ts
import type { AgeTier } from "../leads/age-tier";

/** Price of a single lead in credits (1 credit = $1), by recency tier. */
export function leadPrice(tier: AgeTier): number {
  switch (tier) {
    case "real_time": return 11;
    case "one_week": return 4;
    case "thirty_day": return 1.44;
    case "older": return 1.44;
  }
}
```

- [ ] **Step 4: Run — expect PASS (1 test).**

- [ ] **Step 5: Commit**

```bash
git add src/billing/pricing.ts tests/billing/pricing.test.ts
git commit -m "feat: age-tiered lead pricing"
```

---

### Task 3: Credit ledger

**Files:** Create `src/billing/ledger.ts`, `tests/billing/ledger.test.ts`

- [ ] **Step 1: Write `tests/billing/ledger.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants, users, wallets } from "@/src/db/schema";
import { addLedgerEntry, walletBalance, ledgerEntries } from "@/src/billing/ledger";
import { hashPassword } from "@/src/auth/password";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let walletId: string, tenantId: string;
beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  const [u] = await db.insert(users).values({ tenantId: t.id, email: "c@roofers.co", passwordHash: await hashPassword("x"), role: "customer" }).returning();
  const [w] = await db.insert(wallets).values({ tenantId: t.id, userId: u.id }).returning();
  walletId = w.id; tenantId = t.id;
});

describe("ledger", () => {
  it("balance of an empty wallet is 0", async () => {
    expect(await walletBalance(walletId)).toBe(0);
  });

  it("sums positive and negative entries", async () => {
    await addLedgerEntry({ walletId, tenantId, amount: 50, type: "signup_bonus" });
    await addLedgerEntry({ walletId, tenantId, amount: 11, type: "topup" });
    await addLedgerEntry({ walletId, tenantId, amount: -1.44, type: "lead_charge" });
    expect(await walletBalance(walletId)).toBe(59.56);
  });

  it("lists entries newest first", async () => {
    await addLedgerEntry({ walletId, tenantId, amount: 50, type: "signup_bonus", description: "first" });
    await addLedgerEntry({ walletId, tenantId, amount: 5, type: "admin_grant", description: "second" });
    const rows = await ledgerEntries(walletId);
    expect(rows.length).toBe(2);
    expect(rows[0].description).toBe("second");
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Write `src/billing/ledger.ts`**

```ts
import { eq, sql, desc } from "drizzle-orm";
import { db } from "../db/client";
import { creditLedger } from "../db/schema";

export type LedgerType =
  | "signup_bonus" | "topup" | "coupon" | "admin_grant" | "lead_charge" | "refund" | "adjustment";

export async function addLedgerEntry(e: {
  walletId: string;
  tenantId: string;
  amount: number;
  type: LedgerType;
  description?: string;
  refId?: string;
}) {
  const [row] = await db
    .insert(creditLedger)
    .values({
      walletId: e.walletId,
      tenantId: e.tenantId,
      amount: String(e.amount),
      type: e.type,
      description: e.description ?? null,
      refId: e.refId ?? null,
    })
    .returning();
  return row;
}

export async function walletBalance(walletId: string): Promise<number> {
  const [r] = await db
    .select({ total: sql<string>`coalesce(sum(${creditLedger.amount}), 0)` })
    .from(creditLedger)
    .where(eq(creditLedger.walletId, walletId));
  return Math.round(parseFloat(r.total) * 100) / 100;
}

export async function ledgerEntries(walletId: string) {
  return db
    .select()
    .from(creditLedger)
    .where(eq(creditLedger.walletId, walletId))
    .orderBy(desc(creditLedger.createdAt), desc(creditLedger.id));
}
```

- [ ] **Step 4: Run — expect PASS (3 tests).**

- [ ] **Step 5: Commit**

```bash
git add src/billing/ledger.ts tests/billing/ledger.test.ts
git commit -m "feat: credit ledger with SQL-summed balance"
```

---

### Task 4: Wallet + $50 bonus on account creation

**Files:** Create `src/billing/wallet.ts`, `tests/billing/wallet.test.ts`; modify `src/auth/users.ts`

- [ ] **Step 1: Write `tests/billing/wallet.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { getWalletForUser, ensureWalletWithBonus, grantCredits } from "@/src/billing/wallet";
import { walletBalance } from "@/src/billing/ledger";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let tA: string;
beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
});

describe("wallet + bonus", () => {
  it("creating a customer yields a wallet with the per-tenant bonus", async () => {
    const u = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c@roofers.co", role: "customer", tempPassword: "x" });
    const wallet = await getWalletForUser(u.id);
    expect(wallet).not.toBeNull();
    expect(await walletBalance(wallet!.id)).toBe(50);
  });

  it("does NOT create a wallet for a manager", async () => {
    const m = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "m@roofers.co", role: "manager", tempPassword: "x" });
    expect(await getWalletForUser(m.id)).toBeNull();
  });

  it("ensureWalletWithBonus is idempotent", async () => {
    const u = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c2@roofers.co", role: "customer", tempPassword: "x" });
    const again = await ensureWalletWithBonus(u.id);
    const wallet = await getWalletForUser(u.id);
    expect(again.id).toBe(wallet!.id);
    expect(await walletBalance(wallet!.id)).toBe(50); // not doubled
  });

  it("grantCredits adds and subtracts", async () => {
    const u = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c3@roofers.co", role: "customer", tempPassword: "x" });
    const w = await getWalletForUser(u.id);
    await grantCredits(w!.id, 25, "promo");
    await grantCredits(w!.id, -5, "correction");
    expect(await walletBalance(w!.id)).toBe(70);
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Write `src/billing/wallet.ts`**

```ts
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { wallets, users, tenants } from "../db/schema";
import { addLedgerEntry } from "./ledger";

export async function getWalletForUser(userId: string) {
  return (await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1))[0] ?? null;
}

export async function ensureWalletWithBonus(userId: string) {
  const existing = await getWalletForUser(userId);
  if (existing) return existing;

  const user = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!user) throw new Error("user not found");
  const tenant = (await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1))[0];

  const [wallet] = await db.insert(wallets).values({ tenantId: user.tenantId, userId }).returning();
  const bonus = parseFloat(tenant?.signupBonusCredits ?? "50");
  if (bonus > 0) {
    await addLedgerEntry({
      walletId: wallet.id,
      tenantId: user.tenantId,
      amount: bonus,
      type: "signup_bonus",
      description: "Signup bonus",
    });
  }
  return wallet;
}

export async function grantCredits(walletId: string, amount: number, description: string) {
  const wallet = (await db.select().from(wallets).where(eq(wallets.id, walletId)).limit(1))[0];
  if (!wallet) throw new Error("wallet not found");
  return addLedgerEntry({
    walletId,
    tenantId: wallet.tenantId,
    amount,
    type: amount >= 0 ? "admin_grant" : "adjustment",
    description,
  });
}
```

- [ ] **Step 4: Hook into `src/auth/users.ts` `createUser`**

At the top, add: `import { ensureWalletWithBonus } from "../billing/wallet";`
In `createUser`, after the `const [row] = await db.insert(users)...returning();` line and before `return row;`, add:
```ts
  if (row.role === "customer") {
    await ensureWalletWithBonus(row.id);
  }
```

- [ ] **Step 5: Run — expect PASS (4 tests).** Also run the existing auth suite to confirm no regression: `npm test -- tests/auth`

- [ ] **Step 6: Commit**

```bash
git add src/billing/wallet.ts tests/billing/wallet.test.ts src/auth/users.ts
git commit -m "feat: wallet creation + signup bonus on customer creation"
```

---

### Task 5: Coupons

**Files:** Create `src/billing/coupons.ts`, `tests/billing/coupons.test.ts`

- [ ] **Step 1: Write `tests/billing/coupons.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { createCoupon, validateCoupon, listCoupons } from "@/src/billing/coupons";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let tA: string, tB: string;
beforeEach(async () => {
  const [a] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  const [b] = await db.insert(tenants).values({ domain: "solar.co", niche: "solar", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = a.id; tB = b.id;
});

describe("coupons", () => {
  it("fixed_credits coupon yields its value as bonus", async () => {
    await createCoupon({ code: "SAVE10", kind: "fixed_credits", value: 10, tenantId: tA });
    const v = await validateCoupon("SAVE10", tA, 20);
    expect(v).toEqual({ ok: true, bonusCredits: 10 });
  });

  it("percent coupon yields a percentage of the USD amount", async () => {
    await createCoupon({ code: "PCT25", kind: "percent", value: 25, tenantId: null });
    const v = await validateCoupon("PCT25", tA, 80);
    expect(v).toEqual({ ok: true, bonusCredits: 20 });
  });

  it("rejects inactive, expired, over-max, and wrong-tenant", async () => {
    await createCoupon({ code: "OFF", kind: "fixed_credits", value: 5, active: false });
    expect((await validateCoupon("OFF", tA, 10)).ok).toBe(false);

    await createCoupon({ code: "OLD", kind: "fixed_credits", value: 5, expiresAt: new Date(Date.now() - 1000) });
    expect((await validateCoupon("OLD", tA, 10)).ok).toBe(false);

    await createCoupon({ code: "ONCE", kind: "fixed_credits", value: 5, maxRedemptions: 0 });
    expect((await validateCoupon("ONCE", tA, 10)).ok).toBe(false);

    await createCoupon({ code: "BONLY", kind: "fixed_credits", value: 5, tenantId: tB });
    expect((await validateCoupon("BONLY", tA, 10)).ok).toBe(false);
  });

  it("rejects an unknown code", async () => {
    expect((await validateCoupon("NOPE", tA, 10)).ok).toBe(false);
  });

  it("lists coupons", async () => {
    await createCoupon({ code: "L1", kind: "fixed_credits", value: 5 });
    expect((await listCoupons()).length).toBe(1);
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Write `src/billing/coupons.ts`**

```ts
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { coupons } from "../db/schema";

export type CouponValidation =
  | { ok: true; bonusCredits: number }
  | { ok: false; reason: string };

export async function createCoupon(input: {
  code: string;
  kind: "percent" | "fixed_credits";
  value: number;
  tenantId?: string | null;
  maxRedemptions?: number | null;
  expiresAt?: Date | null;
  active?: boolean;
}) {
  const [row] = await db
    .insert(coupons)
    .values({
      code: input.code,
      kind: input.kind,
      value: String(input.value),
      tenantId: input.tenantId ?? null,
      maxRedemptions: input.maxRedemptions ?? null,
      expiresAt: input.expiresAt ?? null,
      active: input.active ?? true,
    })
    .returning();
  return row;
}

export async function listCoupons(tenantId?: string) {
  const rows = await db.select().from(coupons);
  return tenantId ? rows.filter((c) => c.tenantId === tenantId || c.tenantId === null) : rows;
}

export async function validateCoupon(
  code: string,
  tenantId: string,
  amountUsd: number,
): Promise<CouponValidation> {
  const c = (await db.select().from(coupons).where(eq(coupons.code, code)).limit(1))[0];
  if (!c) return { ok: false, reason: "not found" };
  if (!c.active) return { ok: false, reason: "inactive" };
  if (c.expiresAt && c.expiresAt.getTime() <= Date.now()) return { ok: false, reason: "expired" };
  if (c.maxRedemptions != null && c.timesRedeemed >= c.maxRedemptions) {
    return { ok: false, reason: "max redemptions reached" };
  }
  if (c.tenantId && c.tenantId !== tenantId) return { ok: false, reason: "wrong tenant" };

  const value = parseFloat(c.value);
  const bonusCredits =
    c.kind === "fixed_credits"
      ? value
      : Math.round(((amountUsd * value) / 100) * 100) / 100;
  return { ok: true, bonusCredits };
}
```

- [ ] **Step 4: Run — expect PASS (6 tests).**

- [ ] **Step 5: Commit**

```bash
git add src/billing/coupons.ts tests/billing/coupons.test.ts
git commit -m "feat: coupon create/validate/list"
```

---

### Task 6: Payment provider interface + manual provider

**Files:** Create `src/billing/provider.ts`, `tests/billing/provider.test.ts`

- [ ] **Step 1: Write `tests/billing/provider.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { manualProvider, getProvider } from "@/src/billing/provider";

describe("payment provider", () => {
  it("manual provider returns kind=manual with no redirect", async () => {
    expect(await manualProvider.startTopup({ id: "p1", amountUsd: 20 })).toEqual({ kind: "manual" });
  });

  it("getProvider falls back to manual for stripe/paypal until wired", () => {
    expect(getProvider("manual")).toBe(manualProvider);
    expect(getProvider("stripe")).toBe(manualProvider);
    expect(getProvider("paypal")).toBe(manualProvider);
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Write `src/billing/provider.ts`**

```ts
export interface TopupStart {
  kind: "manual" | "redirect";
  url?: string;
}

export interface PaymentProvider {
  startTopup(payment: { id: string; amountUsd: number }): Promise<TopupStart>;
}

export const manualProvider: PaymentProvider = {
  async startTopup() {
    return { kind: "manual" };
  },
};

/**
 * Returns the provider implementation. Stripe/PayPal are not wired yet (no keys),
 * so they fall back to the manual provider. When wired, return their adapters here.
 */
export function getProvider(_name: "manual" | "stripe" | "paypal"): PaymentProvider {
  return manualProvider;
}
```

- [ ] **Step 4: Run — expect PASS (2 tests).**

- [ ] **Step 5: Commit**

```bash
git add src/billing/provider.ts tests/billing/provider.test.ts
git commit -m "feat: payment provider interface + manual provider"
```

---

### Task 7: Top-up + confirm (idempotent)

**Files:** Create `src/billing/topup.ts`, `tests/billing/topup.test.ts`

- [ ] **Step 1: Write `tests/billing/topup.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { tenants, coupons } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { getWalletForUser } from "@/src/billing/wallet";
import { walletBalance } from "@/src/billing/ledger";
import { createTopup, confirmPayment, listPendingPayments } from "@/src/billing/topup";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let tA: string, walletId: string;
beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
  const u = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c@roofers.co", role: "customer", tempPassword: "x" });
  walletId = (await getWalletForUser(u.id))!.id;
});

describe("top-up + confirm", () => {
  it("creates a pending payment and does not change the balance until confirmed", async () => {
    const { payment, start } = await createTopup(walletId, 20);
    expect(start.kind).toBe("manual");
    expect(payment.status).toBe("pending");
    expect(Number(payment.credits)).toBe(20);
    expect(await walletBalance(walletId)).toBe(50); // unchanged
    expect((await listPendingPayments(tA)).length).toBe(1);
  });

  it("applies a fixed-credits coupon to the credited amount", async () => {
    await db.insert(coupons).values({ code: "PLUS10", kind: "fixed_credits", value: "10" });
    const { payment } = await createTopup(walletId, 20, "PLUS10");
    expect(Number(payment.credits)).toBe(30);
    await confirmPayment(payment.id);
    expect(await walletBalance(walletId)).toBe(80); // 50 + 30
  });

  it("confirm is idempotent — double confirm credits once", async () => {
    const { payment } = await createTopup(walletId, 20);
    await confirmPayment(payment.id);
    await confirmPayment(payment.id);
    expect(await walletBalance(walletId)).toBe(70); // 50 + 20, not 90
    const p = (await db.select().from(coupons)); // no-op import use guard
    expect(p.length).toBe(0);
  });

  it("confirming increments coupon redemptions exactly once", async () => {
    await db.insert(coupons).values({ code: "ONCE5", kind: "fixed_credits", value: "5", maxRedemptions: 1 });
    const { payment } = await createTopup(walletId, 10, "ONCE5");
    await confirmPayment(payment.id);
    await confirmPayment(payment.id);
    const c = (await db.select().from(coupons).where(eq(coupons.code, "ONCE5")))[0];
    expect(c.timesRedeemed).toBe(1);
  });

  it("rejects a top-up with an invalid coupon", async () => {
    await expect(createTopup(walletId, 20, "NOPE")).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Write `src/billing/topup.ts`**

```ts
import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { payments, creditLedger, coupons, wallets } from "../db/schema";
import { validateCoupon } from "./coupons";
import { getProvider } from "./provider";

export async function createTopup(walletId: string, amountUsd: number, couponCode?: string) {
  const wallet = (await db.select().from(wallets).where(eq(wallets.id, walletId)).limit(1))[0];
  if (!wallet) throw new Error("wallet not found");

  let credits = amountUsd;
  let appliedCoupon: string | null = null;
  if (couponCode) {
    const v = await validateCoupon(couponCode, wallet.tenantId, amountUsd);
    if (!v.ok) throw new Error(`coupon: ${v.reason}`);
    credits += v.bonusCredits;
    appliedCoupon = couponCode;
  }

  const [payment] = await db
    .insert(payments)
    .values({
      tenantId: wallet.tenantId,
      walletId,
      provider: "manual",
      amountUsd: String(amountUsd),
      credits: String(credits),
      couponCode: appliedCoupon,
      status: "pending",
    })
    .returning();

  const start = await getProvider("manual").startTopup({ id: payment.id, amountUsd });
  return { payment, start };
}

/** Idempotent: flips pending → paid, writes the topup ledger entry, bumps coupon redemptions once. */
export async function confirmPayment(paymentId: string) {
  return db.transaction(async (tx) => {
    const p = (
      await tx.select().from(payments).where(eq(payments.id, paymentId)).limit(1).for("update")
    )[0];
    if (!p) throw new Error("payment not found");
    if (p.status === "paid") return p; // no-op on double confirm

    await tx.update(payments).set({ status: "paid", paidAt: new Date() }).where(eq(payments.id, paymentId));
    await tx.insert(creditLedger).values({
      walletId: p.walletId,
      tenantId: p.tenantId,
      amount: p.credits,
      type: "topup",
      description: "Top-up",
      refId: p.id,
    });
    if (p.couponCode) {
      const c = (await tx.select().from(coupons).where(eq(coupons.code, p.couponCode)).limit(1))[0];
      if (c) {
        await tx.update(coupons).set({ timesRedeemed: c.timesRedeemed + 1 }).where(eq(coupons.id, c.id));
      }
    }
    return { ...p, status: "paid" as const };
  });
}

export async function listPendingPayments(tenantId?: string) {
  const rows = await db.select().from(payments).where(eq(payments.status, "pending"));
  return tenantId ? rows.filter((p) => p.tenantId === tenantId) : rows;
}

export async function paymentsByTenant() {
  const rows = await db.select().from(payments);
  const byTenant = new Map<string, { count: number; usd: number }>();
  for (const p of rows) {
    if (p.status !== "paid") continue;
    const cur = byTenant.get(p.tenantId) ?? { count: 0, usd: 0 };
    cur.count += 1;
    cur.usd += parseFloat(p.amountUsd);
    byTenant.set(p.tenantId, cur);
  }
  return [...byTenant.entries()].map(([tenantId, v]) => ({ tenantId, ...v }));
}
```

- [ ] **Step 4: Run — expect PASS (5 tests).**

- [ ] **Step 5: Commit**

```bash
git add src/billing/topup.ts tests/billing/topup.test.ts
git commit -m "feat: top-up creation + idempotent confirm"
```

---

### Task 8: Customer billing UI

**Files:** Create `app/billing/page.tsx`, `app/billing/actions.ts`, `app/billing/TopUpForm.tsx`; modify `app/dashboard/page.tsx`

- [ ] **Step 1: Write `app/billing/actions.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/src/auth/guard";
import { getWalletForUser, ensureWalletWithBonus } from "@/src/billing/wallet";
import { createTopup } from "@/src/billing/topup";

export async function topUpAction(_prev: unknown, formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  const ctx = await requireAuth(["customer"]);
  const amount = Number(formData.get("amount") ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a positive amount." };
  const couponCode = String(formData.get("coupon") ?? "").trim() || undefined;
  const wallet = (await getWalletForUser(ctx.user.id)) ?? (await ensureWalletWithBonus(ctx.user.id));
  try {
    await createTopup(wallet.id, amount, couponCode);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/billing");
  return { ok: true };
}
```

- [ ] **Step 2: Write `app/billing/TopUpForm.tsx`**

```tsx
"use client";
import { useActionState } from "react";
import { topUpAction } from "./actions";

export function TopUpForm() {
  const [state, action, pending] = useActionState(topUpAction, {});
  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-2">
      <input name="amount" type="number" min="1" step="1" placeholder="USD amount" required className="rounded border p-2" />
      <input name="coupon" placeholder="coupon (optional)" className="rounded border p-2" />
      <button disabled={pending} className="rounded bg-black px-3 py-2 text-white">{pending ? "Submitting…" : "Add credits"}</button>
      {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      {state?.ok && <span className="text-sm text-green-700">Top-up requested — pending confirmation.</span>}
    </form>
  );
}
```

- [ ] **Step 3: Write `app/billing/page.tsx`**

```tsx
import { requireAuth } from "@/src/auth/guard";
import { getWalletForUser, ensureWalletWithBonus } from "@/src/billing/wallet";
import { walletBalance, ledgerEntries } from "@/src/billing/ledger";
import { listPendingPayments } from "@/src/billing/topup";
import { TopUpForm } from "./TopUpForm";

export default async function BillingPage() {
  const ctx = await requireAuth(["customer"]);
  const wallet = (await getWalletForUser(ctx.user.id)) ?? (await ensureWalletWithBonus(ctx.user.id));
  const balance = await walletBalance(wallet.id);
  const entries = await ledgerEntries(wallet.id);
  const pending = (await listPendingPayments(ctx.user.tenantId)).filter((p) => p.walletId === wallet.id);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold">Credits</h1>
      <p className="mt-2 text-3xl font-bold">{balance} <span className="text-base font-normal opacity-60">credits</span></p>

      <h2 className="mt-6 font-semibold">Add credits</h2>
      <TopUpForm />

      {pending.length > 0 && (
        <p className="mt-3 text-sm opacity-70">{pending.length} top-up(s) awaiting confirmation.</p>
      )}

      <h2 className="mt-8 font-semibold">History</h2>
      <ul className="mt-2 divide-y text-sm">
        {entries.map((e) => (
          <li key={e.id} className="flex justify-between py-1">
            <span>{e.description ?? e.type}</span>
            <span className={Number(e.amount) < 0 ? "text-red-600" : "text-green-700"}>{Number(e.amount)}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 4: Link from `app/dashboard/page.tsx`**

After the "Logged in as …" paragraph, add:
```tsx
        <a href="/billing" className="mt-3 inline-block text-sm underline">→ Credits & billing</a>
```

- [ ] **Step 5: Verify build** — `npm run build` — success; `/billing` in the route list.

- [ ] **Step 6: Commit**

```bash
git add app/billing app/dashboard/page.tsx
git commit -m "feat: customer billing page (balance, top-up, history)"
```

---

### Task 9: Admin billing UI

**Files:** Create `app/admin/billing/page.tsx`, `app/admin/billing/actions.ts`; modify `app/admin/page.tsx`

- [ ] **Step 1: Write `app/admin/billing/actions.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { payments } from "@/src/db/schema";
import { requireAuth } from "@/src/auth/guard";
import { confirmPayment } from "@/src/billing/topup";
import { grantCredits } from "@/src/billing/wallet";
import { createCoupon } from "@/src/billing/coupons";

export async function markPaidAction(formData: FormData) {
  const ctx = await requireAuth(["god", "manager"]);
  const paymentId = String(formData.get("paymentId") ?? "");
  const p = (await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1))[0];
  if (p && (ctx.user.role === "god" || p.tenantId === ctx.user.tenantId)) {
    await confirmPayment(paymentId);
  }
  revalidatePath("/admin/billing");
}

export async function grantCreditsAction(formData: FormData) {
  await requireAuth(["god", "manager"]);
  const walletId = String(formData.get("walletId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  if (walletId && Number.isFinite(amount) && amount !== 0) {
    await grantCredits(walletId, amount, String(formData.get("description") ?? "Admin grant"));
  }
  revalidatePath("/admin/billing");
}

export async function createCouponAction(formData: FormData) {
  await requireAuth(["god", "manager"]);
  const code = String(formData.get("code") ?? "").trim();
  const kind = String(formData.get("kind") ?? "fixed_credits") as "percent" | "fixed_credits";
  const value = Number(formData.get("value") ?? 0);
  if (code && value > 0) await createCoupon({ code, kind, value });
  revalidatePath("/admin/billing");
}
```

- [ ] **Step 2: Write `app/admin/billing/page.tsx`**

```tsx
import { requireAuth } from "@/src/auth/guard";
import { tenantFilter } from "@/src/tenant/scope";
import { listPendingPayments, paymentsByTenant } from "@/src/billing/topup";
import { listCoupons } from "@/src/billing/coupons";
import { markPaidAction, grantCreditsAction, createCouponAction } from "./actions";

export default async function AdminBillingPage() {
  const ctx = await requireAuth(["god", "manager"]);
  const scope = tenantFilter({ role: ctx.user.role, tenantId: ctx.user.tenantId });
  const pending = await listPendingPayments(scope ?? undefined);
  const revenue = (await paymentsByTenant()).filter((r) => scope === null || r.tenantId === scope);
  const coupons = await listCoupons(scope ?? undefined);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold">Billing</h1>

      <h2 className="mt-6 font-semibold">Pending top-ups</h2>
      <ul className="mt-2 space-y-2 text-sm">
        {pending.map((p) => (
          <li key={p.id} className="flex items-center gap-3">
            <span>${Number(p.amountUsd)} → {Number(p.credits)} credits {p.couponCode ? `(${p.couponCode})` : ""}</span>
            <form action={markPaidAction}><input type="hidden" name="paymentId" value={p.id} /><button className="rounded border px-2 py-1">Mark paid</button></form>
          </li>
        ))}
        {pending.length === 0 && <li className="opacity-60">none</li>}
      </ul>

      <h2 className="mt-8 font-semibold">Grant credits</h2>
      <form action={grantCreditsAction} className="mt-2 flex flex-wrap gap-2">
        <input name="walletId" placeholder="wallet id" required className="rounded border p-2" />
        <input name="amount" type="number" step="0.01" placeholder="credits (+/-)" required className="rounded border p-2" />
        <input name="description" placeholder="note" className="rounded border p-2" />
        <button className="rounded bg-black px-3 py-2 text-white">Grant</button>
      </form>

      <h2 className="mt-8 font-semibold">Coupons</h2>
      <form action={createCouponAction} className="mt-2 flex flex-wrap gap-2">
        <input name="code" placeholder="CODE" required className="rounded border p-2" />
        <select name="kind" className="rounded border p-2"><option value="fixed_credits">fixed_credits</option><option value="percent">percent</option></select>
        <input name="value" type="number" step="0.01" placeholder="value" required className="rounded border p-2" />
        <button className="rounded bg-black px-3 py-2 text-white">Create</button>
      </form>
      <ul className="mt-2 text-sm">
        {coupons.map((c) => <li key={c.id}>{c.code} — {c.kind} {Number(c.value)} (used {c.timesRedeemed})</li>)}
      </ul>

      <h2 className="mt-8 font-semibold">Revenue by tenant (paid)</h2>
      <ul className="mt-2 text-sm">
        {revenue.map((r) => <li key={r.tenantId}>{r.tenantId}: {r.count} payments, ${r.usd}</li>)}
        {revenue.length === 0 && <li className="opacity-60">none</li>}
      </ul>
    </main>
  );
}
```

- [ ] **Step 3: Link from `app/admin/page.tsx`**

After the existing `→ Data ingestion` link, add:
```tsx
        <a href="/admin/billing" className="ml-3 inline-block text-sm underline">→ Billing</a>
```

- [ ] **Step 4: Verify build** — `npm run build` — success; `/admin/billing` in the route list.

- [ ] **Step 5: Commit**

```bash
git add app/admin/billing app/admin/page.tsx
git commit -m "feat: admin billing (confirm, grant, coupons, revenue)"
```

---

### Task 10: Integration test + full suite + build

**Files:** Create `tests/billing/flow.test.ts`

- [ ] **Step 1: Write `tests/billing/flow.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants, coupons } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { getWalletForUser, grantCredits } from "@/src/billing/wallet";
import { walletBalance } from "@/src/billing/ledger";
import { createTopup, confirmPayment } from "@/src/billing/topup";

const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
let tA: string;
beforeEach(async () => {
  const [t] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = t.id;
});

describe("billing flow", () => {
  it("bonus → coupon top-up → confirm → admin grant → adjustment", async () => {
    const u = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c@roofers.co", role: "customer", tempPassword: "x" });
    const w = (await getWalletForUser(u.id))!;
    expect(await walletBalance(w.id)).toBe(50); // bonus

    await db.insert(coupons).values({ code: "GET10", kind: "fixed_credits", value: "10" });
    const { payment } = await createTopup(w.id, 20, "GET10");
    expect(await walletBalance(w.id)).toBe(50); // pending, unchanged
    await confirmPayment(payment.id);
    expect(await walletBalance(w.id)).toBe(80); // +30

    await grantCredits(w.id, 25, "promo");
    expect(await walletBalance(w.id)).toBe(105);
    await grantCredits(w.id, -5, "fix");
    expect(await walletBalance(w.id)).toBe(100);
  });
});
```

- [ ] **Step 2: Run the new test — expect PASS.**

- [ ] **Step 3: Full suite** — `npm test` — report file + test totals; ALL pass.

- [ ] **Step 4: Build** — `npm run build` — success.

- [ ] **Step 5: Commit**

```bash
git add tests/billing/flow.test.ts
git commit -m "test: end-to-end billing flow"
```

---

## Self-Review

**Spec coverage:**
- wallets/credit_ledger/payments/coupons schema + tenants.signup_bonus_credits → Task 1 ✓
- lead pricing → Task 2 ✓
- ledger balance (sum, incl. negatives) → Task 3 ✓
- $50 bonus on account creation (per-tenant, idempotent) + grant/comp → Task 4 ✓
- coupon validate (percent/fixed, inactive/expired/max/wrong-tenant) → Task 5 ✓
- provider interface + manual provider → Task 6 ✓
- top-up + idempotent confirm + pending list + revenue-by-tenant → Task 7 ✓
- customer billing UI → Task 8 ✓
- admin billing UI (confirm/grant/coupons/report, tenant-scoped) → Task 9 ✓
- integration + suite + build → Task 10 ✓
- Deferred (subscriptions/recurring → 5b; real Stripe/PayPal adapters; per-lead debit → Phase 6) → not in plan, correct ✓

**Placeholder scan:** No TBD/TODO; every code step complete. The Task 7 test line `const p = (await db.select().from(coupons)); expect(p.length).toBe(0)` intentionally asserts no coupon was created in that test (guards the no-coupon path), not a placeholder.

**Type consistency:** `LedgerType`, `CouponValidation`, `PaymentProvider`/`TopupStart`, `AgeTier` used consistently. `addLedgerEntry`/`walletBalance`/`ledgerEntries`/`getWalletForUser`/`ensureWalletWithBonus`/`grantCredits`/`validateCoupon`/`createCoupon`/`listCoupons`/`getProvider`/`manualProvider`/`createTopup`/`confirmPayment`/`listPendingPayments`/`paymentsByTenant`/`leadPrice` names match across definitions, UI, and tests. Numeric columns are written as strings and read via `Number()/parseFloat` consistently.

---

## What Phase 5a delivers

A working credit economy: every new customer gets a $50 (per-tenant) wallet; customers request top-ups (with optional coupons) that an admin confirms to credit the ledger; admins grant/comp credits and create coupons; revenue is reported per tenant; and lead pricing by age tier is ready for Phase 6 to debit — all behind a payment-provider interface so Stripe/PayPal slot in without rework. Covered by tests.
