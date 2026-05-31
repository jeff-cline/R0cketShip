# Phase 2 — Identity & Roles Design

**Date:** 2026-05-31
**Status:** Approved design, ready for plan
**Builds on:** Phase 1 multi-tenant chassis (`tenants` table, host→tenant resolution, theming)

---

## 1. Goal

Add authentication, roles, and user management to the chassis: email/password login scoped to
the resolved tenant, three roles (god / manager / customer), forced temp-password reset, admin
user creation + password reset, and manager/God impersonation of customers. No social login, no
email-based password reset yet (that arrives in Phase 4 when SMTP is wired).

---

## 2. Decisions (locked with the user)

- **Custom session-based auth** — no auth library. Hand-rolled with TDD.
- **Password hashing: Node built-in `crypto.scrypt`** — zero dependencies (avoids native-module
  build issues on the bare Vultr box). Encoded as `scrypt$<N>$<saltB64>$<hashB64>`.
- **Sessions: server-side in Postgres.** Cookie holds a random token; DB stores only its SHA-256
  hash. `httpOnly`, `secure` in prod, `sameSite=lax`, 7-day expiry.
- **God is a user in the `r0cketship.com` tenant with `role = god`** — "sees everything" is a role
  capability, not a nullable tenant. `tenant_id` is always set.
- **Reset scope:** forced temp-password reset on first login + admin reset to a new temp password.
  Self-serve email "forgot password" is deferred to Phase 4.
- **Includes** user management (create users) + impersonation in this phase.

---

## 3. Data model (additions)

### `users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid pk | |
| `tenant_id` | uuid not null | FK → `tenants.id`. Always set. |
| `email` | text not null | lowercased on write |
| `password_hash` | text not null | `scrypt$N$salt$hash` |
| `role` | enum(`god`,`manager`,`customer`) not null | |
| `must_reset_password` | boolean not null default true | |
| `name` | text | optional display name |
| `status` | enum(`active`,`disabled`) not null default `active` | |
| `created_by` | uuid | the admin who created them, nullable |
| `created_at` | timestamp not null default now | |

Unique index on `(tenant_id, lower(email))`.

### `sessions`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid pk | |
| `user_id` | uuid not null | FK → `users.id`. The **effective** user. |
| `token_hash` | text not null unique | SHA-256 of the cookie token |
| `impersonator_user_id` | uuid | set when an admin is impersonating; the real admin |
| `return_to_session_id` | uuid | the admin's original session, to restore on exit |
| `expires_at` | timestamp not null | |
| `created_at` | timestamp not null default now | |

### Row-level scoping helper (deferred from Phase 1, built here)
A `tenantScope(ctx)` helper that returns the `tenant_id` filter for queries, derived from the auth
context's effective user. `god` callers may opt out (cross-tenant). First consumer: scoping the
`users` list. Future phases (leads, billing) reuse it.

---

## 4. Auth context & session lifecycle

- **`createSession(userId, { impersonatorUserId?, returnToSessionId? })`** → generates a 32-byte
  token, stores `sha256(token)`, returns the raw token for the cookie.
- **`getSession()`** (server) → reads the cookie, hashes it, looks up a non-expired session + its
  user; returns `AuthContext { user, tenant, impersonator? }` or null.
- **`destroySession(token)`** → deletes the row.
- Password: **`hashPassword(pw)`** and **`verifyPassword(pw, encoded)`** using `crypto.scrypt`
  with a per-password random salt and a constant-time comparison.

---

## 5. Roles & login scoping

- **god** → logs in at **r0cketship.com**; full cross-tenant control; bypasses `tenantScope`.
- **manager** → logs in at their tenant's domain; manages that tenant only.
- **customer** → logs in at their tenant's domain; own account only.
- **Login validation:** the user is resolved by `(currentTenant.id, email)`. A user can only log
  in at the domain whose tenant matches their `tenant_id`. (God's tenant is r0cketship.com.)

---

## 6. Flows

1. **Login** (`POST /login`): resolve user in current tenant → `verifyPassword` → `createSession`
   → set cookie → if `must_reset_password` redirect to `/account/password`; else to role home
   (`/admin`, `/manage`, `/dashboard`). Generic error on bad credentials (no user enumeration).
2. **Forced reset / change password** (`/account/password`): authenticated user sets a new
   password (min length enforced) → re-hash → clear `must_reset_password`. While the flag is set,
   all other protected routes redirect here.
3. **Logout** (`POST /logout`): `destroySession` + clear cookie.
4. **Create user** (admin): God creates managers (choose tenant) + customers; manager creates
   customers in their own tenant. Sets a temp password (admin-entered or generated) +
   `must_reset_password=true`. Enforces role/tenant authority (a manager cannot create a god or a
   user in another tenant).
5. **Admin reset** (admin): God/manager resets an in-scope user to a new temp password +
   `must_reset_password=true`.
6. **Impersonation** (`POST /impersonate/:userId`): God/manager, authorized over the target
   customer, creates an impersonation session (`impersonator_user_id` = admin, `return_to_session_id`
   = current session), swaps the cookie. A persistent **"Impersonating <name> · Exit"** banner
   shows. **Exit** (`POST /impersonate/exit`) restores the `return_to_session_id` cookie and
   deletes the impersonation session. Authority: god → any customer; manager → customers in their
   tenant only.

---

## 7. Route protection & areas (stubs this phase)

A server-side `requireAuth(roles)` guard used by protected routes/layouts: no/invalid session →
redirect `/login`; `must_reset_password` set → redirect `/account/password`; role not allowed →
403. Areas are **minimal stubs** (rich dashboards are later phases):

- Public (Phase 1): `/`, `/api/health` — unchanged.
- `/login`, `/logout`, `/account/password`.
- `/admin` (god): list tenants, list/create users across tenants, impersonate.
- `/manage` (manager): list/create this tenant's customers, impersonate.
- `/dashboard` (customer): "Logged in as <email> — customer at <tenant>."

---

## 8. Seed

Add to the seed: the **God account** — `jeff.cline@me.com`, role `god`, in the `r0cketship.com`
tenant, password **`TEMP!234`** (scrypt-hashed), `must_reset_password=true`. Idempotent.

---

## 9. Testing (TDD)

Integration tests against the test DB plus unit tests for pure logic:
- `hashPassword`/`verifyPassword` (round-trip, wrong password fails, salts differ).
- Session create → `getSession` returns it; expired session returns null; destroyed session gone.
- Login: success path, wrong password, wrong tenant, disabled user, forced-reset redirect.
- Change password clears the flag and rehashes.
- `requireAuth` role gating (allowed / redirect / 403).
- Create user authority matrix (manager can't create god/cross-tenant; god can).
- Admin reset sets temp + flag.
- Impersonation: start (authority enforced), banner context, exit restores original session;
  manager cannot impersonate another tenant's customer.
- `tenantScope`: manager sees only their tenant's users; god sees all.

---

## 10. Success criteria

1. God logs in at r0cketship.com with the seeded temp password and is forced to reset it.
2. A manager created by God can log into roofers.co; a customer created by the manager can too.
3. Wrong password / wrong-tenant / disabled user are all rejected.
4. A logged-in customer hitting `/admin` gets 403; an unauthenticated user gets redirected to login.
5. A manager can impersonate a customer in their tenant (banner shows), then exit back to their
   own session; a manager cannot impersonate another tenant's customer.
6. Sessions expire; logout invalidates immediately.
7. All of the above covered by passing tests.

---

## 11. Out of scope (later phases)

Email-based "forgot password" (Phase 4 / SMTP), agent & affiliate roles (call-center & affiliate
phases), rich role dashboards (billing/CRM phases), 2FA, rate limiting/lockout (hardening pass).
