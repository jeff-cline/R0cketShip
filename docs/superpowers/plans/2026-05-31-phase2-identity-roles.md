# Phase 2 — Identity & Roles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add custom session-based auth (email/password), three roles (god/manager/customer), forced temp-password reset, admin user management, and manager/God impersonation — all tenant-scoped — on top of the Phase 1 chassis.

**Architecture:** Core auth logic lives in `src/auth/*` as testable async functions over the DB (password hashing via Node `crypto.scrypt`, server-side sessions in Postgres, SHA-256 token hashing). Thin Next.js server actions / route handlers adapt cookies + form data to that core. Roles are a column on `users`; `god` bypasses tenant scoping. Everything is TDD'd against the test DB.

**Tech Stack:** Next.js 15 App Router server actions, Drizzle/Postgres, Node `crypto` (scrypt, sha256), Vitest.

**Environment note (same as Phase 1):** Dev/test Postgres is reached at `localhost:5432` via a **running SSH tunnel**; `npm test` loads `.env.test`, `npm run db:migrate`/`db:seed` load `.env.local`. `psql` is NOT installed locally — verify via `pg`/node. Build on branch `build/phase2-identity` off `main`.

---

## File Structure

```
src/db/schema.ts          MODIFY: add userRole/userStatus enums, users + sessions tables
src/db/seed.ts            MODIFY: seed the God account (jeff.cline@me.com / TEMP!234)
src/tenant/scope.ts       CREATE: tenantScope() row-level scoping helper
src/auth/password.ts      CREATE: hashPassword / verifyPassword (scrypt)
src/auth/session.ts       CREATE: token gen, createSession, resolveSession, destroySession, SESSION_COOKIE
src/auth/users.ts         CREATE: findUserByEmail, createUser (+authority), resetUserPassword, listUsers
src/auth/login.ts         CREATE: loginUser, roleHome
src/auth/context.ts       CREATE: getAuthContext (reads cookie), buildAuthContext (testable core), canAccess
src/auth/impersonate.ts   CREATE: startImpersonation, exitImpersonation, authorizeImpersonation
src/auth/guard.ts         CREATE: requireAuth(roles) server helper
app/login/page.tsx        CREATE: login form
app/login/actions.ts      CREATE: loginAction
app/logout/actions.ts     CREATE: logoutAction
app/account/password/page.tsx + actions.ts   CREATE: change-password form + action
app/admin/page.tsx        CREATE: god stub area (users list, create, impersonate)
app/manage/page.tsx       CREATE: manager stub area
app/dashboard/page.tsx    CREATE: customer stub area
app/_components/ImpersonationBanner.tsx       CREATE: banner + exit
tests/setup.ts            MODIFY: truncate users + sessions too
tests/auth/*.test.ts      CREATE: per-module tests
```

---

### Task 1: Schema — users + sessions tables

**Files:**
- Modify: `src/db/schema.ts`
- Modify: `tests/setup.ts`

- [ ] **Step 1: Add enums + tables to `src/db/schema.ts`**

Add these imports to the existing import from `drizzle-orm/pg-core` (it currently imports `pgTable, uuid, text, jsonb, numeric, timestamp`): add `pgEnum, boolean, uniqueIndex`. Then append:

```ts
export const userRole = pgEnum("user_role", ["god", "manager", "customer"]);
export const userStatus = pgEnum("user_status", ["active", "disabled"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").notNull(),
    mustResetPassword: boolean("must_reset_password").notNull().default(true),
    name: text("name"),
    status: userStatus("status").notNull().default("active"),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_tenant_email_uniq").on(t.tenantId, t.email)],
);

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  impersonatorUserId: uuid("impersonator_user_id"),
  returnToSessionId: uuid("return_to_session_id"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

Note: email is stored already-lowercased by application code, so a plain unique on `(tenant_id, email)` is correct.

- [ ] **Step 2: Update `tests/setup.ts` to truncate the new tables**

Change the `afterEach` TRUNCATE line to include all three tables:

```ts
afterEach(async () => {
  await pool.query("TRUNCATE TABLE tenants, users, sessions RESTART IDENTITY CASCADE");
});
```

- [ ] **Step 3: Generate the migration**

Run: `npm run db:generate`
Expected: a new SQL file under `drizzle/` creating the `user_role`/`user_status` enums and `users`/`sessions` tables.

- [ ] **Step 4: Apply to the dev DB**

Run: `npm run db:migrate`
Expected: applies with no error.

- [ ] **Step 5: Verify the tables exist (psql not installed — use node)**

```bash
DOTENV_CONFIG_PATH=.env.local node -r dotenv/config -e "const {Client}=require('pg');const c=new Client({connectionString:process.env.DATABASE_URL});c.connect().then(()=>c.query(\"select table_name from information_schema.tables where table_name in ('users','sessions') order by table_name\")).then(r=>{console.log(r.rows.map(x=>x.table_name).join(','));return c.end()}).catch(e=>{console.error(e.message);process.exit(1)})"
```
Expected: `sessions,users`

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts tests/setup.ts drizzle/
git commit -m "feat: add users and sessions schema"
```

---

### Task 2: Password hashing (`src/auth/password.ts`)

**Files:**
- Create: `src/auth/password.ts`
- Test: `tests/auth/password.test.ts`

- [ ] **Step 1: Write the failing test `tests/auth/password.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/src/auth/password";

describe("password hashing", () => {
  it("verifies a correct password", async () => {
    const enc = await hashPassword("TEMP!234");
    expect(enc.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("TEMP!234", enc)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const enc = await hashPassword("TEMP!234");
    expect(await verifyPassword("wrong", enc)).toBe(false);
  });

  it("uses a unique salt per hash", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).not.toBe(b);
  });

  it("returns false for a malformed encoded value", async () => {
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
  });
});
```

- [ ] **Step 2: Run it — expect FAIL** (`npm test -- tests/auth/password.test.ts`) — module not found.

- [ ] **Step 3: Write `src/auth/password.ts`**

```ts
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const N = 16384;
const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = (await scryptAsync(password, salt, KEYLEN, { N })) as Buffer;
  return `scrypt$${N}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const parts = encoded.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;
  const n = parseInt(parts[1], 10);
  const salt = Buffer.from(parts[2], "base64");
  const expected = Buffer.from(parts[3], "base64");
  if (!n || expected.length === 0) return false;
  const actual = (await scryptAsync(password, salt, expected.length, { N: n })) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
```

- [ ] **Step 4: Run it — expect PASS** (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/auth/password.ts tests/auth/password.test.ts
git commit -m "feat: scrypt password hashing"
```

---

### Task 3: Session core (`src/auth/session.ts`)

**Files:**
- Create: `src/auth/session.ts`
- Test: `tests/auth/session.test.ts`

- [ ] **Step 1: Write the failing test `tests/auth/session.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants, users, sessions } from "@/src/db/schema";
import { createSession, resolveSession, destroySession, hashToken } from "@/src/auth/session";

async function seedUser() {
  const [t] = await db.insert(tenants).values({
    domain: "roofers.co", niche: "roofing", moneyWord: "roofing leads",
    theme: { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "sans-serif" },
    offers: [], monthlyPriceDefault: "1500",
  }).returning();
  const [u] = await db.insert(users).values({
    tenantId: t.id, email: "owner@roofers.co", passwordHash: "x", role: "customer",
  }).returning();
  return u;
}

describe("sessions", () => {
  it("creates a session and resolves it by token", async () => {
    const u = await seedUser();
    const token = await createSession(u.id);
    const s = await resolveSession(token);
    expect(s?.userId).toBe(u.id);
  });

  it("stores only the token hash, never the raw token", async () => {
    const u = await seedUser();
    const token = await createSession(u.id);
    const rows = await db.select().from(sessions);
    expect(rows[0].tokenHash).toBe(hashToken(token));
    expect(rows[0].tokenHash).not.toBe(token);
  });

  it("returns null for an expired session and deletes it", async () => {
    const u = await seedUser();
    const token = await createSession(u.id);
    await db.update(sessions).set({ expiresAt: new Date(Date.now() - 1000) }).where(eqHelper());
    expect(await resolveSession(token)).toBeNull();
    expect((await db.select().from(sessions)).length).toBe(0);
  });

  it("destroySession removes the row", async () => {
    const u = await seedUser();
    const token = await createSession(u.id);
    await destroySession(token);
    expect(await resolveSession(token)).toBeNull();
  });
});

// helper kept inline to avoid import noise
import { sql } from "drizzle-orm";
function eqHelper() { return sql`true`; }
```

- [ ] **Step 2: Run it — expect FAIL** (module not found).

- [ ] **Step 3: Write `src/auth/session.ts`**

```ts
import { randomBytes, createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { sessions } from "../db/schema";

export const SESSION_COOKIE = "r0cket_session";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  userId: string,
  opts?: { impersonatorUserId?: string; returnToSessionId?: string },
): Promise<string> {
  const token = generateToken();
  await db.insert(sessions).values({
    userId,
    tokenHash: hashToken(token),
    impersonatorUserId: opts?.impersonatorUserId ?? null,
    returnToSessionId: opts?.returnToSessionId ?? null,
    expiresAt: new Date(Date.now() + TTL_MS),
  });
  return token;
}

export async function resolveSession(token: string) {
  const rows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.tokenHash, hashToken(token)))
    .limit(1);
  const s = rows[0];
  if (!s) return null;
  if (s.expiresAt.getTime() <= Date.now()) {
    await destroySession(token);
    return null;
  }
  return s;
}

export async function destroySession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
}
```

- [ ] **Step 4: Run it — expect PASS** (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/auth/session.ts tests/auth/session.test.ts
git commit -m "feat: server-side session create/resolve/destroy"
```

---

### Task 4: Tenant scoping helper (`src/tenant/scope.ts`)

**Files:**
- Create: `src/tenant/scope.ts`
- Test: `tests/tenant/scope.test.ts`

- [ ] **Step 1: Write the failing test `tests/tenant/scope.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { tenantFilter } from "@/src/tenant/scope";

describe("tenantFilter", () => {
  it("returns the tenantId for a non-god role", () => {
    expect(tenantFilter({ role: "manager", tenantId: "t1" })).toBe("t1");
    expect(tenantFilter({ role: "customer", tenantId: "t1" })).toBe("t1");
  });

  it("returns null (no filter / cross-tenant) for god", () => {
    expect(tenantFilter({ role: "god", tenantId: "t1" })).toBeNull();
  });
});
```

- [ ] **Step 2: Run it — expect FAIL**.

- [ ] **Step 3: Write `src/tenant/scope.ts`**

```ts
import type { userRole } from "../db/schema";

type Role = (typeof userRole.enumValues)[number];

/**
 * The tenant_id a query should be filtered by for this actor.
 * `god` returns null, meaning "no tenant filter — cross-tenant access".
 */
export function tenantFilter(actor: { role: Role; tenantId: string }): string | null {
  return actor.role === "god" ? null : actor.tenantId;
}
```

- [ ] **Step 4: Run it — expect PASS** (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/tenant/scope.ts tests/tenant/scope.test.ts
git commit -m "feat: tenant scoping helper (tenantFilter)"
```

---

### Task 5: User management core (`src/auth/users.ts`)

**Files:**
- Create: `src/auth/users.ts`
- Test: `tests/auth/users.test.ts`

- [ ] **Step 1: Write the failing test `tests/auth/users.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { findUserByEmail, createUser, resetUserPassword, listUsers, canCreateUser } from "@/src/auth/users";
import { verifyPassword } from "@/src/auth/password";

let tA: string, tB: string;
beforeEach(async () => {
  const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
  const [a] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  const [b] = await db.insert(tenants).values({ domain: "solar.co", niche: "solar", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = a.id; tB = b.id;
});

describe("createUser + authority", () => {
  it("god can create a manager in any tenant", async () => {
    const god = { role: "god" as const, tenantId: tB };
    const u = await createUser(god, { tenantId: tA, email: "Mgr@Roofers.co", role: "manager", tempPassword: "TEMP!234" });
    expect(u.email).toBe("mgr@roofers.co"); // lowercased
    expect(u.mustResetPassword).toBe(true);
    expect(await verifyPassword("TEMP!234", u.passwordHash)).toBe(true);
  });

  it("manager can create a customer in their own tenant only", async () => {
    const mgr = { role: "manager" as const, tenantId: tA };
    expect(canCreateUser(mgr, { tenantId: tA, role: "customer" })).toBe(true);
    expect(canCreateUser(mgr, { tenantId: tB, role: "customer" })).toBe(false); // other tenant
    expect(canCreateUser(mgr, { tenantId: tA, role: "manager" })).toBe(false);  // cannot create manager
    expect(canCreateUser(mgr, { tenantId: tA, role: "god" })).toBe(false);      // cannot create god
  });

  it("createUser throws when the actor lacks authority", async () => {
    const mgr = { role: "manager" as const, tenantId: tA };
    await expect(
      createUser(mgr, { tenantId: tB, email: "x@x.co", role: "customer", tempPassword: "TEMP!234" }),
    ).rejects.toThrow();
  });

  it("findUserByEmail is tenant- and case-insensitive scoped", async () => {
    const god = { role: "god" as const, tenantId: tB };
    await createUser(god, { tenantId: tA, email: "owner@roofers.co", role: "customer", tempPassword: "TEMP!234" });
    expect((await findUserByEmail(tA, "OWNER@roofers.co"))?.email).toBe("owner@roofers.co");
    expect(await findUserByEmail(tB, "owner@roofers.co")).toBeNull(); // wrong tenant
  });

  it("resetUserPassword sets a new temp password and the reset flag", async () => {
    const god = { role: "god" as const, tenantId: tB };
    const u = await createUser(god, { tenantId: tA, email: "c@roofers.co", role: "customer", tempPassword: "OLD!2345" });
    await db.update; // noop to keep import
    const updated = await resetUserPassword(god, u.id, "NEW!2345");
    expect(updated.mustResetPassword).toBe(true);
    expect(await verifyPassword("NEW!2345", updated.passwordHash)).toBe(true);
  });

  it("listUsers scopes to the actor's tenant unless god", async () => {
    const god = { role: "god" as const, tenantId: tB };
    await createUser(god, { tenantId: tA, email: "a@roofers.co", role: "customer", tempPassword: "TEMP!234" });
    await createUser(god, { tenantId: tB, email: "b@solar.co", role: "customer", tempPassword: "TEMP!234" });
    const mgrA = { role: "manager" as const, tenantId: tA };
    expect((await listUsers(mgrA)).length).toBe(1);
    expect((await listUsers(god)).length).toBe(2);
  });
});
```

- [ ] **Step 2: Run it — expect FAIL**.

- [ ] **Step 3: Write `src/auth/users.ts`**

```ts
import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { users } from "../db/schema";
import { hashPassword } from "./password";
import { tenantFilter } from "../tenant/scope";

type Role = "god" | "manager" | "customer";
export interface Actor {
  role: Role;
  tenantId: string;
}
export type UserRow = typeof users.$inferSelect;

export function canCreateUser(
  actor: Actor,
  target: { tenantId: string; role: Role },
): boolean {
  if (actor.role === "god") return target.role !== "god";
  if (actor.role === "manager") {
    return target.role === "customer" && target.tenantId === actor.tenantId;
  }
  return false;
}

export async function findUserByEmail(tenantId: string, email: string): Promise<UserRow | null> {
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.tenantId, tenantId), eq(users.email, email.toLowerCase())))
    .limit(1);
  return rows[0] ?? null;
}

export async function createUser(
  actor: Actor,
  input: { tenantId: string; email: string; role: Role; tempPassword: string; name?: string },
): Promise<UserRow> {
  if (!canCreateUser(actor, { tenantId: input.tenantId, role: input.role })) {
    throw new Error("Not authorized to create this user");
  }
  const passwordHash = await hashPassword(input.tempPassword);
  const [row] = await db
    .insert(users)
    .values({
      tenantId: input.tenantId,
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role,
      mustResetPassword: true,
      name: input.name ?? null,
      createdBy: null,
    })
    .returning();
  return row;
}

export async function resetUserPassword(actor: Actor, userId: string, tempPassword: string): Promise<UserRow> {
  const target = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!target) throw new Error("User not found");
  const filter = tenantFilter(actor);
  if (filter !== null && target.tenantId !== filter) throw new Error("Not authorized");
  const passwordHash = await hashPassword(tempPassword);
  const [row] = await db
    .update(users)
    .set({ passwordHash, mustResetPassword: true })
    .where(eq(users.id, userId))
    .returning();
  return row;
}

export async function listUsers(actor: Actor): Promise<UserRow[]> {
  const filter = tenantFilter(actor);
  if (filter === null) return db.select().from(users);
  return db.select().from(users).where(eq(users.tenantId, filter));
}
```

- [ ] **Step 4: Run it — expect PASS** (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/auth/users.ts tests/auth/users.test.ts
git commit -m "feat: user management core with authority checks"
```

---

### Task 6: Login core (`src/auth/login.ts`)

**Files:**
- Create: `src/auth/login.ts`
- Test: `tests/auth/login.test.ts`

- [ ] **Step 1: Write the failing test `tests/auth/login.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { loginUser, roleHome } from "@/src/auth/login";
import { resolveSession } from "@/src/auth/session";

let tA: string;
beforeEach(async () => {
  const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
  const [a] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = a.id;
  await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "owner@roofers.co", role: "customer", tempPassword: "TEMP!234" });
});

describe("loginUser", () => {
  it("logs in with correct credentials and creates a session", async () => {
    const r = await loginUser(tA, "owner@roofers.co", "TEMP!234");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.mustReset).toBe(true);
      expect(r.home).toBe("/dashboard");
      expect((await resolveSession(r.token))?.userId).toBeTruthy();
    }
  });

  it("fails on wrong password", async () => {
    expect((await loginUser(tA, "owner@roofers.co", "nope")).ok).toBe(false);
  });

  it("fails for a user in a different tenant", async () => {
    const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
    const [b] = await db.insert(tenants).values({ domain: "solar.co", niche: "solar", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
    expect((await loginUser(b.id, "owner@roofers.co", "TEMP!234")).ok).toBe(false);
  });

  it("roleHome maps roles to landing routes", () => {
    expect(roleHome("god")).toBe("/admin");
    expect(roleHome("manager")).toBe("/manage");
    expect(roleHome("customer")).toBe("/dashboard");
  });
});
```

- [ ] **Step 2: Run it — expect FAIL**.

- [ ] **Step 3: Write `src/auth/login.ts`**

```ts
import { findUserByEmail } from "./users";
import { verifyPassword } from "./password";
import { createSession } from "./session";

type Role = "god" | "manager" | "customer";

export function roleHome(role: Role): string {
  if (role === "god") return "/admin";
  if (role === "manager") return "/manage";
  return "/dashboard";
}

export type LoginResult =
  | { ok: true; token: string; mustReset: boolean; home: string }
  | { ok: false };

export async function loginUser(tenantId: string, email: string, password: string): Promise<LoginResult> {
  const user = await findUserByEmail(tenantId, email);
  if (!user || user.status !== "active") return { ok: false };
  if (!(await verifyPassword(password, user.passwordHash))) return { ok: false };
  const token = await createSession(user.id);
  return { ok: true, token, mustReset: user.mustResetPassword, home: roleHome(user.role) };
}
```

- [ ] **Step 4: Run it — expect PASS** (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/auth/login.ts tests/auth/login.test.ts
git commit -m "feat: login core (loginUser, roleHome)"
```

---

### Task 7: Auth context + access check (`src/auth/context.ts`)

**Files:**
- Create: `src/auth/context.ts`
- Test: `tests/auth/context.test.ts`

- [ ] **Step 1: Write the failing test `tests/auth/context.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { createSession } from "@/src/auth/session";
import { resolveAuthContext, canAccess } from "@/src/auth/context";

let tA: string;
beforeEach(async () => {
  const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
  const [a] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = a.id;
});

describe("resolveAuthContext", () => {
  it("returns the user + tenant for a valid token", async () => {
    const u = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c@roofers.co", role: "customer", tempPassword: "TEMP!234" });
    const token = await createSession(u.id);
    const ctx = await resolveAuthContext(token);
    expect(ctx?.user.id).toBe(u.id);
    expect(ctx?.tenant.domain).toBe("roofers.co");
    expect(ctx?.impersonator).toBeNull();
  });

  it("returns null for a missing/invalid token", async () => {
    expect(await resolveAuthContext(undefined)).toBeNull();
    expect(await resolveAuthContext("bogus")).toBeNull();
  });
});

describe("canAccess", () => {
  it("allows listed roles and denies others", () => {
    expect(canAccess("god", ["god"])).toBe(true);
    expect(canAccess("customer", ["god", "manager"])).toBe(false);
    expect(canAccess("manager", ["manager"])).toBe(true);
  });
});
```

- [ ] **Step 2: Run it — expect FAIL**.

- [ ] **Step 3: Write `src/auth/context.ts`**

```ts
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { users, tenants, sessions } from "../db/schema";
import { resolveSession, SESSION_COOKIE } from "./session";

type Role = "god" | "manager" | "customer";
export type UserRow = typeof users.$inferSelect;
export type TenantRow = typeof tenants.$inferSelect;

export interface AuthContext {
  user: UserRow;
  tenant: TenantRow;
  impersonator: UserRow | null;
  sessionRow: typeof sessions.$inferSelect;
}

export function canAccess(role: Role, allowed: Role[]): boolean {
  return allowed.includes(role);
}

export async function resolveAuthContext(token: string | undefined): Promise<AuthContext | null> {
  if (!token) return null;
  const session = await resolveSession(token);
  if (!session) return null;
  const user = (await db.select().from(users).where(eq(users.id, session.userId)).limit(1))[0];
  if (!user || user.status !== "active") return null;
  const tenant = (await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1))[0];
  if (!tenant) return null;
  let impersonator: UserRow | null = null;
  if (session.impersonatorUserId) {
    impersonator = (await db.select().from(users).where(eq(users.id, session.impersonatorUserId)).limit(1))[0] ?? null;
  }
  return { user, tenant, impersonator, sessionRow: session };
}

/** Reads the session cookie and resolves the auth context. Server-only. */
export async function getAuthContext(): Promise<AuthContext | null> {
  const { cookies } = await import("next/headers");
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return resolveAuthContext(token);
}
```

- [ ] **Step 4: Run it — expect PASS** (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/auth/context.ts tests/auth/context.test.ts
git commit -m "feat: auth context resolution + canAccess"
```

---

### Task 8: Impersonation core (`src/auth/impersonate.ts`)

**Files:**
- Create: `src/auth/impersonate.ts`
- Test: `tests/auth/impersonate.test.ts`

- [ ] **Step 1: Write the failing test `tests/auth/impersonate.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { createUser } from "@/src/auth/users";
import { createSession } from "@/src/auth/session";
import { resolveAuthContext } from "@/src/auth/context";
import { startImpersonation, exitImpersonation, canImpersonate } from "@/src/auth/impersonate";

let tA: string, tB: string;
beforeEach(async () => {
  const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
  const [a] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  const [b] = await db.insert(tenants).values({ domain: "solar.co", niche: "solar", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  tA = a.id; tB = b.id;
});

describe("impersonation authority", () => {
  it("god can impersonate any customer; manager only own-tenant customers; never a manager/god", async () => {
    // customers via createUser; a manager target inserted directly to test the "never a manager" rule
    const custA = await createUser({ role: "god", tenantId: tB }, { tenantId: tA, email: "ca@roofers.co", role: "customer", tempPassword: "x" });
    const custB = await createUser({ role: "god", tenantId: tB }, { tenantId: tB, email: "cb@solar.co", role: "customer", tempPassword: "x" });
    const mgrTarget = await createUser({ role: "god", tenantId: tB }, { tenantId: tA, email: "mt@roofers.co", role: "manager", tempPassword: "x" });

    const mgrAActor = { role: "manager" as const, tenantId: tA };
    expect(canImpersonate(mgrAActor, custA)).toBe(true);          // own-tenant customer
    expect(canImpersonate(mgrAActor, custB)).toBe(false);         // other-tenant customer
    expect(canImpersonate(mgrAActor, mgrTarget)).toBe(false);     // never a manager
    expect(canImpersonate({ role: "god", tenantId: tB }, custA)).toBe(true);     // god → any customer
    expect(canImpersonate({ role: "customer", tenantId: tA }, custA)).toBe(false); // customer cannot
  });

  it("start then exit restores the original session", async () => {
    const admin = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "m@roofers.co", role: "manager", tempPassword: "x" });
    const cust = await createUser({ role: "god", tenantId: tA }, { tenantId: tA, email: "c@roofers.co", role: "customer", tempPassword: "x" });
    const adminToken = await createSession(admin.id);

    const impToken = await startImpersonation({ role: "manager", tenantId: tA }, cust, adminToken);
    const impCtx = await resolveAuthContext(impToken);
    expect(impCtx?.user.id).toBe(cust.id);
    expect(impCtx?.impersonator?.id).toBe(admin.id);

    const restored = await exitImpersonation(impToken);
    expect(restored).toBe(adminToken);
    const back = await resolveAuthContext(adminToken);
    expect(back?.user.id).toBe(admin.id);
  });
});
```

Note: creating a `god` user via `createUser` is blocked by `canCreateUser`; the test above doesn't rely on that path for assertions (the placeholder lines exist only to keep the test self-contained — the real assertions use customers/managers). When implementing, if any placeholder line errors, replace it with a direct `db.insert(users)` for a god row; the meaningful assertions are the `canImpersonate` matrix and the start/exit round-trip.

- [ ] **Step 2: Run it — expect FAIL**.

- [ ] **Step 3: Write `src/auth/impersonate.ts`**

```ts
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { sessions } from "../db/schema";
import { createSession, destroySession, hashToken } from "./session";
import type { UserRow } from "./context";

type Role = "god" | "manager" | "customer";

export function canImpersonate(actor: { role: Role; tenantId: string }, target: UserRow): boolean {
  if (target.role !== "customer") return false;
  if (actor.role === "god") return true;
  if (actor.role === "manager") return target.tenantId === actor.tenantId;
  return false;
}

/** Creates an impersonation session for `target`, remembering the admin's current session. */
export async function startImpersonation(
  actor: { role: Role; tenantId: string },
  target: UserRow,
  adminToken: string,
): Promise<string> {
  if (!canImpersonate(actor, target)) throw new Error("Not authorized to impersonate");
  const adminSession = (
    await db.select().from(sessions).where(eq(sessions.tokenHash, hashToken(adminToken))).limit(1)
  )[0];
  if (!adminSession) throw new Error("No active admin session");
  return createSession(target.id, {
    impersonatorUserId: adminSession.userId,
    returnToSessionId: adminSession.id,
  });
}

/** Ends impersonation; returns the admin's original token to set back as the cookie, or null. */
export async function exitImpersonation(impToken: string): Promise<string | null> {
  const impSession = (
    await db.select().from(sessions).where(eq(sessions.tokenHash, hashToken(impToken))).limit(1)
  )[0];
  if (!impSession || !impSession.returnToSessionId) return null;
  const original = (
    await db.select().from(sessions).where(eq(sessions.id, impSession.returnToSessionId)).limit(1)
  )[0];
  await destroySession(impToken);
  if (!original) return null;
  // We cannot recover the raw token from its hash; instead, the cookie still holds the admin's
  // original token if we never overwrote it. To keep exit reliable, callers store the admin token
  // and pass it; here we signal success by returning the original session's user via a fresh token.
  return original ? await rotateBackToken(original.userId, original.id) : null;
}

async function rotateBackToken(userId: string, sessionId: string): Promise<string> {
  // Keep the original session row but issue a token that maps to it would require storing the new
  // hash; simplest: leave the original session intact and just return its token via the cookie set
  // by the action. Since we cannot read the raw token, we mint a new session for the admin user.
  return createSession(userId);
}
```

**Implementation note for the engineer:** the raw admin token cannot be recovered from its stored hash, so `exitImpersonation` mints a fresh admin session (via `rotateBackToken`) rather than literally restoring the old cookie value. The test asserts `exitImpersonation(impToken)` returns a token that resolves to the admin user — adjust the test's `expect(restored).toBe(adminToken)` to `expect((await resolveAuthContext(restored!))?.user.id).toBe(admin.id)` since a new token is minted. Make this test change as part of Step 3 and re-run.

- [ ] **Step 4: Run it — expect PASS** (2 tests, with the adjusted assertion).

- [ ] **Step 5: Commit**

```bash
git add src/auth/impersonate.ts tests/auth/impersonate.test.ts
git commit -m "feat: impersonation start/exit with authority checks"
```

---

### Task 9: Seed the God account

**Files:**
- Modify: `src/db/seed.ts`

- [ ] **Step 1: Extend `src/db/seed.ts`**

After the tenants are inserted (the existing `onConflictDoNothing` insert), and before `pool.end()`, add: look up the r0cketship.com tenant, then upsert the God user.

Add imports at the top alongside the existing ones:
```ts
import { eq } from "drizzle-orm";
import { users } from "./schema";
import { hashPassword } from "../auth/password";
```

Add before `await pool.end();`:
```ts
  const [platform] = await db.select().from(tenants).where(eq(tenants.domain, "r0cketship.com")).limit(1);
  if (platform) {
    const existing = await db.select().from(users).where(eq(users.email, "jeff.cline@me.com")).limit(1);
    if (existing.length === 0) {
      await db.insert(users).values({
        tenantId: platform.id,
        email: "jeff.cline@me.com",
        passwordHash: await hashPassword("TEMP!234"),
        role: "god",
        mustResetPassword: true,
        name: "Jeff Cline",
      });
      console.log("Seeded God account jeff.cline@me.com (temp password, must reset)");
    } else {
      console.log("God account already present");
    }
  }
```

- [ ] **Step 2: Run the seed**

Run: `npm run db:seed`
Expected: prints the tenants line plus "Seeded God account ..." (or "already present" on reruns).

- [ ] **Step 3: Verify the God user (node, not psql)**

```bash
DOTENV_CONFIG_PATH=.env.local node -r dotenv/config -e "const {Client}=require('pg');const c=new Client({connectionString:process.env.DATABASE_URL});c.connect().then(()=>c.query(\"select u.email,u.role,u.must_reset_password,t.domain from users u join tenants t on t.id=u.tenant_id where u.email='jeff.cline@me.com'\")).then(r=>{console.log(JSON.stringify(r.rows));return c.end()}).catch(e=>{console.error(e.message);process.exit(1)})"
```
Expected: one row — `jeff.cline@me.com`, role `god`, `must_reset_password true`, domain `r0cketship.com`.

- [ ] **Step 4: Idempotency** — run `npm run db:seed` again; verify still exactly one God row.

- [ ] **Step 5: Commit**

```bash
git add src/db/seed.ts
git commit -m "feat: seed God account"
```

---

### Task 10: Login, logout, and change-password (pages + actions + guard)

**Files:**
- Create: `src/auth/guard.ts`
- Create: `app/login/page.tsx`, `app/login/actions.ts`
- Create: `app/logout/actions.ts`
- Create: `app/account/password/page.tsx`, `app/account/password/actions.ts`

- [ ] **Step 1: Write `src/auth/guard.ts`**

```ts
import { redirect } from "next/navigation";
import { getAuthContext } from "./context";
import { canAccess } from "./context";

type Role = "god" | "manager" | "customer";

/** Server guard: ensures a session, forces password reset, and gates by role. */
export async function requireAuth(allowed: Role[]) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  if (ctx.user.mustResetPassword) redirect("/account/password");
  if (!canAccess(ctx.user.role, allowed)) redirect("/login");
  return ctx;
}

/** Like requireAuth but allows the forced-reset page itself (no reset redirect loop). */
export async function requireUser() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");
  return ctx;
}
```

- [ ] **Step 2: Write `app/login/actions.ts`**

```ts
"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentTenant } from "@/src/tenant/context";
import { loginUser } from "@/src/auth/login";
import { SESSION_COOKIE } from "@/src/auth/session";

export async function loginAction(_prev: unknown, formData: FormData): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "Unknown site." };
  const result = await loginUser(tenant.id, email, password);
  if (!result.ok) return { error: "Invalid email or password." };
  (await cookies()).set(SESSION_COOKIE, result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect(result.mustReset ? "/account/password" : result.home);
}
```

- [ ] **Step 3: Write `app/login/page.tsx`**

```tsx
"use client";
import { useActionState } from "react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, {});
  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <form action={action} className="mt-6 flex flex-col gap-3">
        <input name="email" type="email" placeholder="Email" required className="rounded border p-2" />
        <input name="password" type="password" placeholder="Password" required className="rounded border p-2" />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button type="submit" disabled={pending} className="rounded bg-black px-4 py-2 text-white">
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: Write `app/logout/actions.ts`**

```ts
"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { destroySession, SESSION_COOKIE } from "@/src/auth/session";

export async function logoutAction() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await destroySession(token);
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
```

- [ ] **Step 5: Write `app/account/password/actions.ts`**

```ts
"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { users } from "@/src/db/schema";
import { hashPassword } from "@/src/auth/password";
import { roleHome } from "@/src/auth/login";
import { requireUser } from "@/src/auth/guard";

export async function changePasswordAction(_prev: unknown, formData: FormData): Promise<{ error?: string }> {
  const ctx = await requireUser();
  const pw = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (pw.length < 8) return { error: "Password must be at least 8 characters." };
  if (pw !== confirm) return { error: "Passwords do not match." };
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(pw), mustResetPassword: false })
    .where(eq(users.id, ctx.user.id));
  redirect(roleHome(ctx.user.role));
}
```

- [ ] **Step 6: Write `app/account/password/page.tsx`**

```tsx
import { requireUser } from "@/src/auth/guard";
import { ChangePasswordForm } from "./form";

export default async function PasswordPage() {
  const ctx = await requireUser();
  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl font-bold">{ctx.user.mustResetPassword ? "Set your password" : "Change password"}</h1>
      {ctx.user.mustResetPassword && (
        <p className="mt-2 text-sm opacity-70">You must set a new password before continuing.</p>
      )}
      <ChangePasswordForm />
    </main>
  );
}
```

And `app/account/password/form.tsx`:
```tsx
"use client";
import { useActionState } from "react";
import { changePasswordAction } from "./actions";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, {});
  return (
    <form action={action} className="mt-6 flex flex-col gap-3">
      <input name="password" type="password" placeholder="New password" required className="rounded border p-2" />
      <input name="confirm" type="password" placeholder="Confirm password" required className="rounded border p-2" />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="rounded bg-black px-4 py-2 text-white">
        {pending ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
```

- [ ] **Step 7: Verify build + login flow against prod-like dev server**

Run `npm run build` (expect success). Then start the dev server, and verify the login flow end-to-end against the **dev** DB (which has the seeded God account at r0cketship.com):
```bash
# log in as God at r0cketship.com, capture the cookie
curl -s -c /tmp/cj.txt -X POST -H "Host: r0cketship.com" \
  -d "email=jeff.cline@me.com&password=TEMP!234" http://localhost:3000/login -o /dev/null -w "login HTTP %{http_code}\n"
# the forced-reset redirect target should be reachable with the cookie
curl -s -b /tmp/cj.txt -H "Host: r0cketship.com" http://localhost:3000/account/password | grep -o "Set your password" | head -1
```
Expected: login returns 303/302 (redirect), and the password page shows "Set your password" (forced-reset path). Stop the dev server.

Note: server actions are invoked via a POST to the page route with an action id in normal usage; for this CLI check you may instead add a temporary route or test the action through the core (already covered by `loginUser` tests). If the curl form-post doesn't trigger the server action directly, rely on the core tests + a manual browser check and note that in the report.

- [ ] **Step 8: Commit**

```bash
git add src/auth/guard.ts app/login app/logout app/account
git commit -m "feat: login, logout, forced change-password"
```

---

### Task 11: Role stub areas + impersonation banner

**Files:**
- Create: `app/admin/page.tsx`, `app/manage/page.tsx`, `app/dashboard/page.tsx`
- Create: `app/_components/ImpersonationBanner.tsx`

- [ ] **Step 1: Write `app/_components/ImpersonationBanner.tsx`**

```tsx
import { getAuthContext } from "@/src/auth/context";
import { exitImpersonationAction } from "@/app/admin/impersonate-actions";

export async function ImpersonationBanner() {
  const ctx = await getAuthContext();
  if (!ctx?.impersonator) return null;
  return (
    <div className="flex items-center justify-between bg-amber-500 px-4 py-2 text-sm text-black">
      <span>Impersonating <strong>{ctx.user.email}</strong> (as {ctx.impersonator.email})</span>
      <form action={exitImpersonationAction}>
        <button type="submit" className="rounded bg-black px-3 py-1 text-white">Exit</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Write `app/dashboard/page.tsx`**

```tsx
import { requireAuth } from "@/src/auth/guard";
import { logoutAction } from "@/app/logout/actions";
import { ImpersonationBanner } from "@/app/_components/ImpersonationBanner";

export default async function DashboardPage() {
  const ctx = await requireAuth(["customer"]);
  return (
    <>
      <ImpersonationBanner />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold">Customer dashboard</h1>
        <p className="mt-2">Logged in as {ctx.user.email} — customer at {ctx.tenant.domain}.</p>
        <form action={logoutAction} className="mt-6"><button className="rounded border px-3 py-1">Log out</button></form>
      </main>
    </>
  );
}
```

- [ ] **Step 3: Write `app/manage/page.tsx`**

```tsx
import { requireAuth } from "@/src/auth/guard";
import { listUsers } from "@/src/auth/users";
import { logoutAction } from "@/app/logout/actions";
import { ImpersonationBanner } from "@/app/_components/ImpersonationBanner";

export default async function ManagePage() {
  const ctx = await requireAuth(["manager"]);
  const team = await listUsers({ role: ctx.user.role, tenantId: ctx.user.tenantId });
  return (
    <>
      <ImpersonationBanner />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-bold">Manager — {ctx.tenant.domain}</h1>
        <ul className="mt-4 list-disc pl-6">
          {team.map((u) => <li key={u.id}>{u.email} — {u.role}</li>)}
        </ul>
        <form action={logoutAction} className="mt-6"><button className="rounded border px-3 py-1">Log out</button></form>
      </main>
    </>
  );
}
```

- [ ] **Step 4: Write `app/admin/page.tsx`**

```tsx
import { requireAuth } from "@/src/auth/guard";
import { listUsers } from "@/src/auth/users";
import { logoutAction } from "@/app/logout/actions";
import { ImpersonationBanner } from "@/app/_components/ImpersonationBanner";

export default async function AdminPage() {
  const ctx = await requireAuth(["god"]);
  const all = await listUsers({ role: "god", tenantId: ctx.user.tenantId });
  return (
    <>
      <ImpersonationBanner />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl font-bold">God admin</h1>
        <p className="mt-1 opacity-70">{all.length} users across all tenants.</p>
        <ul className="mt-4 list-disc pl-6">
          {all.map((u) => <li key={u.id}>{u.email} — {u.role} — {u.tenantId}</li>)}
        </ul>
        <form action={logoutAction} className="mt-6"><button className="rounded border px-3 py-1">Log out</button></form>
      </main>
    </>
  );
}
```

- [ ] **Step 5: Create a placeholder `app/admin/impersonate-actions.ts`** (filled in Task 12, but referenced by the banner now — define the export so the build compiles):

```ts
"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { exitImpersonation } from "@/src/auth/impersonate";
import { SESSION_COOKIE } from "@/src/auth/session";

export async function exitImpersonationAction() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const back = await exitImpersonation(token);
    if (back) {
      store.set(SESSION_COOKIE, back, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
    }
  }
  redirect("/admin");
}
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: success; routes `/admin`, `/manage`, `/dashboard`, `/login`, `/account/password` listed.

- [ ] **Step 7: Commit**

```bash
git add app/admin app/manage app/dashboard app/_components
git commit -m "feat: role-gated stub areas + impersonation banner"
```

---

### Task 12: Admin/manager create-user, reset, and start-impersonation actions + UI

**Files:**
- Create: `app/admin/user-actions.ts`
- Modify: `app/admin/page.tsx`, `app/manage/page.tsx` (add forms)

- [ ] **Step 1: Write `app/admin/user-actions.ts`**

```ts
"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { users } from "@/src/db/schema";
import { requireAuth } from "@/src/auth/guard";
import { createUser, resetUserPassword } from "@/src/auth/users";
import { startImpersonation } from "@/src/auth/impersonate";
import { SESSION_COOKIE } from "@/src/auth/session";

export async function createUserAction(formData: FormData) {
  const ctx = await requireAuth(["god", "manager"]);
  const role = String(formData.get("role") ?? "customer") as "manager" | "customer";
  const tenantId = ctx.user.role === "god" ? String(formData.get("tenantId") ?? "") : ctx.user.tenantId;
  await createUser(
    { role: ctx.user.role, tenantId: ctx.user.tenantId },
    { tenantId, email: String(formData.get("email") ?? ""), role, tempPassword: String(formData.get("tempPassword") ?? "") },
  );
  redirect(ctx.user.role === "god" ? "/admin" : "/manage");
}

export async function resetUserAction(formData: FormData) {
  const ctx = await requireAuth(["god", "manager"]);
  await resetUserPassword(
    { role: ctx.user.role, tenantId: ctx.user.tenantId },
    String(formData.get("userId") ?? ""),
    String(formData.get("tempPassword") ?? ""),
  );
  redirect(ctx.user.role === "god" ? "/admin" : "/manage");
}

export async function impersonateAction(formData: FormData) {
  const ctx = await requireAuth(["god", "manager"]);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");
  const target = (await db.select().from(users).where(eq(users.id, String(formData.get("userId") ?? ""))).limit(1))[0];
  if (!target) redirect(ctx.user.role === "god" ? "/admin" : "/manage");
  const impToken = await startImpersonation({ role: ctx.user.role, tenantId: ctx.user.tenantId }, target, token);
  (await cookies()).set(SESSION_COOKIE, impToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  redirect("/dashboard");
}
```

- [ ] **Step 2: Add a create-customer form + per-customer impersonate/reset buttons to `app/manage/page.tsx`**

Replace the `<ul>...</ul>` block with a table that, for each customer, includes impersonate and reset forms, and add a create form below. Use the actions from `@/app/admin/user-actions`:

```tsx
import { createUserAction, resetUserAction, impersonateAction } from "@/app/admin/user-actions";
// ...inside the component, after the heading:
<form action={createUserAction} className="mt-4 flex flex-wrap gap-2">
  <input name="email" type="email" placeholder="customer@email" required className="rounded border p-2" />
  <input name="tempPassword" placeholder="temp password" required className="rounded border p-2" />
  <input type="hidden" name="role" value="customer" />
  <button className="rounded bg-black px-3 py-2 text-white">Add customer</button>
</form>
<ul className="mt-4 space-y-2">
  {team.filter((u) => u.role === "customer").map((u) => (
    <li key={u.id} className="flex items-center gap-3">
      <span>{u.email}</span>
      <form action={impersonateAction}><input type="hidden" name="userId" value={u.id} /><button className="text-sm underline">Impersonate</button></form>
      <form action={resetUserAction} className="flex gap-1">
        <input type="hidden" name="userId" value={u.id} />
        <input name="tempPassword" placeholder="new temp" className="rounded border p-1 text-sm" />
        <button className="text-sm underline">Reset</button>
      </form>
    </li>
  ))}
</ul>
```

- [ ] **Step 3: Add a create-user form (with tenant + role) to `app/admin/page.tsx`**

After the heading, add:
```tsx
import { createUserAction } from "@/app/admin/user-actions";
// ...
<form action={createUserAction} className="mt-4 flex flex-wrap gap-2">
  <input name="email" type="email" placeholder="user@email" required className="rounded border p-2" />
  <input name="tenantId" placeholder="tenant uuid" required className="rounded border p-2" />
  <input name="tempPassword" placeholder="temp password" required className="rounded border p-2" />
  <select name="role" className="rounded border p-2"><option value="manager">manager</option><option value="customer">customer</option></select>
  <button className="rounded bg-black px-3 py-2 text-white">Create user</button>
</form>
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: success, no type errors.

- [ ] **Step 5: Commit**

```bash
git add app/admin app/manage
git commit -m "feat: admin/manager create-user, reset, and impersonate"
```

---

### Task 13: Full-suite + integration verification

**Files:**
- Create: `tests/auth/flow.test.ts`

- [ ] **Step 1: Write `tests/auth/flow.test.ts` — an end-to-end-ish core flow**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/src/db/client";
import { tenants, users } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/src/auth/password";
import { loginUser } from "@/src/auth/login";
import { createUser } from "@/src/auth/users";
import { resolveAuthContext } from "@/src/auth/context";
import { startImpersonation, exitImpersonation } from "@/src/auth/impersonate";

let platformTenant: string, roofersTenant: string;
beforeEach(async () => {
  const theme = { primary: "#000", secondary: "#111", accent: "#222", background: "#fff", foreground: "#000", fontFamily: "s" };
  const [p] = await db.insert(tenants).values({ domain: "r0cketship.com", niche: "platform", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "0" }).returning();
  const [r] = await db.insert(tenants).values({ domain: "roofers.co", niche: "roofing", moneyWord: "m", theme, offers: [], monthlyPriceDefault: "1500" }).returning();
  platformTenant = p.id; roofersTenant = r.id;
  // God user (insert directly; createUser forbids creating a god)
  await db.insert(users).values({ tenantId: p.id, email: "jeff.cline@me.com", passwordHash: await hashPassword("TEMP!234"), role: "god", mustResetPassword: true });
});

describe("identity flow", () => {
  it("god logs in (forced reset), creates a manager, manager creates + impersonates a customer", async () => {
    const godLogin = await loginUser(platformTenant, "jeff.cline@me.com", "TEMP!234");
    expect(godLogin.ok && godLogin.mustReset).toBe(true);

    const god = (await db.select().from(users).where(eq(users.email, "jeff.cline@me.com")).limit(1))[0];
    const mgr = await createUser({ role: "god", tenantId: god.tenantId }, { tenantId: roofersTenant, email: "mgr@roofers.co", role: "manager", tempPassword: "TEMP!234" });
    const cust = await createUser({ role: "manager", tenantId: roofersTenant }, { tenantId: roofersTenant, email: "cust@roofers.co", role: "customer", tempPassword: "TEMP!234" });

    const custLogin = await loginUser(roofersTenant, "cust@roofers.co", "TEMP!234");
    expect(custLogin.ok).toBe(true);

    // manager impersonates the customer
    const { createSession } = await import("@/src/auth/session");
    const mgrToken = await createSession(mgr.id);
    const impToken = await startImpersonation({ role: "manager", tenantId: roofersTenant }, cust, mgrToken);
    expect((await resolveAuthContext(impToken))?.impersonator?.id).toBe(mgr.id);
    const back = await exitImpersonation(impToken);
    expect((await resolveAuthContext(back!))?.user.id).toBe(mgr.id);
  });

  it("a manager cannot create a user in another tenant", async () => {
    await expect(
      createUser({ role: "manager", tenantId: roofersTenant }, { tenantId: platformTenant, email: "x@x.co", role: "customer", tempPassword: "TEMP!234" }),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run the full suite**

Run: `npm test`
Expected: ALL test files pass (Phase 1 tenant tests + all Phase 2 auth tests + this flow). Report the total count.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add tests/auth/flow.test.ts
git commit -m "test: end-to-end identity flow"
```

---

## Self-Review

**Spec coverage:**
- Custom session auth (scrypt + Postgres sessions + sha256 token) → Tasks 2, 3 ✓
- users/sessions schema, God-as-role, unique (tenant,email) → Task 1 ✓
- tenant scoping helper → Task 4 ✓
- user management + authority matrix → Task 5 ✓
- login + forced-reset + roleHome → Tasks 6, 10 ✓
- auth context + canAccess + guard → Tasks 7, 10 ✓
- impersonation start/exit + authority → Tasks 8, 12 ✓
- seed God account → Task 9 ✓
- login/logout/change-password UI → Task 10 ✓
- role stub areas + banner → Task 11 ✓
- admin/manager create/reset/impersonate UI → Task 12 ✓
- tests for every behavior in spec §9 → Tasks 2–8, 13 ✓
- Deferred (email forgot-password, agent/affiliate roles, rich dashboards, rate-limiting) → not in plan, correct ✓

**Known implementation nuance (documented in Task 8):** the raw admin token can't be recovered from its hash, so `exitImpersonation` mints a fresh admin session rather than restoring the literal old cookie value; the relevant test asserts the restored token resolves to the admin user. This is functionally correct and secure (old impersonation session is destroyed).

**Type consistency:** `Actor`/`Role` shape (`{role, tenantId}`) is used consistently across `users.ts`, `scope.ts`, `impersonate.ts`, and the actions. `SESSION_COOKIE`, `createSession`, `resolveSession`, `destroySession`, `hashToken`, `resolveAuthContext`, `getAuthContext`, `canAccess`, `requireAuth`, `roleHome` names match across definitions and call sites.

---

## What Phase 2 delivers

Working email/password auth on the chassis: the seeded God account logs in at r0cketship.com and is forced to reset its temp password; God creates managers, managers create customers (each forced to reset on first login); role-gated `/admin`, `/manage`, `/dashboard` areas; and God/manager impersonation of customers with a banner and clean exit — all tenant-scoped and covered by tests.
