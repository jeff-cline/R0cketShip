# Partner / Franchise Program + Owner Console — Design

**Date:** 2026-06-01
**Status:** Draft for review
**Builds on:** existing roles (god/manager/customer/agent), affiliates/referrals, economics/credits reporting, billing (Stripe/PayPal key-gated), admin shell.

## Goal
Give every level of the business its own franchise-grade console and a unified, scalable
referral/commission engine:
- **White-label owners** get a god-style console scoped to their tenant (members, collected,
  leads, outstanding credits, drill-down, reports, pretty visuals) + their own **partner program**.
- A **two-level referral system** — your **god sales team** (works across all white-labels) and each
  white-label's **partner program** — sharing one engine.
- **Reports-only partner/rep logins**, 12-month commissions on *collected* money, monthly payouts on
  the **21st** via PayPal or Stripe Connect.

## Decisions (locked with the user)
- **Funding of commissions:** each level funds its own — god's 60% pays sales reps; each white-label's
  40% pays its own partners.
- **Commission base:** **% of the earner's margin.** Tenant partner = `rate × (1 − platformFeeRate) ×
  collected`. God rep (customer referral) = `rate × platformFeeRate × collected`.
- **Duration / trigger:** 12 months from the referred customer's **first upgrade** (first real
  payment). The **$50 free credit earns nothing** — commission only on money actually collected.
- **Rate control:** god sets the sales-rep rate, a default partner rate, and a **cap**; each
  white-label owner sets their partner rate ≤ cap.
- **Payout schedule:** batched on the **21st of the following month**.
- **Payout rails:** partner picks **PayPal Payouts** (email) or **Stripe Connect** (bank/ACH). Paid
  from the account that collected the money (your Stripe/PayPal for now), architected so a white-label
  can later spin off to its own payout account.
- **Payout form:** configurable per program — cash payout OR account credit.
- **Sales Manager:** god-appointed role that manages reps (create/assign links, set rep rates), sees
  rep reports, and approves/queues the 21st payout run. No platform P&L or lead data.
- **Partner / Sales-Rep login:** reports-only (link + QR, funnel, earnings, payout settings). No
  wallet / lead-buying.
- **Two links per white-label program:** a **recruit** page (`/partners`) to sign people up as
  partners, and each partner's **referral** link (`/signup?ref=CODE`).
- **Attribution:** one `?ref=` code per signup; resolves to a rep (paid from 60%) OR a partner (paid
  from 40%) — never double-paid. First-touch, stored on the user at signup.
- **God reps earn two ways:** customer referrals (20% of platform margin) AND landing a **new
  white-label owner** (separate rate on that white-label's platform fees). Tracked separately.
- **Funnel:** Referred → Activated (spent free credit) → Upgraded (paid).
- **Owner home:** full god-style console at `/admin`, tenant-scoped; **retire the bare `/manage`** by
  folding team management into `/admin/users`.

- **Existing 10% customer affiliate:** **RETIRED entirely** (confirmed). The new partner program is
  the only referral system. Remove the old `affiliates`/10%-credit path; existing `?ref=` capture is
  repurposed for partner codes. The `/affiliate` customer page is removed/redirected.

### Open (proposed default — confirm on review)
- **Customer funding:** per-white-label default (self-fund vs owner-funds) + per-customer override;
  owner-funding-customers ships as a fast-follow after self-funding (Stripe top-up already exists).
- **New-white-label-landed commission:** rep earns `whitelabelRate × that tenant's platform revenue`
  for 12 months from the white-label's launch. (Confirm rate basis & window.)

## Roles (2 new)
| Role | Home | Sees |
|---|---|---|
| god | /admin | everything (existing) |
| **sales_manager** (new) | /admin (sales console) | all sales reps, their funnels & payouts; queues 21st run; no P&L/leads |
| **partner** (new) | /partner | only their own referral funnel + earnings + payout settings |
| manager (owner) | /admin (tenant-scoped) | their tenant: members, money, leads, partners |
| customer | /leads | buy leads (existing) |
| agent | /agent | dialer (existing) |

A **sales rep** is a `partner` whose referral code is **platform-scoped** (works on every white-label);
a white-label **partner** is a `partner` whose code is **tenant-scoped**. One role, scope on the code.

## Data model (new tables)
- **`referral_codes`**: `id, code (unique), ownerUserId, scope ('platform'|'tenant'), tenantId (null
  for platform), customerRate (numeric, default 0.20), whitelabelRate (numeric, platform-scope only),
  payoutForm ('cash'|'credit'), status, createdAt`. The code's scope decides which pool funds it.
- **`referrals`** (extend existing): `referredUserId, referralCodeId, scope, tenantId, createdAt,
  activatedAt (first free-credit spend), upgradedAt (first paid payment), windowEndsAt (upgradedAt +
  12mo)`.
- **`commission_ledger`**: `id, referralCodeId, ownerUserId, referredUserId, paymentId, kind
  ('customer'|'whitelabel'), basisAmount, rate, amount, scope, tenantId, periodMonth (YYYY-MM),
  status ('accrued'|'owed'|'paid'|'void'), payoutBatchId, createdAt`. One row per commissionable
  payment.
- **`payout_settings`** (per partner user): `userId, method ('paypal'|'stripe_connect'), paypalEmail,
  stripeConnectId, status`.
- **`payout_batches`**: `id, runDate (the 21st), scope, createdBy, status ('queued'|'sent'|'failed'),
  totalAmount, createdAt`; commission_ledger rows link via `payoutBatchId`.
- **tenant settings** (extend `tenant_integrations` or tenants): `partnerProgramEnabled (bool),
  partnerRate (numeric), showBecomeAPartner (bool, footer), customerFundingPolicy
  ('self'|'owner')`.
- **platform settings** (god): `salesRepRate, defaultPartnerRate, partnerRateCap,
  whitelabelLandedRate`.

## Engine (`src/referral/`)
- `resolveCode(code)` → the referral_code (scope, owner, tenant).
- `attributeSignup(userId, code)` → create a `referrals` row (first-touch; ignore if already
  attributed). Called from `/signup` when `?ref=` present.
- `markActivated(userId)` → set `activatedAt` on first free-credit lead spend.
- `accrueCommission(payment)` → on a **paid** payment by a referred user within the window: compute
  `basisAmount` = the funding level's margin on that payment (`platformFeeRate` for platform scope,
  `1 − platformFeeRate` for tenant scope), `amount = rate × basisAmount`, insert a
  `commission_ledger` row (status `accrued`). First paid payment also sets `upgradedAt`/`windowEndsAt`.
- `landWhiteLabel(rep, tenant)` → records that a rep landed a white-label; accrues
  `whitelabelRate × platform revenue` monthly for 12 months.
- `runPayouts(month, scope)` → roll `accrued` → `owed`, batch by partner, execute via PayPal
  Payouts / Stripe Connect (or mark manual), set `paid`. Triggered/approved from the Sales Manager
  console; idempotent per `periodMonth`.

Hooks: `accrueCommission` is called from `confirmPayment` (the existing paid-payment path, where the
10% affiliate currently fires). `markActivated` from the lead-purchase debit path.

## UI
- **Owner console** (`/admin`, role manager, tenant-scoped): Dashboard (StatCards: members, collected,
  paid vs free users, outstanding credits, leads; charts; drill-down), **Partners** tab (enable
  program, set rate ≤ cap, recruit link, partner list + each partner's funnel/earnings, payout queue),
  Reports, Leads, Users (folds in `/manage` team mgmt), Email, Site. Managers now land on `/admin`.
- **Partner dashboard** (`/partner`, role partner): link + QR, funnel (referred/activated/upgraded),
  earnings (earned/owed/paid), payout settings (PayPal email or Stripe Connect onboard).
- **Sales Manager console** (`/admin` for role sales_manager): reps list, create/assign rep links, set
  rep rates, reports per rep, the 21st payout-run approval.
- **Recruit page** (`/partners`, public, gated by `partnerProgramEnabled`): signs up a `partner` with a
  tenant-scoped code. God/sales side recruits reps from the console (+ optional platform recruit page).
- **Footer**: conditional "Become a Partner" link (`showBecomeAPartner`).
- **Signup**: capture `?ref=`, attribute, normal customer flow continues.

## Economics integration
Commission is a cost to its funding level. God dashboard: rep commissions reduce platform gross
profit. Owner dashboard: partner commissions reduce the white-label's 40% net. Extend
`src/reporting/economics.ts` + `credits.ts` with commission expense (accrued/owed/paid).

## Phasing (each ships independently)
- **A — Owner console.** Route managers → `/admin` (tenant-scoped dashboard/reports/users), retire
  `/manage`. *Immediate value; unblocks "owner sees their data."*
- **B — Referral engine core.** Tables, attribution at signup, funnel (activated/upgraded), 12-mo
  margin-based accrual into `commission_ledger`. Fold in the 10% affiliate.
- **C — White-label partner program.** Partner role, recruit page, footer toggle, partner dashboard,
  rate ≤ cap, owner Partners tab.
- **D — God sales org.** sales_manager + platform-scope reps, cross-white-label attribution,
  new-white-label-landed commission, Sales Manager console.
- **E — Payouts.** payout_settings, PayPal Payouts + Stripe Connect, 21st batch run + Sales Manager
  approval, cash-or-credit per program.
- **F — Economics rollup.** Commission expense in god + owner dashboards.

## Testing
Pure: commission math (margin basis, rate, window cutoff, free-credit excluded). Integration:
attribution one-code-per-signup, funnel transitions, accrual on paid payment within/after window,
payout batch idempotency per month, rate-cap enforcement, role access (partner reports-only, sales
manager no P&L).

## Out of scope (v1)
Multi-tier/MLM (partners recruiting partners for override commission); tax forms (1099); partner
marketing assets library; real-time payout (stays monthly).
