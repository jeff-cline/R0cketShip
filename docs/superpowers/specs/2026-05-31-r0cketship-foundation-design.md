# R0cketShip — Foundation Slice Design

**Date:** 2026-05-31
**Author:** Jeff Cline + Claude
**Status:** Draft for review

---

## 1. Vision (full platform context)

R0cketShip is a **white-label engine for industry lead-gen**. One backend powers many niche
sites (roofing, solar, stem cells, …). Each white-label site sees only its own leads and its
own billing; the central **God account** (`r0cketship.com` / `el.ag`) manages everything and
sees across all of them. The first white-label, **roofers.co**, is built as the perfected
template that every future niche is cloned from.

The full platform is ~10 subsystems. This document specs only the **foundation slice** — the
reusable chassis plus roofers.co taken far enough to take money and deliver leads. The
remaining subsystems are explicitly deferred (Section 14) and each gets its own spec.

---

## 2. Foundation slice — scope

**In scope (A–F):**

- **A. Multi-tenant chassis + theming** — one app, one DB, tenant resolution by hostname,
  per-tenant config (logo, colors, money-word, offer copy, prices, footer WYSIWYG).
- **B. Identity & roles** — God/super-admin, white-label manager, customer; forced
  temp-password reset (`TEMP!234`).
- **C. Marketing site** — landing (3 offers), about, how-it-works, contact, e-partnership
  application, testimonials, residential + commercial sections.
- **D. Data ingestion** — bulk CSV seed upload + per-tenant ongoing posting endpoint; parse,
  dedupe, tenant-tag, person-identity resolution.
- **E. Pricing & billing** — wallet/credits (old leads), monthly subscriptions per ZIP (new
  leads), $50 signup bonus, ZIP volume discounts, coupons, PayPal **and** Stripe behind one
  billing interface (admin picks the active provider).
- **F. Lead delivery + customer CRM** — customer picks ZIP/filters/frequency → receives leads
  → wallet/subscription enforced → dashboard + CSV download + outbound webhook (HubSpot / GHL).

**Decisions locked with the user:**

- Build depth: **Production MVP** (real auth, real payments, real ledger).
- Stack: **Next.js (Node)** + **fresh Postgres**, on the Vultr box (`137.220.56.129`,
  `r0cketship.com`), deployed via the existing **hermes → GitHub → Vultr** pipeline.
- Tenancy: **shared DB, row-level `tenant_id` scoping**.
- Data source: **operator-supplied files** (bulk seed + recurring drops), not a live 3rd-party
  API. Real column schema known (Section 5).
- All three offers are **self-serve checkout + billing now**; delivery engines for offers #2
  and #3 ship later (the operator accepts billing-ahead-of-delivery).

---

## 3. Architecture

One Next.js application on the Vultr VPS behind nginx, one Postgres database.

- **Tenant resolution:** request hostname → `tenants` lookup → load that tenant's config →
  render themed pages and scope all data. `r0cketship.com` / `el.ag` = the God account, which
  bypasses tenant scoping to see across all niches.
- **Row-level scoping:** every business table carries `tenant_id`. A central query helper
  auto-injects `WHERE tenant_id = :current` for customer/WL contexts so a tenant can *only*
  ever read its own rows. The God account uses an unscoped path.
- **Config-driven looks, not code forks:** the only difference between roofers.co and niche #2
  is data — tenant config rows, theme, copy. This is what makes launching a niche safe and
  repeatable. The AI "auto-generate unique pages / refresh look" wizard is a later layer on
  top of this same wiring.
- **Billing abstraction:** a `PaymentProvider` interface with `Stripe` and `PayPal` adapters.
  The active provider is a per-tenant setting; switching is config, not a rewrite. Both
  adapters implement one-time charges (wallet top-ups) and recurring subscriptions (ZIP plans).
- **Deploy:** the repo is structured so hermes builds and ships it. Claude commits; the
  operator/hermes pushes. Testable live at the IP/domain after a push.

---

## 4. Identity & roles (B)

| Role | Capabilities |
|------|--------------|
| **God / super-admin** (`jeff.cline@me.com`) | Everything, across all tenants. Create/configure white-labels, set per-tenant prices/theme/payment keys, view all leads, impersonate any customer, grant credits, edit/upgrade plans, add free ZIPs / discounts / coupons. |
| **White-label manager** | Within one tenant: see all that tenant's leads, manage its customers, switch into a customer's portal, grant credits, edit/upgrade plans, configure that tenant's data connection + payment keys. |
| **Customer** (business owner) | Their own account only: wallet, subscriptions/ZIPs, settings, basic CRM (leads + conversions), integrations (webhook/API), billing. |

- **Temp-password flow (universal):** every account is created with a temp password
  (`TEMP!234` for the seeded God account) and a `must_reset_password` flag. On first login the
  user is forced to set a new password before any other action. Standard password-reset on the
  login page for everyone.
- Jeff's God account is seeded at build time with the temp password + forced reset.

---

## 5. Data model (core tables)

Shared Postgres, every business table has `tenant_id` except the global `persons` table.

- **`tenants`** — `id`, `domain`, `ip`, `niche`, `money_word`, `logo_url`, `theme` (JSON:
  colors/fonts/CSS), `offers` (JSON: 3 offers w/ title, description, price — editable live),
  `monthly_price_default` (e.g. 1500 for roofers), `footer_html` (WYSIWYG, global to every
  page), `active_payment_provider` (`stripe` | `paypal`), payment credentials (encrypted),
  status.
- **`persons`** — **global identity**, keyed on `sha256_lc_hem`. One row per real human across
  all niches. Holds stable identity + cross-site linkage. Seed of the v2 predictive engine. No
  `tenant_id`.
- **`leads`** — a person within a tenant's pool: `tenant_id`, `person_id`, `sha256_lc_hem`,
  first/last name, `personal_address`, city, state, `personal_zip`, `personal_zip4`,
  `phones` (parsed array — fields hold comma-separated multiples), `emails` (array),
  `linkedin_url`, demographics (`gender`, `age_range`, `income_range`, `net_worth`),
  company enrichment (`company_name`, `company_domain`, `company_revenue`,
  `company_employee_count`, `company_state`, `job_title`, `department`) →
  **residential vs commercial** is derived from presence of company data,
  `score_category` (low/medium/high = intent tier), `extra` (JSON for niche-specific columns
  like `green`/solar), `last_updated` → derived **age_tier** (real-time ≤24h / 1-week / 30-day),
  `source` (seed | posting-endpoint), `status` (new → delivered → …), `delivered_to_user_id`,
  `delivered_at`.
- **`users`**, **`roles`** — auth, role, `must_reset_password`, tenant binding.
- **`wallets`** — one per customer, `tenant_id`, balance is derived from the ledger.
- **`credit_ledger`** — immutable rows: `signup_bonus` (+50), `topup`, `lead_charge` (−price),
  `affiliate` (later), `admin_grant`, `refund`. Balance = sum. 1 credit = $1.
- **`subscriptions`** — `tenant_id`, `customer_id`, `offer` (1/2/3), `zip`, `monthly_price`
  (after volume discount), `provider`, `provider_subscription_id`, `status`, billing dates.
- **`zip_claims`** — `tenant_id`, `customer_id`, `zip`, `exclusive` flag, link to subscription.
- **`coupons`** — code, discount type/amount, scope (tenant/ZIP/topup), admin-issued.
- **`payments`** — every PayPal/Stripe transaction, **tagged by `tenant_id`** so accounting
  reports which site earned what.
- **`epartner_applications`** — application-form submissions (Section 11).

Open the `leads.extra` JSON map so any niche's additional columns (e.g. `green`) absorb without
a migration.

---

## 6. Data ingestion (D)

Two paths, both funnel through the **same pipeline**, configured per white-label in admin under
a **"Data Connection"** panel:

1. **Bulk seed upload** — operator uploads one large CSV when launching a white-label. The
   header matches the provided `audience_export` format. Rows are parsed, validated,
   tenant-tagged, person-resolved by `sha256_lc_hem`, deduped, and loaded.
2. **Per-tenant posting endpoint** — admin generates a unique URL + secret key per tenant
   (e.g. `https://r0cketship.com/api/ingest/<tenant>` + key). Any external system POSTs new
   leads there for daily/weekly drops.

**Pipeline steps (shared):** parse → normalize (split multi-value phone/email cells, derive
age_tier from `last_updated`, derive residential/commercial from company fields) → upsert
`persons` by hash → insert/dedupe `leads` (dedupe by `person_id` + address within tenant) →
mark new. Every imported lead also exists in the God-account global view automatically (it's
the same table, unscoped read).

---

## 7. Pricing & billing (E)

**Two products, one billing layer.**

### Product A — Old leads (wallet / credits)
- **1 credit = $1.**
- **$50 free credits** on every new account (every white-label) at signup.
- Spent on **old leads from the initial import**, priced by **age tier**:
  real-time (≤24h) = **11 credits**, 1-week = **4 credits**, 30-day = **1.44 credits**.
  (Back-catalog mostly lands at the cheap tier, so $50 buys a real sample.)
- **Top-up** anytime via the active provider to buy more old leads.

### Product B — New leads (monthly subscription per ZIP) — the 3 homepage offers
| Offer | Delivers | Price | Slice-1 delivery |
|---|---|---|---|
| **1 — Data / Leads** | All new leads added daily/weekly in the subscribed ZIP | **$1,500/mo per ZIP** (per-tenant dynamic; $1,500 = roofers default) | **Fully delivered** |
| **2 — Booking** | #1 + outbound emails on their behalf to their booking link | **$4,500/mo** | **Sold & billed**; email engine deferred |
| **3 — E-Partnership (DFY sales)** | Full done-for-you sales | **Negotiated, ~50% above red line**, application-gated | **Sold & billed**; sales tooling deferred |

- **ZIP volume discount** on the monthly subscription: 2nd ZIP −10%, 3rd −20%, 4th+ −30%.
- **Coupons** and admin-granted free ZIPs / discounts at God + WL-manager level.

### Billing providers
- Admin holds **both Stripe and PayPal** credentials per tenant; operator **picks the active
  provider** (undecided). Active provider handles one-time top-ups *and* recurring monthly
  subscriptions. Both implemented behind one `PaymentProvider` interface.
- All transactions tagged by tenant for accounting.

---

## 8. Marketing site (C)

Per-tenant themed pages, all rendered from tenant config:

- **Landing** — hero with money-word, the **3 offers** (live-editable copy/price), residential
  + commercial sections, feature highlights (predictive/intent targeting, door-knocker
  optimization, saturation marketing, DFY booking, CRM webhooks, ZIP exclusivity, retrospective
  data), example roofing data, testimonials, the **E-Partnership** call-to-action, vanity
  call CTA (Twilio redirect deferred — static number for now), $50-free-credit signup CTA.
- **About**, **How it works**, **Contact** — templated, themed.
- **Footer** — global WYSIWYG block from `tenants.footer_html` on every page.
- **TOS / data-use agreement** (Section 12) — its own page, checkbox at signup.

---

## 9. Customer dashboard / lead delivery (F)

- **Wallet** — balance, ledger history, top-up button.
- **Subscriptions / ZIPs** — current offers + ZIPs, add-a-ZIP (with live volume-discount
  pricing), upgrade/downgrade.
- **Targeting** — pick ZIP(s)/radius, demographics filters, delivery frequency.
- **CRM** — leads list (with residential/commercial, score, age), **conversions** count,
  notes. Lead status lifecycle starts here (new → delivered; richer statuses added with the
  call-center slice).
- **Integrations** — paste their CRM webhook/API + key (HubSpot, GoHighLevel); delivered leads
  POST out. Investigate whether the data API connection can be automated vs. a manual admin
  step (flagged as an implementation spike).
- **Delivery enforcement** — old leads debit the wallet by age-tier; new leads require an
  active ZIP subscription. CSV download available.

---

## 10. Admin (God + WL manager)

- **God account** — create/configure white-labels (domain, IP, theme, money-word, offers,
  prices, footer, payment keys + active provider, data connection); view all leads across
  niches; impersonate customers; grant credits; edit/upgrade plans; issue free ZIPs /
  discounts / coupons; accounting report (revenue by tenant/site).
- **WL manager** — same controls scoped to one tenant.
- **Per-tenant editable in real time:** prices, offer titles/descriptions, logo, color theme
  (picker), CSS, footer content.

---

## 11. E-Partnership application (C)

Application-only form capturing: name, phone, business name, location, roofs in last 12 months,
seasons in business, territories/areas, team W-2 count, 1099 count, canvassers/door-knockers,
technology used today, annual revenue, annual EBITDA, prior acquisition approaches (y/n),
agreement to exit in 3–5 years if the white-label is acquired (y/n).

On submit: persist to DB **and** the operator's personal vault, **and** auto-email the operator
(`jeff.cline@me.com`) so they know an application arrived. Offers #2/#3 also route here per the
self-serve-then-application flow.

---

## 12. Terms of service / compliance (E)

A white-labeled TOS / acceptable-use + data-use agreement, **referencing the white-label's own
URL/brand** (roofers.co, etc.), shown on a page with a **pre-checked checkbox** at signup
before the $50 credit is granted. Content covers: data used for door-knocking/canvassing to
grow their business, compliance with DNC and all federal/state laws and data regulations.
(Real legal copy to be drafted during implementation; this is a product requirement, not legal
advice.)

---

## 13. Success criteria

1. roofers.co renders themed from tenant config at its domain on the Vultr box.
2. A second niche can be launched by creating a tenant row + config — no code changes.
3. A CSV seed import loads leads, resolves `persons` by hash, dedupes, splits
   residential/commercial, and derives age tiers.
4. The per-tenant posting endpoint ingests a new drop into the right tenant pool.
5. New account → TOS accepted → $50 credit granted → buy old leads debited by age tier.
6. Customer subscribes to a ZIP ($1,500/mo), with correct volume-discount pricing on more
   ZIPs, billed through the active provider (Stripe or PayPal, operator-selectable).
7. Delivered leads appear in the dashboard, download as CSV, and POST to a configured webhook.
8. God account sees all leads across niches; a customer sees only their own.
9. E-partnership application persists + emails the operator.
10. Forced temp-password reset works for every new account.

---

## 14. Deferred subsystems (own specs later)

- **Twilio call-center dialer** — agent queue, dispositions, callbacks calendar, hot transfer,
  booking, KPIs, lead status lifecycle (hot → booked → sold), vanity-number redirect.
- **Email / booking campaign engine** — email editor, sends for Offer #2, booking-link
  conversion tracking.
- **Affiliate program** — share links, 10%-of-purchased-credits commission paid as credits.
- **AI provisioning wizard** — launch-a-site flow (URL, money-word, 3 offers) that
  AI-generates unique landing/about/how-it-works/contact pages with a "refresh for a different
  look" button, auto-assigns the IP.
- **v2 cross-site predictive engine** — searchable global lead DB, cross-site person tracking,
  buyer prediction.

---

## 15. Open questions / assumptions

- **Webhook/data-API automation** (Section 9) — needs an implementation spike to decide
  automated vs. manual admin step.
- **Legal TOS copy** — drafted during implementation; not legal advice.
- **Vanity Twilio number** — static number in slice 1; live redirect with the call-center slice.
- Phone/email cells contain comma-separated multiples — parsed to arrays (confirmed from seed
  file).
