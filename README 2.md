# R0cketShip

White-label lead-gen platform. One Next.js + Postgres backend powers many niche sites
(roofing, solar, …). Each white-label is a row in the `tenants` table; the site is resolved
from the request `Host` header and themed entirely from that row's config. The God account
(`r0cketship.com`) sees across all tenants.

This repo currently implements **Foundation Phase 1 — the multi-tenant chassis** (see
`docs/superpowers/plans/2026-05-31-foundation-phase1-chassis.md`). Later phases (auth, data
ingestion, billing, lead delivery) build on it.

## Stack

- Next.js 15 (App Router, TypeScript) — runs as a Node process
- PostgreSQL 17 + Drizzle ORM (`drizzle-kit` migrations)
- Tailwind CSS v4 (per-tenant theming via CSS variables)
- Vitest (integration tests against a real Postgres)

## Database

Postgres lives on the Vultr box (`137.220.56.129`) and is **bound to localhost** there —
nothing is exposed to the internet. Local dev and tests reach it over an **SSH tunnel**.

There are two databases: `r0cketship_dev` (dev) and `r0cketship_test` (tests; truncated
between test runs). Both are owned by the `r0cketship` role.

### One-time SSH setup

The `r0cketship` SSH alias (key + host) is configured in `~/.ssh/config`:

```
Host r0cketship
    HostName 137.220.56.129
    User root
    IdentityFile ~/.ssh/r0cketship_vultr
    IdentitiesOnly yes
```

### Open the tunnel (required before dev/tests)

```bash
ssh -fNT -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 \
  -L 127.0.0.1:5432:127.0.0.1:5432 r0cketship
```

This forwards local `localhost:5432` to the box's Postgres. If a DB command fails with a
connection error, the tunnel has dropped — re-run the command above.

## Local dev

1. Copy `.env.example` to `.env.local` and set `DATABASE_URL` (dev DB) +
   `DEFAULT_TENANT_DOMAIN=roofers.co`. (`.env.local` and `.env.test` are gitignored — they hold
   the DB password.)
2. `npm install`
3. Open the SSH tunnel (above).
4. `npm run db:migrate` — applies migrations to the dev DB (loads `.env.local`).
5. `npm run db:seed` — seeds `roofers.co` and `r0cketship.com` (idempotent).
6. `npm run dev` → http://localhost:3000 renders **roofers.co** (via `DEFAULT_TENANT_DOMAIN`).
   To preview another tenant locally: `curl -H "Host: r0cketship.com" http://localhost:3000`.

`/api/health` returns `{"status":"ok","db":"up"}` when the DB is reachable.

## Tests

```bash
npm test          # runs against r0cketship_test using .env.test
```

Tests require the SSH tunnel to be open. The harness migrates the test DB, truncates between
tests, and closes the pool once at the end (`tests/global-teardown.ts`).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run db:generate` | Generate a Drizzle migration from `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations (loads `.env.local`) |
| `npm run db:seed` | Seed initial tenants (loads `.env.local`) |
| `npm test` | Run the Vitest suite (loads `.env.test`) |

## Production (Vultr, via the hermes/GitHub pipeline)

- Node 20+, Postgres local to the box.
- Env: set `DATABASE_URL` to the box's local Postgres (`localhost:5432`). Do **not** set
  `DEFAULT_TENANT_DOMAIN` in prod — real `Host` headers resolve tenants.
- Build/run: `npm ci && npm run build && npm run db:migrate && npm run start` (port 3000).
- nginx reverse-proxies the tenant domains (`roofers.co`, `r0cketship.com`, both pointed at
  `137.220.56.129`) to `localhost:3000`. Tenant is resolved from the `Host` header.
- Run `npm run db:seed` once to create the initial tenants.

## Project layout

```
app/                      Next.js App Router (layout, landing page, /api/health)
src/db/                   Drizzle client, schema, seed
src/tenant/               types, repo (DB lookup), cache (TTL), context (Host → tenant)
drizzle/                  generated SQL migrations
tests/                    Vitest setup, teardown, and tenant tests
docs/superpowers/         specs + implementation plans
```
