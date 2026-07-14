# Phase 2 — /advertise Portal Design

**Date:** 2026-06-02
**Status:** Draft v1 — awaiting founder review
**Prereq:** Phase 1 (white-label outreach) live & verified — `docs/superpowers/specs/2026-06-02-phase1-whitelabel-outreach-design.md`
**Next:** Phase 3 (per-click billing wired into the optimizer); Phase 4 (real eCPM/exploration optimizer)

---

## 1. Overview

Phase 2 opens the outbound pool to **third-party advertisers** — anyone outside the r0cketship tenant network — who pay r0cketship to drop their ads into our outbound email stream.

**Phase 1 model:** the white-label tenant sets one outreach offer; every new lead in their database gets that offer dripped through the shared pool.

**Phase 2 adds:** advertisers sign up at `/advertise`, fund a wallet, configure one or more **campaigns** (creative + CPA target + targeting filters), and the optimizer plugs their ads into the outbound stream alongside tenant offers. Advertisers pay **per click** to their CTA link, capped at the CPA they set.

The mailbox pool stays unified — tenant offers and advertiser ads compete for the same send slots. The optimizer's job is to maximize revenue per slot while keeping the pool fair to tenants (who pay monthly subscription fees and would churn if their offers stopped going out).

---

## 2. Personas & Core Flows

### Advertiser (new persona)
- Signs up at `/advertise/signup` with email + password (separate auth scope from customers/tenants/agents)
- Optionally captures `?ref=<code>` for referral attribution
- Gets **$10 in free advertising credit** immediately on signup
- Creates 1+ **campaigns** (each with: creative + CPA target + targeting filters)
- After $10 free credit is spent, must deposit minimum **$1,000** to keep running (no refunds)
- Edits CPA, creative, targeting at any time — system applies changes within minutes
- Cannot withdraw funds. Deposit is one-way.

### God / r0cketship operator
- Reviews and approves new advertisers + new campaigns
- Toggles `auto_approve_advertisers` (default ON) and `auto_approve_campaigns` (default ON) in admin settings
- Can freeze any advertiser or campaign instantly
- Sees pool revenue split (tenant offers vs advertiser ads) on dashboard

### Tenant (existing, separation rule)
- A tenant manager **cannot** become an advertiser using their tenant login. If they want to advertise in the national pool, they must create a **separate** advertiser account with a different email — no data linkage. This is a hard separation enforced at the auth layer.

---

## 3. Locked Decisions

| Decision | Value |
|---|---|
| Self-serve signup | YES |
| Free signup credit | $10 |
| Minimum deposit after free credit | $1,000 |
| Pricing model | Cost-per-click (effectively CPA where action = click on their CTA link) |
| **Minimum CPA floor** | **$5.00 per click** — floor enforced server-side. Advertisers can go up from there. |
| Daily cap per advertiser | 25% of pool capacity per day (prevents monopolization). Cap is **not** shown to advertiser — it's a backend guardrail only. |
| Refunds | NONE. Deposit is one-way. Admin-only refund path exists for fraud/abuse cases. |
| **Coupons** | Reuse existing coupon system (per Phase 5a). God can issue coupons to discount specific advertisers or as promotional credit. |
| Tenant ↔ advertiser separation | Hard separation. Must use different account/email. |
| Multiple campaigns per advertiser | YES. One advertiser → N campaigns. |
| Wallet model | ONE wallet per advertiser, shared across their campaigns |
| Targeting filters available | ZIP, lead segment, age tier, niche/tenant, predicted income, any indexed person field |
| Optimization weighting | 50% revenue-weighted, 50% fairness-weighted (round-robin across active campaigns + tenant offers) |
| Auto-approve advertisers (god toggle) | Default ON |
| Auto-approve campaigns (god toggle) | Default ON |
| Referral commission | 15% of advertiser spend, paid for first 12 months from advertiser signup, to referrer's existing r0cketship account |
| Delivery promise | Best-effort against CPA target. We work the pool until we hit it. No SLA. |

---

## 4. Data Model

### New tables (migration 0021)

**`advertisers`** — top-level account
- `id` (uuid, pk)
- `email` (unique)
- `password_hash` (scrypt, matches `customers`/`users` pattern)
- `display_name`
- `status` (`pending` | `approved` | `frozen` | `suspended`)
- `wallet_balance_cents` (int, default 0) — denormalized from ledger SUM
- `referrer_user_id` (nullable fk into `users` or `customers`) — set at signup from `?ref=`
- `referrer_payout_window_starts_at` (timestamp, set at signup)
- `referrer_payout_window_ends_at` (timestamp, = starts_at + 12 months)
- `created_at`, `updated_at`

**`advertiser_sessions`** — separate session table from customers (clean isolation)
- `id`, `advertiser_id`, `token_hash`, `expires_at`, `created_at`

**`advertiser_campaigns`** — one row per campaign
- `id` (uuid, pk)
- `advertiser_id` (fk)
- `name` — advertiser-facing label
- `status` (`pending` | `active` | `paused` | `out_of_budget` | `rejected` | `frozen`)
- **Creative fields:**
  - `email_subject` (varchar 255)
  - `email_body_html` (text, DOMPurified)
  - `cta_url` (the link to track clicks against)
  - `cta_label` (visible button text)
- **Pricing:**
  - `max_cpa_cents` (int) — what the advertiser is willing to pay per click
  - `daily_budget_cents` (int, nullable) — optional per-campaign daily cap
- **Targeting (JSONB filter blob):**
  - `targeting_filters` JSONB — `{zip: [...], segments: [...], age_tiers: [...], niches: [...], income_min, income_max, ...}`
- **Stats (denormalized for dashboard speed):**
  - `total_sends`, `total_clicks`, `total_spend_cents`
  - `today_sends`, `today_clicks`, `today_spend_cents` (reset by daily cron)
- `created_at`, `updated_at`, `approved_at`, `approved_by` (god user_id)

**`advertiser_payments`** — deposits (mirrors `payments` table pattern)
- `id`, `advertiser_id`, `amount_cents`, `provider` (`stripe`|`paypal`|`manual`), `provider_payment_id`, `purpose` (`signup_bonus`|`deposit`), `confirmed_at`, `created_at`

**`advertiser_ledger`** — immutable spend/credit log
- `id`, `advertiser_id`, `campaign_id` (nullable), `delta_cents` (positive = credit, negative = spend), `type` (`signup_bonus`|`deposit`|`click_charge`|`refund_admin_only`), `ref_id` (click event id, payment id, etc.), `created_at`

**`advertiser_send_events`** — every ad email send (for stats + dedup)
- `id`, `campaign_id`, `lead_id` (the recipient), `mailbox_id`, `sent_at`, `tracking_token` (unique, used in `/c/<token>` URL)
- Idempotency: unique `(campaign_id, lead_id)` so one advertiser can't pay to email the same lead twice.

**`advertiser_click_events`** — click on tracked CTA
- `id`, `send_event_id` (fk), `campaign_id`, `clicked_at`, `charge_cents` (the CPA charged), `user_agent`, `ip`
- Each click → also writes an `advertiser_ledger` row with `delta_cents = -charge_cents`

**`advertiser_referrals`** — referral attribution (one row per advertiser)
- `id`, `advertiser_id` (unique), `referrer_user_id`, `referrer_kind` (`customer`|`tenant_manager`|`agent`|`external`), `commission_pct` (default 15), `window_ends_at`, `total_paid_out_cents`

**`advertiser_referral_payouts`** — each commission payout
- `id`, `referral_id`, `triggering_charge_id` (the click event), `amount_cents`, `paid_to_account_kind`, `paid_to_account_id`, `created_at`

### Extensions to existing tables

**`tenant_integrations`** — add columns:
- `god_auto_approve_advertisers` (bool, default true)
- `god_auto_approve_campaigns` (bool, default true)

(Stored on r0cketship.com's tenant row only — these are god-level settings.)

---

## 5. Routes & UI

### Public marketing
- **`/advertise`** — marketing landing page
  - Hero: "Buy access to America's highest-intent inbox network. CPA-based. Self-serve. $10 free."
  - Explain the network, CPA model, targeting, referral program
  - CTA: "Start with $10 free →"

### Advertiser app (auth scope = `advertiser`)
- **`/advertise/signup`** — email + password + optional `?ref=` capture; creates advertiser, auto-grants $10 credit (writes `advertiser_ledger` row)
- **`/advertise/login`** — separate from customer login
- **`/advertise`** (after auth) — dashboard
  - Wallet balance
  - Per-campaign rollup: sends today, clicks today, spend today
  - 7-day trend chart
  - Optimizer recommendation banner (e.g., "Increase CPA to $X to start receiving traffic" if no sends in 24h)
- **`/advertise/campaigns`** — list
- **`/advertise/campaigns/new`** — create form
  - Name, subject, body HTML editor, CTA URL, CTA label, max CPA, daily budget, targeting filters
  - Live "estimated reach" preview: "Your targeting matches ~12,400 leads. At your CPA, expect ~X clicks/day."
- **`/advertise/campaigns/[id]`** — edit (status, creative, targeting, CPA) + per-campaign stats
- **`/advertise/billing`** — wallet balance, deposit history, ledger (spend rows), deposit form (Stripe/PayPal via existing provider abstraction)
- **`/advertise/referral`** — advertiser's own referral code + earnings (if they're also a referrer)
- **`/advertise/settings`** — account settings, password change

### God admin (auth scope = `god`)
- **`/admin/advertisers`** — list all, filter by status
- **`/admin/advertisers/[id]`** — detail view: profile, wallet history, all campaigns, recent activity
  - Actions: approve / reject / freeze / unfreeze / refund (admin-only ledger entry)
- **`/admin/advertisers/pending`** — queue of pending advertisers (when auto-approve is OFF)
- **`/admin/campaigns/pending`** — queue of pending campaigns (when auto-approve is OFF)
- **`/admin/settings/marketplace`** — toggles for `auto_approve_advertisers`, `auto_approve_campaigns`, pool revenue split visualization

### Public click tracker (extends Phase 1)
- **`/c/<token>`** — already exists for tenant CTAs. Extend to dispatch:
  - If token belongs to `outreach_sends` (Phase 1 tenant) → existing behavior
  - If token belongs to `advertiser_send_events` → record `advertiser_click_event`, charge wallet, redirect to advertiser's CTA URL

---

## 6. Optimizer Logic (v1 — heuristic; real eCPM engine is Phase 4)

For each available send slot in the pool, the scheduler asks: "what should this slot send?"

### Step 1: Build the eligible-content set
For the lead about to be emailed:
- **Tenant offers:** the lead's owning tenant has an active offer → tenant offer is eligible (Phase 1 behavior, must-send for that tenant's own leads to honor monthly subscription)
- **Advertiser campaigns:** all campaigns where (a) status=`active`, (b) wallet balance ≥ max_cpa_cents, (c) `targeting_filters` match the lead, (d) daily cap not exceeded, (e) idempotency: `(campaign_id, lead_id)` not in `advertiser_send_events`

### Step 2: Decide tenant-offer vs advertiser-ad for this slot
- **Tenant own-lead rule:** if the lead belongs to a tenant with an active offer AND the tenant has < N free sends/day (configurable, e.g., 50% of their lead inflow), the slot goes to the tenant offer. This honors the Phase 1 subscription promise.
- **Otherwise**, fall through to advertiser selection.

### Step 3: Pick advertiser campaign (50/50 blend)
- **Revenue side:** for each eligible campaign, compute `expected_value = max_cpa_cents × estimated_click_rate`
  - For campaigns with ≥100 sends of history: `estimated_click_rate = total_clicks / total_sends`
  - For campaigns with < 100 sends: assume baseline 1% click rate (exploration)
- **Fairness side:** compute `fairness_score = 1 / (1 + sends_today)` — campaigns with fewer sends today get higher fairness
- **Blended score:** `score = 0.5 × normalize(expected_value) + 0.5 × normalize(fairness_score)`
- **Selection:** weighted-random pick (not strict argmax) so even lower-scored campaigns occasionally win — this is the exploration bandit.

### Step 4: Send + record
- Render advertiser creative into email template (preserve tracked CTA `/c/<token>`)
- Write `advertiser_send_events` row
- Increment campaign `total_sends`, `today_sends`

### Step 5: On click
- `/c/<token>` lookup → `advertiser_click_events` insert with `charge_cents = max_cpa_cents`
- Write `advertiser_ledger` row (-charge_cents)
- Update campaign `total_clicks`, `today_clicks`, `total_spend_cents`
- If wallet balance < smallest active campaign's `max_cpa_cents`, mark affected campaigns `out_of_budget`
- Trigger referral payout: if advertiser has `referral_window_ends_at > now()`, write `advertiser_referral_payout` (15% of charge) and credit the referrer

### Caps & guardrails
- **Per-advertiser daily cap:** max 25% of pool's daily capacity. Prevents monopolization.
- **Per-campaign daily budget:** if set, hard stops sends when reached.
- **Pool-level reserve:** at least 30% of daily slots reserved for tenant offers (own-lead inflow), so subscribers always have outbound flow.

---

## 7. Billing & Accounting

### Money in
- Reuses existing `PaymentProvider` interface but with a **separate Stripe key set** dedicated to the advertising marketplace (so advertiser revenue is cleanly segregated from tenant/customer revenue in Stripe reporting). New columns on `tenant_integrations` (r0cketship.com tenant only): `advertising_stripe_secret_key_enc`, `advertising_stripe_publishable_key_enc`, `advertising_stripe_webhook_secret_enc`. God enters these at `/admin/integrations` once Stripe account is set up.
- **Day-1 behavior** (before Stripe keys are entered): the system operates in **manual mode**. Advertiser signups still grant the $10 free credit (so they can play and test). When the advertiser needs to deposit, they submit a deposit request → god receives notification → god marks paid in `/admin/advertisers/[id]` with optional Stripe invoice reference → `advertiser_payments` row + `advertiser_ledger +deposit` written → wallet credited. God can also issue **coupon credits** (from the existing coupon system) at any time as a discount or promotional grant.
- **Once Stripe keys are present:** advertiser `/advertise/billing` deposit form switches to Stripe Checkout; webhook confirms → automatic crediting.
- Minimum deposit $1,000 after free $10 is exhausted (UI enforced + API enforced).

### Money out
- Click events charge `max_cpa_cents` to wallet
- Wallet can go to zero but never negative (idempotent guard in the click handler)
- No refunds (admin override path only — `type='refund_admin_only'`, used for fraud/abuse cases; never customer-requested)

### Reporting
- Advertiser sees: full ledger, daily/weekly/monthly spend, per-campaign breakdown
- God sees: aggregate marketplace revenue, top advertisers by spend, pool fill rate (advertiser ads / total sends), referral payouts

---

## 8. Referral Program (15% × 12 months)

### Capture
- `/advertise/signup?ref=<code>` — if code resolves to an existing user (customer / tenant_manager / agent), set `advertisers.referrer_user_id`
- Window: 12 months from `referrer_payout_window_starts_at` = signup date
- Once window expires, no more payouts (campaign keeps running, just no referral commission)

### Payout mechanics
- Every advertiser click charge → check if advertiser has active referral window → if yes, calculate 15% of charge, write `advertiser_referral_payout`, credit referrer's account:
  - If referrer is a customer: credit their `credit_ledger` (becomes lead-purchase credits)
  - If referrer is a **tenant_manager**: paid out **personally** to the manager's own balance — NOT to the tenant's revenue line. This requires a new personal `manager_wallet` for tenant_manager users (added in migration 0021 alongside advertiser tables) so they have a place to receive these payouts. The manager can withdraw via the same Stripe path used for advertiser payouts (or roll the balance into customer-style credits if they want).
  - If referrer is an agent: credit their agent commission balance (existing Phase 11 dialer structure)

### Referrer-side UI
- Existing `/affiliate` page (customer-side) gets a new section: "Advertiser referrals" with running totals
- Tenant admin gets a section in `/admin/integrations` showing their referral earnings from advertisers

### Edge cases
- If referrer's account is deleted/disabled before payout window ends → payouts continue to be accrued but go to a "house" account (suspense ledger) that god can re-attribute manually
- An advertiser cannot refer themselves (same email guard)
- Tenant managers can refer advertisers — this is a strong incentive for them to push the marketplace

---

## 9. Compliance & Legal

### Content policy (god-enforceable)
- All advertiser content must comply with CAN-SPAM, TCPA, GDPR/CCPA — same as Phase 1
- Restricted categories (auto-rejected by god UI policy, surfaced as recommendations):
  - Firearms, ammunition, weapons sales
  - Gambling without legitimate license
  - Adult content
  - Cryptocurrency offers (case-by-case)
  - Anything pretending to be from r0cketship or another tenant
- DOMPurify sanitization on `email_body_html` at write time (same Phase 4 hardening as tenant footer)
- Required: physical address in footer (auto-appended if not present), unsubscribe link auto-injected

### T&C (advertiser signup checkbox)
- "I acknowledge: (a) no refunds on deposits; (b) r0cketship may pause/reject any content; (c) my CPA is a maximum, not a guarantee; (d) I am responsible for my CTA destination's legality."

### Audit trail
- Every send/click is logged forever (`advertiser_send_events`, `advertiser_click_events`)
- God can pull a full export per advertiser for legal/audit response

---

## 10. Tenant ↔ Advertiser Separation (Hard Rule)

- Tenant manager accounts cannot create an advertiser account from inside the tenant app
- If they want to advertise in the national pool, they go to `/advertise/signup` and create a separate account with a different email
- Backend enforcement: `advertisers.email` cannot match any active `users.email` where the user has role `tenant_manager` or `god`
  - Workaround: they use a personal/work email distinct from their tenant login
- No data sharing: their tenant's lead pool and their advertiser campaigns live in completely separate auth scopes
- This is for legal clarity (avoid mingling tenant subscription dollars with advertiser dollars) and to avoid conflict-of-interest in the optimizer

---

## 11. Auto-Approve Toggle Details

**God settings page `/admin/settings/marketplace`:**
- `auto_approve_advertisers`: bool, default `true`. When ON, new advertiser signups immediately move from `pending` → `approved`. When OFF, sit in pending queue until god reviews.
- `auto_approve_campaigns`: bool, default `true`. Same logic for new campaign submissions.
- Both can be toggled mid-flight. Toggling OFF doesn't retroactively suspend approved entities — only affects future submissions.
- Even with auto-approve ON, god can manually `freeze` any advertiser or campaign at any time (sets status, optimizer skips immediately).

---

## 12. UX details for advertisers (the "we optimize to success" framing)

The signup and campaign-edit flows should embed the philosophy you described — "we optimize to success, we know your customers, but we want your input."

- **Default targeting** = no filters (broadest pool, system optimizes)
- **Recommended targeting** = system suggests based on advertiser's CTA URL category (auto-detected via heuristic / future ML)
- **Custom targeting** = advertiser overrides
- **Banner on campaign edit:** "We optimize to your CPA. The fewer filters, the more options we have to deliver. Use filters when you know your customer better than us — and we'll honor them."
- **Reach estimator:** real-time "Your targeting matches ~X leads. Expected daily clicks at your CPA: ~Y."
- **Optimizer recommendations (admin-visible only on advertiser dashboard):** "Your CPA is below the marketplace median for your category. Increase to $Z to start receiving traffic." or "Lift your daily cap — you ran out at 11am yesterday."

---

## 13. Operational rollout

### Pre-launch checklist
- [ ] Migration 0021 (all new tables + new columns)
- [ ] Auth scope `advertiser` (separate sessions table, separate middleware)
- [ ] Stripe/PayPal deposit flow + minimum $1,000 validation
- [ ] Optimizer integration into existing Phase 1 scheduler (currently `src/outreach/scheduler.ts`)
- [ ] Click handler at `/c/<token>` extended to handle advertiser tokens + wallet debit
- [ ] Referral capture + payout into existing affiliate ledger
- [ ] DOMPurify on email_body_html
- [ ] Daily caps cron (resets `today_*` counters at UTC midnight)
- [ ] Out-of-budget detection + status update
- [ ] Bounce/suppression integration (advertiser sends must respect `email_suppression` table)
- [ ] God admin pages (`/admin/advertisers`, `/admin/settings/marketplace`)
- [ ] Public marketing page at `/advertise`

### Launch state
- System ships in same dormant pattern as Phase 1: no advertiser traffic until first signup
- First few advertisers: god flips auto-approve OFF temporarily, hand-approves first 10 to validate quality
- Once quality bar is set, flip auto-approve back ON

---

## 14. Out of Scope (deferred to Phase 3+)

- Real eCPM/exploration-exploitation bandit (Phase 4 — Phase 2 ships with simple 50/50 heuristic)
- Per-conversion postback API (advertiser pings us "this click converted, charge $X more") — Phase 3 candidate
- Advertiser API for programmatic campaign management
- Self-serve advertiser-to-advertiser refund/dispute mechanism (no refunds policy makes this unnecessary v1)
- Brand-safety AI scan of creative (manual god review covers it v1)
- A/B testing within a single campaign (creative variants) — Phase 4
- Lookalike audience building from converters
- Multi-currency support (USD only)

---

## 15. Founder Decisions (locked 2026-06-02)

| # | Question | Decision |
|---|---|---|
| 1 | Minimum CPA floor | **$5.00 per click** — enforced server-side. Same floor across all CTA types (booking, order, sale, site visit). Advertisers can go higher. |
| 2 | Pool reserve for tenants | **30% of daily slots** reserved for tenant-owned-lead sends. |
| 3 | Tenant-manager referral payout | **Paid personally** to the manager via new `manager_wallet`. Not to the tenant revenue line. |
| 4 | Daily cap visibility | (Re-clarified) — see Section 17 below. |
| 5 | `/advertise` marketing copy | **Founder handles the lander** separately. Spec covers the auth'd app only. |
| 6 | Free-credit abuse | **Gated:** email verification required + **1 signup per email** + **1 signup per IP per 24h**. $10 only granted after email click-through. |
| 7 | Stripe vs manual | **Both paths supported.** Advertising-marketplace gets its **own dedicated Stripe key set** (separate from tenant/customer Stripe). Ship in manual mode (god marks paid + credits manually + coupons available); flip to Stripe automatically when keys are pasted in `/admin/integrations`. |

---

## 17. Clarification on Q4 — daily cap visibility

**The question I was asking:** to prevent any one advertiser from monopolizing the entire outbound pool on a single day, we cap their daily send volume at 25% of the pool's daily capacity. Example: if the pool sends 100,000 emails/day, one advertiser can consume at most 25,000 of those slots — even if their wallet could pay for more clicks.

**The choice:** should we (a) show this cap in the advertiser's dashboard ("You hit your 25% daily cap at 11:14am — your sends paused until midnight UTC"), or (b) keep it invisible and just let them notice "their sends sometimes throttle"?

**My recommendation: HIDE it (option b).** Reasoning:
- The 25% cap is a network-health guardrail, not a customer-facing feature
- Exposing it invites gaming ("how do I get a higher cap?") and creates noise
- The advertiser still sees their daily spend and click count — they just don't see "you hit a cap"; from their perspective the system was simply selecting fewer of their ads that day
- God can raise the cap manually for trusted high-spenders, kept as a backstage lever

**Locked decision:** hidden by default. Re-visit in Phase 4 if a strategic advertiser asks for transparency.

---

## 16. Acceptance criteria for Phase 2 shipped

- [ ] An advertiser can sign up at `/advertise/signup`, receive $10 free credit, configure a campaign with creative + CPA + targeting, and see it move to `active` (auto-approve ON path).
- [ ] Within minutes of campaign going active, the optimizer starts including it in send selections for matching leads.
- [ ] Clicks on the advertiser's tracked CTA URL charge the wallet at the configured CPA and write a referral payout if the advertiser was referred.
- [ ] When wallet < smallest active campaign CPA, affected campaigns flip to `out_of_budget` and stop sending.
- [ ] Advertiser can deposit $1,000+ via Stripe Checkout and resume.
- [ ] God can flip auto-approve OFF and see pending queues at `/admin/advertisers/pending` and `/admin/campaigns/pending`.
- [ ] Tenant manager attempting to sign up with their existing tenant email at `/advertise/signup` gets rejected with a clear message.
- [ ] All advertiser send/click data exportable from god UI.
- [ ] No Phase 1 regressions: existing tenant outreach continues to flow at >70% of historical daily volume.
- [ ] 40+ new tests covering data model, auth scope isolation, optimizer selection, referral payout math, daily caps, out-of-budget transitions.

---

## Next step

Founder reviews → answers Section 15 → I draft the implementation plan (file: `docs/superpowers/plans/2026-06-02-phase2-advertise-portal.md`) with task breakdown, dependency order, and test plan.
