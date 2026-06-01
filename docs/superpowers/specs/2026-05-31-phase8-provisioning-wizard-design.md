# Phase 8 — Provisioning Wizard / Tenant Management Design

**Date:** 2026-05-31
**Status:** Approved (user directive "do everything"), ready for build
**Builds on:** Phase 1 chassis (multi-tenant + config-driven theming)

## Goal
From the God account, **launch a new white-label** (domain, niche, money-word, 3 offers, theme) and
**edit any tenant's config** live — the "rinse and repeat niches" engine. The Phase-1 chassis already
renders each tenant from its config, so launching a niche = creating a tenant row.

## Decisions
- No new tables — uses the existing `tenants` table (config-driven). New tenants auto-get an ingest
  key + the shared IP `137.220.56.129` + `signup_bonus_credits=50`.
- **Theme presets**: a small set of palettes; "regenerate look" cycles them (the AI copy/look
  generator via Claude API is a follow-on once an API key is in `/admin/integrations`).
- **Going live on a new domain** still needs DNS→the box IP + nginx `server_name` + a cert — an
  operator/SSH step, documented in the wizard's success note (the tenant itself is live immediately
  for any request whose Host matches).

## Domain (`src/tenant/manage.ts`)
- `THEME_PRESETS: TenantTheme[]` (≥6 distinct palettes).
- `createTenant({ domain, niche, moneyWord, offers, theme?, monthlyPriceDefault?, footerHtml?,
  logoUrl? })` → lowercased domain, reject duplicate, insert with ip + generated ingest key +
  defaults → returns the row.
- `updateTenantConfig(id, patch)` → updates any of: moneyWord, niche, logoUrl, theme, offers,
  monthlyPriceDefault, signupBonusCredits, footerHtml, activePaymentProvider, status.

## UI (god only)
- **`/admin/launch`** — wizard form: domain, niche, money-word, 3 offers (title/description/price),
  theme preset select → `createTenant` → success note with the new site URL + the "point DNS +
  add nginx/cert" reminder.
- **`/admin/tenants`** — list all tenants (domain, niche) → edit link.
- **`/admin/tenants/[id]/edit`** — edit money-word, niche, monthly price, signup bonus, logo URL,
  the 3 offers, footer HTML (WYSIWYG textarea), theme preset; a "regenerate look" that advances the
  preset. Saves via `updateTenantConfig`.

## Testing (TDD)
- `createTenant`: inserts with ip + ingest key + bonus default; duplicate domain rejected; chassis
  `getTenantByHost(newDomain)` then resolves it.
- `updateTenantConfig`: updates moneyWord/theme/offers/price; leaves others intact.
- `THEME_PRESETS`: ≥6 entries, distinct accents.

## Out of scope
AI copy/look generation (needs Claude API key — follow-on); automated nginx/cert provisioning for
new domains (operator/SSH step); per-tenant separate payment accounts beyond the keys page.
