# Foundation Phase 1 — Multi-Tenant Chassis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Next.js + Postgres application that resolves the current white-label by hostname and renders roofers.co themed entirely from per-tenant config, deployable to the Vultr box.

**Architecture:** One Next.js (App Router, TypeScript) app on Node runtime, one Postgres database accessed through Drizzle ORM. A `tenants` table holds each white-label's config (domain, theme, offers, money-word, footer). A server-side resolver maps the request `Host` header to a tenant (with an in-memory TTL cache); the root layout injects that tenant's theme as CSS variables and the landing page renders its config. This is the reusable chassis every future niche clones — niche #2 is a new `tenants` row, not new code.

**Tech Stack:** Next.js 15 (App Router, TS), Postgres, Drizzle ORM + `pg`, drizzle-kit migrations, Tailwind CSS v4 (CSS-variable theming), Vitest (unit + integration tests against a real test Postgres).

**Scope note:** The row-level `tenant_id` scoping helper from the spec is intentionally **deferred to Plan 2/3**, when the first tenant-scoped table (users/leads) exists and the helper can be properly tested. Plan 1's only table, `tenants`, is global by design.

---

## File Structure

```
r0cketship/
├── package.json                  # deps + scripts
├── tsconfig.json                 # TS config, @/ path alias
├── next.config.ts                # Next config (Node runtime)
├── postcss.config.mjs            # Tailwind v4 postcss
├── vitest.config.ts              # Vitest config + setup
├── drizzle.config.ts             # drizzle-kit migration config
├── .env.example                  # documented env vars (committed)
├── .env.local                    # real local env (gitignored)
├── .env.test                     # test DB env (gitignored)
├── app/
│   ├── layout.tsx                # root layout, injects tenant theme as CSS vars
│   ├── page.tsx                  # landing — renders tenant money-word/offers/footer
│   ├── globals.css               # Tailwind import + base theme vars
│   └── api/health/route.ts       # health check (DB ping)
├── src/
│   ├── db/
│   │   ├── client.ts             # drizzle client from DATABASE_URL
│   │   ├── schema.ts             # tenants pgTable
│   │   └── seed.ts               # seeds roofers.co + r0cketship God tenant
│   └── tenant/
│       ├── types.ts              # Tenant, TenantTheme, Offer types
│       ├── repo.ts               # getTenantByHost (DB query, host normalization)
│       ├── cache.ts              # resolveTenant: cached wrapper over repo
│       └── context.ts            # getCurrentTenant() from request headers
├── drizzle/                      # generated SQL migrations
└── tests/
    ├── setup.ts                  # test DB migrate + truncate helpers
    ├── tenant/repo.test.ts
    ├── tenant/cache.test.ts
    └── tenant/context.test.ts
```

---

## Prerequisites

A local Postgres must be reachable for tests and dev. The engineer should have two databases: `r0cketship_dev` and `r0cketship_test`. On the Vultr box, Postgres runs locally and `DATABASE_URL` points at it.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`

- [ ] **Step 1: Initialize package.json and install dependencies**

Run from the project root (`/Users/jeffcline/Desktop/r0cketship`):

```bash
npm init -y
npm install next@15 react@19 react-dom@19 drizzle-orm pg
npm install -D typescript @types/react @types/react-dom @types/node @types/pg \
  drizzle-kit vitest dotenv tailwindcss @tailwindcss/postcss postcss tsx
```

- [ ] **Step 2: Write `package.json` scripts**

Replace the `"scripts"` block in `package.json` with:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:seed": "tsx src/db/seed.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Write `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Node runtime so server code can reach Postgres directly.
  serverExternalPackages: ["pg"],
};

export default nextConfig;
```

- [ ] **Step 5: Write `postcss.config.mjs`**

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

- [ ] **Step 6: Write `app/globals.css`**

```css
@import "tailwindcss";

/* Default theme tokens. Per-tenant values override these on <html> at runtime. */
:root {
  --color-primary: #1f2937;
  --color-secondary: #374151;
  --color-accent: #2563eb;
  --color-background: #ffffff;
  --color-foreground: #111827;
  --font-family: system-ui, sans-serif;
}

body {
  background: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-family);
}
```

- [ ] **Step 7: Write a minimal `app/layout.tsx` (replaced in Task 8)**

```tsx
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 8: Write a placeholder `app/page.tsx` (replaced in Task 9)**

```tsx
export default function Page() {
  return <main className="p-8 text-2xl">R0cketShip chassis online</main>;
}
```

- [ ] **Step 9: Verify the app builds and boots**

Run: `npm run build`
Expected: build completes with no errors.

Run: `npm run dev` then open `http://localhost:3000`
Expected: page shows "R0cketShip chassis online". Stop the dev server.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind v4"
```

---

### Task 2: Database client and env config

**Files:**
- Create: `.env.example`, `.env.local`, `.env.test`, `src/db/client.ts`, `drizzle.config.ts`

- [ ] **Step 1: Write `.env.example` (committed, documents required vars)**

```bash
# Postgres connection for the app (dev points at r0cketship_dev)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/r0cketship_dev
# For local multi-tenant testing: which tenant a bare localhost request resolves to
DEFAULT_TENANT_DOMAIN=roofers.co
```

- [ ] **Step 2: Create local env files (gitignored — confirm `.env` is in `.gitignore`)**

`.env.local`:
```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/r0cketship_dev
DEFAULT_TENANT_DOMAIN=roofers.co
```

`.env.test`:
```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/r0cketship_test
DEFAULT_TENANT_DOMAIN=roofers.co
```

Confirm `.gitignore` already contains `.env` and `.env.local` (it does from project init). Add `.env.test`:

```bash
echo ".env.test" >> .gitignore
```

- [ ] **Step 3: Create the dev and test databases**

```bash
createdb r0cketship_dev
createdb r0cketship_test
```
Expected: both commands succeed (or "already exists").

- [ ] **Step 4: Write `src/db/client.ts`**

```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
```

- [ ] **Step 5: Write `drizzle.config.ts`**

```ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Postgres client and drizzle config"
```

---

### Task 3: Tenant schema, types, and first migration

**Files:**
- Create: `src/tenant/types.ts`, `src/db/schema.ts`

- [ ] **Step 1: Write `src/tenant/types.ts`**

```ts
export interface Offer {
  id: number;
  title: string;
  description: string;
  /** Display price string, e.g. "$1,500/mo per ZIP". */
  price: string;
}

export interface TenantTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  fontFamily: string;
}

export type PaymentProvider = "stripe" | "paypal";
export type TenantStatus = "active" | "inactive";

export interface Tenant {
  id: string;
  domain: string;
  ip: string | null;
  niche: string;
  moneyWord: string;
  logoUrl: string | null;
  theme: TenantTheme;
  offers: Offer[];
  /** Default monthly subscription price for one ZIP, as a decimal string. */
  monthlyPriceDefault: string;
  footerHtml: string;
  activePaymentProvider: PaymentProvider;
  status: TenantStatus;
}
```

- [ ] **Step 2: Write `src/db/schema.ts`**

```ts
import {
  pgTable,
  uuid,
  text,
  jsonb,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";
import type { TenantTheme, Offer } from "../tenant/types";

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  domain: text("domain").notNull().unique(),
  ip: text("ip"),
  niche: text("niche").notNull(),
  moneyWord: text("money_word").notNull(),
  logoUrl: text("logo_url"),
  theme: jsonb("theme").$type<TenantTheme>().notNull(),
  offers: jsonb("offers").$type<Offer[]>().notNull(),
  monthlyPriceDefault: numeric("monthly_price_default").notNull(),
  footerHtml: text("footer_html").notNull().default(""),
  activePaymentProvider: text("active_payment_provider", {
    enum: ["stripe", "paypal"],
  })
    .notNull()
    .default("stripe"),
  status: text("status", { enum: ["active", "inactive"] })
    .notNull()
    .default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

- [ ] **Step 3: Generate the migration**

Run: `npm run db:generate`
Expected: a new SQL file appears under `drizzle/` creating the `tenants` table.

- [ ] **Step 4: Apply the migration to the dev DB**

Run: `npm run db:migrate`
Expected: migration applies, no errors.

- [ ] **Step 5: Verify the table exists**

Run: `psql r0cketship_dev -c "\d tenants"`
Expected: table description lists columns `id, domain, ip, niche, money_word, logo_url, theme, offers, monthly_price_default, footer_html, active_payment_provider, status, created_at`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add tenants schema and migration"
```

---

### Task 4: Test harness + `getTenantByHost` repository (TDD)

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`, `src/tenant/repo.ts`, `tests/tenant/repo.test.ts`

- [ ] **Step 1: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["dotenv/config", "./tests/setup.ts"],
    env: { NODE_ENV: "test" },
    fileParallelism: false,
  },
  resolve: {
    alias: { "@": resolve(__dirname) },
  },
});
```

Note: tests load `.env.test` by running with `DOTENV_CONFIG_PATH`. Add a `pretest` guard by setting the path in the test script. Update `package.json` test scripts:

```json
{
  "test": "DOTENV_CONFIG_PATH=.env.test vitest run",
  "test:watch": "DOTENV_CONFIG_PATH=.env.test vitest"
}
```

- [ ] **Step 2: Write `tests/setup.ts` (migrates + truncates the test DB)**

```ts
import { beforeAll, afterEach, afterAll } from "vitest";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@/src/db/client";

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "./drizzle" });
});

afterEach(async () => {
  await pool.query("TRUNCATE TABLE tenants RESTART IDENTITY CASCADE");
});

afterAll(async () => {
  await pool.end();
});
```

- [ ] **Step 3: Write the failing test `tests/tenant/repo.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { getTenantByHost } from "@/src/tenant/repo";
import type { TenantTheme, Offer } from "@/src/tenant/types";

const theme: TenantTheme = {
  primary: "#0a3d62",
  secondary: "#3c6382",
  accent: "#e58e26",
  background: "#ffffff",
  foreground: "#0b132b",
  fontFamily: "system-ui, sans-serif",
};
const offers: Offer[] = [
  { id: 1, title: "Data / Leads", description: "New leads in your ZIP", price: "$1,500/mo per ZIP" },
];

async function insertRoofers() {
  await db.insert(tenants).values({
    domain: "roofers.co",
    niche: "roofing",
    moneyWord: "roofing leads",
    theme,
    offers,
    monthlyPriceDefault: "1500",
  });
}

describe("getTenantByHost", () => {
  it("returns the tenant for an exact domain match", async () => {
    await insertRoofers();
    const t = await getTenantByHost("roofers.co");
    expect(t?.domain).toBe("roofers.co");
    expect(t?.moneyWord).toBe("roofing leads");
    expect(t?.offers[0].price).toBe("$1,500/mo per ZIP");
  });

  it("normalizes host: strips port, www, and casing", async () => {
    await insertRoofers();
    expect((await getTenantByHost("WWW.Roofers.co:3000"))?.domain).toBe("roofers.co");
  });

  it("returns null for an unknown host", async () => {
    expect(await getTenantByHost("unknown.example")).toBeNull();
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm test -- tests/tenant/repo.test.ts`
Expected: FAIL — `getTenantByHost` is not defined / module not found.

- [ ] **Step 5: Write `src/tenant/repo.ts`**

```ts
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { tenants } from "../db/schema";
import type { Tenant } from "./types";

/** Lowercase, strip port and a leading "www.". */
export function normalizeHost(host: string): string {
  return host
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/^www\./, "")
    .trim();
}

export async function getTenantByHost(host: string): Promise<Tenant | null> {
  const domain = normalizeHost(host);
  const rows = await db
    .select()
    .from(tenants)
    .where(eq(tenants.domain, domain))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    domain: row.domain,
    ip: row.ip,
    niche: row.niche,
    moneyWord: row.moneyWord,
    logoUrl: row.logoUrl,
    theme: row.theme,
    offers: row.offers,
    monthlyPriceDefault: row.monthlyPriceDefault,
    footerHtml: row.footerHtml,
    activePaymentProvider: row.activePaymentProvider,
    status: row.status,
  };
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- tests/tenant/repo.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: getTenantByHost repository with host normalization + tests"
```

---

### Task 5: Cached tenant resolver (TDD)

**Files:**
- Create: `src/tenant/cache.ts`, `tests/tenant/cache.test.ts`

- [ ] **Step 1: Write the failing test `tests/tenant/cache.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import * as repo from "@/src/tenant/repo";
import { resolveTenant, clearTenantCache } from "@/src/tenant/cache";
import type { TenantTheme, Offer } from "@/src/tenant/types";

const theme: TenantTheme = {
  primary: "#0a3d62", secondary: "#3c6382", accent: "#e58e26",
  background: "#ffffff", foreground: "#0b132b", fontFamily: "system-ui",
};
const offers: Offer[] = [{ id: 1, title: "Data", description: "d", price: "$1,500/mo" }];

beforeEach(() => clearTenantCache());

async function insertRoofers() {
  await db.insert(tenants).values({
    domain: "roofers.co", niche: "roofing", moneyWord: "roofing leads",
    theme, offers, monthlyPriceDefault: "1500",
  });
}

describe("resolveTenant", () => {
  it("returns the same tenant as the repo", async () => {
    await insertRoofers();
    const t = await resolveTenant("roofers.co");
    expect(t?.domain).toBe("roofers.co");
  });

  it("caches results so the repo is not queried twice within TTL", async () => {
    await insertRoofers();
    const spy = vi.spyOn(repo, "getTenantByHost");
    await resolveTenant("roofers.co");
    await resolveTenant("roofers.co");
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/tenant/cache.test.ts`
Expected: FAIL — `resolveTenant` not defined.

- [ ] **Step 3: Write `src/tenant/cache.ts`**

```ts
import { getTenantByHost, normalizeHost } from "./repo";
import type { Tenant } from "./types";

const TTL_MS = 60_000;
type Entry = { tenant: Tenant | null; expires: number };
const cache = new Map<string, Entry>();

export function clearTenantCache(): void {
  cache.clear();
}

export async function resolveTenant(host: string): Promise<Tenant | null> {
  const key = normalizeHost(host);
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) return hit.tenant;

  const tenant = await getTenantByHost(key);
  cache.set(key, { tenant, expires: now + TTL_MS });
  return tenant;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tests/tenant/cache.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: cached tenant resolver with TTL + tests"
```

---

### Task 6: `getCurrentTenant()` from request headers (TDD)

**Files:**
- Create: `src/tenant/context.ts`, `tests/tenant/context.test.ts`

- [ ] **Step 1: Write the failing test `tests/tenant/context.test.ts`**

This tests the pure host-selection logic (which host string to resolve) without Next's `headers()`.

```ts
import { describe, it, expect } from "vitest";
import { pickHost } from "@/src/tenant/context";

describe("pickHost", () => {
  it("uses the host header when present", () => {
    expect(pickHost("roofers.co", undefined)).toBe("roofers.co");
  });

  it("falls back to DEFAULT_TENANT_DOMAIN for localhost", () => {
    expect(pickHost("localhost:3000", "roofers.co")).toBe("roofers.co");
  });

  it("falls back to DEFAULT_TENANT_DOMAIN when host is missing", () => {
    expect(pickHost(null, "roofers.co")).toBe("roofers.co");
  });

  it("returns null when neither host nor default is usable", () => {
    expect(pickHost("localhost", undefined)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/tenant/context.test.ts`
Expected: FAIL — `pickHost` not defined.

- [ ] **Step 3: Write `src/tenant/context.ts`**

```ts
import { headers } from "next/headers";
import { resolveTenant } from "./cache";
import type { Tenant } from "./types";

/**
 * Decide which host string to resolve. Real hosts win; localhost/empty fall
 * back to DEFAULT_TENANT_DOMAIN so a single dev box can render any tenant.
 */
export function pickHost(
  hostHeader: string | null,
  defaultDomain: string | undefined,
): string | null {
  const isLocal = !hostHeader || /^localhost(:\d+)?$/i.test(hostHeader);
  if (isLocal) return defaultDomain ?? null;
  return hostHeader;
}

export async function getCurrentTenant(): Promise<Tenant | null> {
  const h = await headers();
  const host = pickHost(h.get("host"), process.env.DEFAULT_TENANT_DOMAIN);
  if (!host) return null;
  return resolveTenant(host);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tests/tenant/context.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: getCurrentTenant header resolution + pickHost tests"
```

---

### Task 7: Seed roofers.co and the r0cketship God tenant

**Files:**
- Create: `src/db/seed.ts`

- [ ] **Step 1: Write `src/db/seed.ts`**

```ts
import "dotenv/config";
import { db, pool } from "./client";
import { tenants } from "./schema";
import type { TenantTheme, Offer } from "../tenant/types";

const roofersTheme: TenantTheme = {
  primary: "#0a3d62",
  secondary: "#3c6382",
  accent: "#e58e26",
  background: "#ffffff",
  foreground: "#0b132b",
  fontFamily: "system-ui, sans-serif",
};

const roofersOffers: Offer[] = [
  { id: 1, title: "Data / Leads", description: "All new high-intent leads in your ZIP, delivered daily.", price: "$1,500/mo per ZIP" },
  { id: 2, title: "Booking", description: "We email your leads and drive them to your booking link.", price: "$4,500/mo" },
  { id: 3, title: "E-Partnership", description: "Full done-for-you sales. Application only.", price: "Let's talk" },
];

const godTheme: TenantTheme = {
  primary: "#111827",
  secondary: "#1f2937",
  accent: "#6366f1",
  background: "#0b1020",
  foreground: "#e5e7eb",
  fontFamily: "system-ui, sans-serif",
};

async function seed() {
  await db
    .insert(tenants)
    .values([
      {
        domain: "roofers.co",
        ip: "137.220.56.129",
        niche: "roofing",
        moneyWord: "roofing leads",
        logoUrl: null,
        theme: roofersTheme,
        offers: roofersOffers,
        monthlyPriceDefault: "1500",
        footerHtml: "<p>roofers.co — exclusive roofing leads by ZIP.</p>",
        activePaymentProvider: "stripe",
        status: "active",
      },
      {
        domain: "r0cketship.com",
        ip: "137.220.56.129",
        niche: "platform",
        moneyWord: "business leads",
        logoUrl: null,
        theme: godTheme,
        offers: [],
        monthlyPriceDefault: "0",
        footerHtml: "<p>R0cketShip — the white-label lead engine.</p>",
        activePaymentProvider: "stripe",
        status: "active",
      },
    ])
    .onConflictDoNothing({ target: tenants.domain });

  console.log("Seeded roofers.co and r0cketship.com");
  await pool.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Run the seed against the dev DB**

Run: `npm run db:seed`
Expected: prints "Seeded roofers.co and r0cketship.com".

- [ ] **Step 3: Verify the rows exist**

Run: `psql r0cketship_dev -c "SELECT domain, money_word, monthly_price_default FROM tenants ORDER BY domain;"`
Expected: two rows — `r0cketship.com` and `roofers.co` with money words and `1500`/`0`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: seed roofers.co and r0cketship God tenant"
```

---

### Task 8: Themed root layout (inject tenant theme as CSS variables)

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace `app/layout.tsx`**

```tsx
import "./globals.css";
import { getCurrentTenant } from "@/src/tenant/context";
import type { TenantTheme } from "@/src/tenant/types";

function themeToCssVars(theme: TenantTheme): Record<string, string> {
  return {
    "--color-primary": theme.primary,
    "--color-secondary": theme.secondary,
    "--color-accent": theme.accent,
    "--color-background": theme.background,
    "--color-foreground": theme.foreground,
    "--font-family": theme.fontFamily,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getCurrentTenant();
  const style = tenant
    ? (themeToCssVars(tenant.theme) as React.CSSProperties)
    : undefined;

  return (
    <html lang="en" style={style}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Verify the theme is applied**

Run: `npm run dev`, open `http://localhost:3000` (resolves to roofers.co via `DEFAULT_TENANT_DOMAIN`).
In the browser devtools, inspect `<html>`: it should carry inline CSS variables, e.g. `--color-accent: #e58e26;`.
Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: inject per-tenant theme as CSS variables in root layout"
```

---

### Task 9: Landing page rendered from tenant config

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
import { getCurrentTenant } from "@/src/tenant/context";
import { notFound } from "next/navigation";

export default async function Page() {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();

  return (
    <main>
      <header
        className="px-8 py-16 text-center"
        style={{ background: "var(--color-primary)", color: "var(--color-background)" }}
      >
        <h1 className="text-4xl font-bold capitalize">{tenant.moneyWord}</h1>
        <p className="mt-2 opacity-80">{tenant.niche}</p>
      </header>

      <section className="mx-auto grid max-w-5xl gap-6 px-8 py-12 md:grid-cols-3">
        {tenant.offers.map((offer) => (
          <div
            key={offer.id}
            className="rounded-xl border p-6"
            style={{ borderColor: "var(--color-secondary)" }}
          >
            <h2 className="text-xl font-semibold" style={{ color: "var(--color-accent)" }}>
              {offer.title}
            </h2>
            <p className="mt-2 text-sm opacity-80">{offer.description}</p>
            <p className="mt-4 font-bold">{offer.price}</p>
          </div>
        ))}
      </section>

      <footer
        className="px-8 py-8 text-center text-sm"
        style={{ background: "var(--color-secondary)", color: "var(--color-background)" }}
        dangerouslySetInnerHTML={{ __html: tenant.footerHtml }}
      />
    </main>
  );
}
```

Note: `footerHtml` is operator-authored WYSIWYG content, rendered via `dangerouslySetInnerHTML` by design (per spec — global footer block). Sanitization of this admin-only field is added in the admin plan (Plan 5/admin), not here.

- [ ] **Step 2: Verify roofers.co renders from config**

Run: `npm run dev`, open `http://localhost:3000`.
Expected: hero shows "roofing leads", three offer cards (Data/Leads $1,500/mo per ZIP, Booking $4,500/mo, E-Partnership "Let's talk"), footer text "roofers.co — exclusive roofing leads by ZIP." Accent color on offer titles is orange (`#e58e26`).
Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: render landing page from tenant config"
```

---

### Task 10: Health endpoint (DB ping)

**Files:**
- Create: `app/api/health/route.ts`

- [ ] **Step 1: Write `app/api/health/route.ts`**

```ts
import { NextResponse } from "next/server";
import { pool } from "@/src/db/client";

export const runtime = "nodejs";

export async function GET() {
  try {
    await pool.query("SELECT 1");
    return NextResponse.json({ status: "ok", db: "up" });
  } catch {
    return NextResponse.json({ status: "error", db: "down" }, { status: 503 });
  }
}
```

- [ ] **Step 2: Verify the health check**

Run: `npm run dev`, then in another shell: `curl -s http://localhost:3000/api/health`
Expected: `{"status":"ok","db":"up"}`. Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add /api/health DB ping endpoint"
```

---

### Task 11: Integration test — different hosts render different tenants

**Files:**
- Create: `tests/tenant/multitenant.test.ts`

- [ ] **Step 1: Write the failing test `tests/tenant/multitenant.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { resolveTenant, clearTenantCache } from "@/src/tenant/cache";
import type { TenantTheme, Offer } from "@/src/tenant/types";

const offers: Offer[] = [{ id: 1, title: "Data", description: "d", price: "p" }];
function theme(accent: string): TenantTheme {
  return { primary: "#000", secondary: "#111", accent, background: "#fff", foreground: "#000", fontFamily: "sans-serif" };
}

beforeEach(async () => {
  clearTenantCache();
  await db.insert(tenants).values([
    { domain: "roofers.co", niche: "roofing", moneyWord: "roofing leads", theme: theme("#e58e26"), offers, monthlyPriceDefault: "1500" },
    { domain: "solarpros.co", niche: "solar", moneyWord: "solar leads", theme: theme("#16a34a"), offers, monthlyPriceDefault: "1200" },
  ]);
});

describe("multi-tenant resolution", () => {
  it("resolves each host to its own config and theme", async () => {
    const roofers = await resolveTenant("roofers.co");
    const solar = await resolveTenant("solarpros.co");
    expect(roofers?.moneyWord).toBe("roofing leads");
    expect(roofers?.theme.accent).toBe("#e58e26");
    expect(solar?.moneyWord).toBe("solar leads");
    expect(solar?.theme.accent).toBe("#16a34a");
    expect(solar?.monthlyPriceDefault).toBe("1200");
  });
});
```

- [ ] **Step 2: Run the test to verify it passes**

Run: `npm test -- tests/tenant/multitenant.test.ts`
Expected: PASS — proves a second niche is purely a new row (no code change), the core chassis promise.

- [ ] **Step 3: Run the full suite**

Run: `npm test`
Expected: all tests pass (repo, cache, context, multitenant).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test: multi-tenant resolution renders distinct configs"
```

---

### Task 12: Deploy notes for hermes / Vultr

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

```markdown
# R0cketShip

White-label lead-gen platform. Next.js + Postgres, one backend, many niche sites.

## Local dev
1. `createdb r0cketship_dev && createdb r0cketship_test`
2. Copy `.env.example` to `.env.local`, set `DATABASE_URL`.
3. `npm install`
4. `npm run db:migrate && npm run db:seed`
5. `npm run dev` → http://localhost:3000 (renders roofers.co via DEFAULT_TENANT_DOMAIN)

## Tests
`npm test` (requires `r0cketship_test` DB; uses `.env.test`).

## Production (Vultr, via hermes/GitHub)
- Node 20+, Postgres local to the box.
- Env: `DATABASE_URL` → local Postgres. No `DEFAULT_TENANT_DOMAIN` in prod (real Host headers resolve tenants).
- Build/run: `npm ci && npm run build && npm run db:migrate && npm run start` (port 3000).
- nginx reverse-proxies `roofers.co` and `r0cketship.com` (both pointed at 137.220.56.129) to `localhost:3000`. Tenant is resolved from the Host header.
- Run `npm run db:seed` once to create the initial tenants.
```

- [ ] **Step 2: Verify a clean production build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: add README with local dev and Vultr deploy notes"
```

---

## Self-Review

**Spec coverage (Plan 1 portion):**
- Multi-tenant chassis + hostname resolution → Tasks 4–6, 11 ✓
- Per-tenant theming (colors/logo/footer/money-word/offers from config) → Tasks 3, 8, 9 ✓
- roofers.co as the seeded template + r0cketship God tenant → Task 7 ✓
- "Niche #2 is a row, not code" proof → Task 11 ✓
- Deployable to Vultr via hermes/GitHub → Tasks 1, 10, 12 ✓
- Postgres on Vultr, fresh DB → Tasks 2, 3 ✓
- **Deferred (correctly, to later plans):** auth/roles, row-level scoping helper, ingestion, billing, marketing pages beyond landing, lead delivery. Noted in the plan header scope note.

**Placeholder scan:** No TBD/TODO; every code step contains complete, runnable code.

**Type consistency:** `Tenant`, `TenantTheme`, `Offer` defined once in `src/tenant/types.ts` and used consistently across schema, repo, cache, context, layout, page, seed, and tests. `getTenantByHost` / `resolveTenant` / `getCurrentTenant` / `pickHost` / `normalizeHost` / `clearTenantCache` names are consistent across definition and call sites.

---

## What Plan 1 delivers

A running, tested Next.js + Postgres app where `roofers.co` renders fully from its `tenants` row (money-word, three offers, theme colors, footer), `r0cketship.com` resolves as the God tenant, and adding a third niche is a single DB insert — proven by an integration test. Deployable to the Vultr box behind nginx. This is the chassis Plans 2–6 build on.
