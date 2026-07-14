# Phase 2 — /advertise Portal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Spec:** `docs/superpowers/specs/2026-06-02-phase2-advertise-portal-design.md`
**Prereq:** Phase 1 (white-label outreach) live & verified (2026-06-02)
**Goal:** Open the outbound pool to third-party advertisers via a self-serve portal at `/advertise/signup`. Advertisers fund a wallet, configure campaigns (CPA + creative + targeting), and the optimizer plugs their ads into the existing outbound stream alongside tenant offers. CPA-based, $5 floor, 50/50 revenue/fairness optimization, hard tenant separation, 15%×12mo referrals.

**Architecture:** New `src/advertiser/` module — auth scope (`advertiser` role), wallet/ledger, campaign CRUD, targeting filters, optimizer integration, click handler dispatch, referral payouts. New admin pages under `/admin/advertisers`. Marketing page at `/advertise` already shipped — this plan picks up at the signup form.

**Tech Stack:** Next.js 15 App Router, Drizzle ORM + node-postgres, drizzle-kit migrations, nodemailer (existing pool reuse), DOMPurify (isomorphic).

---

### Task 1: Schema — advertiser tables + tenant integrations columns
**Files:** Modify `src/db/schema.ts`; generate `drizzle/0021_*.sql`.

New tables:
- `advertisers`: id(uuid), email(text unique), passwordHash, displayName, status enum `advertiser_status`(pending|approved|frozen|suspended) default pending, walletBalanceCents(int default 0), referrerUserId(text nullable), referrerKind enum `referrer_kind`(customer|tenant_manager|agent|external), referrerWindowStartsAt(ts), referrerWindowEndsAt(ts), createdAt, updatedAt, emailVerifiedAt(ts nullable), emailVerifyToken(text nullable).
- `advertiser_sessions`: id, advertiserId(FK), tokenHash(text unique), expiresAt(ts), createdAt.
- `advertiser_intake`: id, advertiserId(FK), businessName, businessUrl, industry, employeeCountBand, annualRevenueBand, yearsInBusiness(int), dunsNumber(text nullable), ownershipType enum(public|private|nonprofit|government), customerLtvCents(int nullable), typicalCacCents(int nullable), targetKpi enum(booking|order|sale|site_visit|other), targetGeographyText(text nullable), monthlyAdBudgetCents(int nullable), referralSource(text nullable), offerPath enum `offer_path`(pay_for_success|strategic_partner), aboutBusiness(text nullable), phone, createdAt.
- `advertiser_campaigns`: id(uuid), advertiserId(FK), name, status enum `campaign_status`(pending|active|paused|out_of_budget|rejected|frozen) default pending, emailSubject, emailBodyHtml(text), ctaUrl, ctaLabel, maxCpaCents(int CHECK ≥ 500), dailyBudgetCents(int nullable), targetingFilters(jsonb default '{}'), totalSends(int default 0), totalClicks(int default 0), totalSpendCents(int default 0), todaySends(int default 0), todayClicks(int default 0), todaySpendCents(int default 0), createdAt, updatedAt, approvedAt(ts nullable), approvedByUserId(text nullable). Index on (status, advertiserId).
- `advertiser_payments`: id, advertiserId(FK), amountCents(int), provider enum(stripe|paypal|manual|coupon), providerPaymentId(text nullable), purpose enum `adv_payment_purpose`(signup_bonus|deposit|coupon_grant|admin_grant), confirmedAt(ts), createdAt.
- `advertiser_ledger`: id, advertiserId(FK), campaignId(FK nullable), deltaCents(int), type enum `adv_ledger_type`(signup_bonus|deposit|click_charge|refund_admin|coupon_grant|admin_grant), refId(text nullable), createdAt. Index on (advertiserId, createdAt).
- `advertiser_send_events`: id, campaignId(FK), leadId(FK), mailboxId(FK), sentAt(ts), trackingToken(text unique). Unique(campaignId, leadId). Index on (sentAt), (campaignId, sentAt).
- `advertiser_click_events`: id, sendEventId(FK), campaignId(FK), clickedAt(ts), chargeCents(int), userAgent(text), ip(text), createdAt. Index on (campaignId, clickedAt).
- `advertiser_referrals`: id, advertiserId(FK unique), referrerUserId, referrerKind, commissionPct(int default 15), windowEndsAt(ts), totalPaidOutCents(int default 0).
- `advertiser_referral_payouts`: id, referralId(FK), triggeringClickId(FK), amountCents, paidToAccountKind enum(customer_wallet|manager_wallet|agent_balance), paidToAccountId(text), createdAt.
- `manager_wallets`: id, userId(FK unique to `users` where role=manager), balanceCents(int default 0), createdAt, updatedAt.
- `manager_wallet_ledger`: id, walletId(FK), deltaCents(int), type enum(advertiser_referral|admin_adjustment|withdrawal), refId(text nullable), createdAt.

Modify `tenant_integrations` (r0cketship.com row only):
- `advertisingStripeSecretKeyEnc text`, `advertisingStripePublishableKeyEnc text`, `advertisingStripeWebhookSecretEnc text`
- `godAutoApproveAdvertisers boolean default true`
- `godAutoApproveCampaigns boolean default true`

- [ ] Add tables/enums/columns to schema, `npx drizzle-kit generate`, review generated SQL for FK + unique constraints + indexes. Confirm no breaking changes to existing tables.

---

### Task 2: Advertiser auth scope — `src/auth/advertiser.ts`
**Files:** Create `src/auth/advertiser.ts`, `src/auth/advertiser.test.ts`. Extend `src/auth/session.ts` if needed.

- `createAdvertiser({ email, password, referrerCode? })` → inserts advertiser with emailVerifyToken set, returns advertiser id; rate-limit checked separately.
- `verifyAdvertiserEmail(token)` → set emailVerifiedAt, grant $10 signup bonus via `advertiser_ledger + advertiser_payments(purpose='signup_bonus')`, update wallet balance.
- `loginAdvertiser({ email, password })` → returns session token (in `advertiser_sessions`), separate cookie name `adv_session`.
- `getAdvertiserContext()` from cookies; returns `{ advertiser, session } | null`.
- `requireAdvertiserAuth()` middleware helper.
- `logoutAdvertiser()` clears session.
- Password hashing reuses existing scrypt pattern from `src/auth/users.ts`.

- [ ] TDD: createAdvertiser stores hash, verifyAdvertiserEmail issues bonus exactly once (idempotent), login validates password, getAdvertiserContext finds session.

---

### Task 3: Rate-limit + tenant-separation guards
**Files:** Create `src/auth/advertiser_signup_guards.ts`.

- `checkSignupRateLimit({ ip, email })` → enforces 1 signup per email AND 1 signup per IP per 24h (uses a small `signup_attempts_adv` table OR reuses existing `signup_attempts` with a `kind` column). Returns `ok | rateLimited`.
- `checkTenantSeparation({ email })` → rejects if `email` matches any active `users.email` where role in (`god`, `manager`). Returns `ok | rejected_tenant_email`.

- [ ] TDD: rate-limit allows 1st, blocks 2nd same-IP within 24h; tenant-email rejection works for god+manager.

---

### Task 4: Signup intake form — `app/advertise/signup/page.tsx` + server action
**Files:** Create `app/advertise/signup/page.tsx`, `app/advertise/signup/actions.ts`, `app/advertise/verify/page.tsx`.

- `app/advertise/signup/page.tsx`: form with comprehensive intake fields. Reads `?offer=` query param into a hidden input (`offerPath`). Captures `?ref=` for referral. Renders dark-themed (matches `/advertise` marketing page styling). Fields exactly as defined in Task 1 `advertiser_intake` schema, plus the auth fields (email, password, confirm password). T&C checkbox (no refunds + content responsibility). On submit → server action.
- `actions.ts: signUpAdvertiserAction(formData)` → validates fields, runs `checkSignupRateLimit` + `checkTenantSeparation`, creates advertiser + intake row in a transaction, sends verify email via existing `nodemailer` pool, redirects to `/advertise/signup/check-email`.
- `app/advertise/verify/page.tsx?token=...`: calls `verifyAdvertiserEmail(token)`, if successful redirects to `/advertise/login?just_verified=1`; on failure shows clear error.

- [ ] Build form UI with all fields. Server action with validation + DB inserts + email send. Verify route with redirect. Manual QA: signup → check-email screen → click link in email → land on /advertise/login.

---

### Task 5: Login + dashboard skeleton
**Files:** `app/advertise/login/page.tsx`, `app/advertise/page.tsx` (auth'd version — note: the marketing page is at `/advertise` for unauth; for auth'd users we should redirect to `/advertise/dashboard`), `app/advertise/dashboard/page.tsx`, `app/advertise/_layout/AdvertiserShell.tsx`.

- Login page mirrors `/login` styling but uses advertiser action.
- Middleware/layout decision: at `/advertise`, check for `adv_session` cookie. If present → redirect to `/advertise/dashboard`. If absent → render marketing page (existing).
- Dashboard skeleton: wallet balance card, per-campaign rollup placeholder, "no campaigns yet → create your first" empty state.
- AdvertiserShell: top nav with r0cketship branding + email + wallet badge + logout; left sidebar with links (Dashboard, Campaigns, Billing, Referral, Settings).

- [ ] Build all 4 files. Manual QA: login flow works, dashboard renders empty state.

---

### Task 6: Wallet + ledger module — `src/advertiser/wallet.ts`
**Files:** `src/advertiser/wallet.ts`, `wallet.test.ts`.

- `walletBalance(advertiserId)` — SUM of `advertiser_ledger` (authoritative; `advertiser.walletBalanceCents` is denormalized cache).
- `grantSignupBonus(advertiserId)` — idempotent; checks no prior `purpose='signup_bonus'` payment exists; inserts payment + ledger row of `+1000` cents; updates cached balance.
- `depositManual(advertiserId, amountCents, adminUserId, providerRef)` — inserts `advertiser_payment(provider='manual', purpose='deposit')` + ledger row; enforces minimum $1000 (=100000 cents) for non-coupon deposits.
- `depositStripe(advertiserId, amountCents, stripePaymentId)` — same but `provider='stripe'`; called from webhook.
- `grantCoupon(advertiserId, couponCode, adminUserId)` — looks up coupon (reusing existing coupons table), creates `payment(provider='coupon', purpose='coupon_grant')` + ledger row. No $1000 minimum applies. Marks coupon redeemed.
- `chargeForClick(advertiserId, campaignId, clickId, amountCents)` — inserts ledger row `delta = -amountCents`; updates cached balance; returns new balance.
- `reconcileBalance(advertiserId)` — recomputes from ledger SUM, updates cache row. Called periodically.

- [ ] TDD: bonus is idempotent, deposit minimum enforced, coupon path bypasses minimum, click charge can go to zero (never negative — enforce CHECK constraint or guard).

---

### Task 7: Stripe advertising provider — `src/billing/providers/stripe_advertising.ts`
**Files:** Create `src/billing/providers/stripe_advertising.ts`, `app/api/webhooks/stripe-advertising/route.ts`, `app/api/advertiser/deposit/route.ts`.

- Separate Stripe key set: reads `advertisingStripeSecretKeyEnc` from r0cketship.com's `tenant_integrations` row (decrypted at runtime).
- `createAdvertiserCheckoutSession(advertiserId, amountCents)` → returns Stripe Checkout URL with metadata `{advertiserId, kind: 'advertiser_deposit'}`.
- Webhook `/api/webhooks/stripe-advertising` → verifies signature with `advertisingStripeWebhookSecretEnc`, on `checkout.session.completed` → call `depositStripe()`.
- If advertising Stripe keys not configured, the deposit form switches to a "request deposit" mode that creates a pending payment record + emails god.

- [ ] TDD: key resolution from tenant_integrations, checkout session call mocked, webhook signature verify, idempotency (don't double-credit same `providerPaymentId`).

---

### Task 8: Campaign CRUD — `src/advertiser/campaigns.ts`
**Files:** `src/advertiser/campaigns.ts`, `campaigns.test.ts`.

- `createCampaign(advertiserId, input)` → inserts campaign row with `status = pending` (or `active` if god `auto_approve_campaigns=true`). Validates `maxCpaCents ≥ 500`. DOMPurifies `emailBodyHtml`.
- `updateCampaign(advertiserId, campaignId, patch)` → owner check; allows updating creative, CPA, targeting, daily budget. DOMPurify again on body update.
- `pauseCampaign(advertiserId, campaignId)` / `resumeCampaign` — owner check.
- `listCampaigns(advertiserId)` → all campaigns for advertiser with stats.
- `getCampaign(campaignId)` → single campaign with stats (no owner check; caller enforces).

- [ ] TDD: $5 floor enforced, owner checks block cross-advertiser updates, DOMPurify strips `<script>` tags, default status follows `god_auto_approve_campaigns` flag.

---

### Task 9: Reach estimator — `src/advertiser/targeting.ts`
**Files:** `src/advertiser/targeting.ts`, `targeting.test.ts`.

- `parseTargeting(filters)` → validates JSON shape `{zip?: string[], segments?: string[], age_tiers?: string[], niches?: string[], income_min?: number, income_max?: number}`.
- `targetingToWhereClause(filters)` → returns a Drizzle `and(...)` condition fragment querying `persons` joined to `leads`.
- `estimateReach(filters)` → executes a `SELECT COUNT(*)` against persons matching the filters. Cache for 60s per filter fingerprint to keep dashboard snappy.
- `pickEligibleCampaignsForLead(lead)` → returns campaigns with active status + sufficient balance + matching targeting + no prior send to this lead.

- [ ] TDD: filter shape validation, reach count matches a SQL count, cache returns same value for same filter within window.

---

### Task 10: Campaign UI — `/advertise/campaigns/*`
**Files:** `app/advertise/campaigns/page.tsx`, `app/advertise/campaigns/new/page.tsx`, `app/advertise/campaigns/[id]/page.tsx`, supporting client component for the targeting picker.

- List page: table of campaigns + status badge + stats.
- New page: form with name, subject, body (rich-text or plain HTML editor), CTA URL, CTA label, max CPA, daily budget, targeting filter picker (with live reach estimator display).
- Edit page: same form prefilled, plus per-campaign stats and pause/resume button.
- Banner across all campaign forms: "We optimize to your CPA. The fewer filters, the more options we have to deliver. Use filters when you know your customer better than us — and we'll honor them."

- [ ] Build pages. Manual QA: create → activates → shows on list with stats=0.

---

### Task 11: Billing UI — `/advertise/billing`
**Files:** `app/advertise/billing/page.tsx`, deposit action.

- Wallet balance hero.
- Deposit form: amount input (min $1000), submit → Stripe Checkout if keys present, else "Pending — we'll invoice you" message + admin notification.
- Ledger table: every transaction with type, amount, ref, timestamp.

- [ ] Build UI. Manual QA: deposit flow works in both modes (stripe + manual).

---

### Task 12: Optimizer integration — extend `src/outreach/scheduler.ts`
**Files:** Modify `src/outreach/scheduler.ts`, create `src/advertiser/optimizer.ts`, `optimizer.test.ts`.

For each lead the scheduler is about to send to:
1. Apply Phase 1 logic: if the lead's owning tenant has an active offer, send the tenant offer (with the 30% pool reserve rule honored).
2. Otherwise call `pickAdForLead(lead)` from advertiser optimizer:
   - Build eligible advertiser campaigns set (via `pickEligibleCampaignsForLead`).
   - Compute `expectedValue = maxCpaCents × estimatedClickRate` (1% baseline if <100 sends history; else `totalClicks/totalSends`).
   - Compute `fairnessScore = 1 / (1 + todaySends)`.
   - Blend: `score = 0.5 × normalize(expectedValue) + 0.5 × normalize(fairnessScore)`.
   - Weighted-random selection among eligible (not strict argmax — preserves exploration).
3. If no eligible advertiser ad, slot stays with tenant offer (or empty if neither).

Enforce per-advertiser daily cap (25% of pool capacity per advertiser per day). Track via Redis-style memoized count or a `pool_capacity_daily` table.

- [ ] TDD: tenant own-lead path preserved (Phase 1 regression), advertiser selection respects targeting + balance + cap, weighted-random touches all eligible over many runs.

---

### Task 13: Click handler — extend `/c/<token>` route
**Files:** Modify `app/c/[token]/route.ts`.

- Dispatch logic: lookup token in `outreach_queue` first (Phase 1); if not found, lookup in `advertiser_send_events`.
- Advertiser branch: insert `advertiser_click_events` row with charge = campaign.maxCpaCents; `chargeForClick(advertiserId, ...)`; if new balance < smallest active campaign's maxCpaCents → mark affected campaigns `out_of_budget`; trigger referral payout (Task 15); 302 redirect to campaign's `ctaUrl`.
- Wallet underflow guard: if balance already 0 at click time (race), still record click but charge 0 (transparency over collecting an impossible debt).

- [ ] TDD: tenant tokens behave as before, advertiser tokens charge wallet + create click event + redirect to ctaUrl, out_of_budget transition triggers on threshold cross.

---

### Task 14: Out-of-budget + daily-cap cron
**Files:** Modify `src/outreach/scheduler.ts` tick handler (the existing `/api/outreach/tick`).

- Daily 00:00 UTC pass: reset all `advertiser_campaigns.today*` counters to 0.
- Every tick: check each advertiser's wallet vs their lowest active campaign CPA. If insufficient, mark those campaigns `out_of_budget`. When advertiser deposits more, an action in `depositStripe`/`depositManual` re-activates `out_of_budget` campaigns that now have sufficient balance.

- [ ] Implement. Test: forced low balance triggers status change; deposit re-activates.

---

### Task 15: Referral capture + payout — `src/advertiser/referrals.ts`
**Files:** `src/advertiser/referrals.ts`, `referrals.test.ts`. Also `src/auth/manager_wallet.ts`.

- On advertiser create (Task 2): if `referrerCode` resolves to a user, insert `advertiser_referrals` with windowEndsAt = now + 12mo.
- `recordReferralPayout(advertiserId, triggeringClickId, chargeCents)` — called from click handler:
  - Look up active referral (windowEndsAt > now).
  - Compute 15% of chargeCents.
  - Determine `paidToAccountKind` from `referrerKind`:
    - `customer` → credit `credit_ledger` (existing).
    - `tenant_manager` → credit `manager_wallets` (new); also write `manager_wallet_ledger` row.
    - `agent` → credit agent balance (existing Phase 11 path).
    - `external` → no-op (deferred; could mark for manual payout).
  - Insert `advertiser_referral_payouts` row.
  - Update `advertiser_referrals.totalPaidOutCents`.

- `src/auth/manager_wallet.ts`: `getOrCreateManagerWallet(userId)`, `creditManagerWallet(userId, deltaCents, type, refId?)`, `managerWalletBalance(userId)`.

- [ ] TDD: payouts at 15%, idempotency (one payout per click), routes to correct ledger by kind, window expiry stops payouts.

---

### Task 16: God admin pages
**Files:** `app/admin/advertisers/page.tsx`, `app/admin/advertisers/pending/page.tsx`, `app/admin/advertisers/[id]/page.tsx`, `app/admin/campaigns/pending/page.tsx`, `app/admin/settings/marketplace/page.tsx`, supporting server actions.

- `/admin/advertisers`: list (filter by status), search.
- `/admin/advertisers/pending`: queue when auto-approve OFF.
- `/admin/advertisers/[id]`: full detail — profile, intake answers, all campaigns, ledger, recent activity. Action buttons: approve / reject / freeze / unfreeze / refund-admin (with confirmation) / coupon-grant.
- `/admin/campaigns/pending`: queue of pending campaigns.
- `/admin/settings/marketplace`: toggles for `auto_approve_advertisers`, `auto_approve_campaigns`. Display pool revenue split (tenant vs advertiser) and top advertisers by spend.

Add sidebar entries: "Advertisers", "Marketplace settings".

- [ ] Build all pages + actions. Manual QA: flip auto-approve OFF, sign up new advertiser, see in pending queue, approve.

---

### Task 17: Render advertiser ads in outbound — extend `src/outreach/render.ts`
**Files:** Modify `src/outreach/render.ts`.

- Add `renderAdvertiserAd(campaign, lead, mailbox)` mirroring the tenant offer renderer but pulling subject/body/cta from campaign + injecting tracked CTA `/c/<token>` (the same route, different token namespace).
- Auto-inject CAN-SPAM footer + unsubscribe link (`/u/<token>` extended to handle advertiser sends — `email_suppression` table is shared, so unsubscribe globally suppresses).
- DOMPurify the `emailBodyHtml` at render time as belt-and-suspenders (sanitized at write per Task 8, but defensive layer here too).

- [ ] TDD: render output has tracked CTA, unsub link present, scripts stripped, footer present.

---

### Task 18: Tenant separation guard at signup (Task 3 enforcement at the route level)
**Files:** Already part of Task 4's `signUpAdvertiserAction`, but ensure it's testable and surfaces a clear error UI: "It looks like you already have a tenant manager account at r0cketship. Advertiser accounts must use a separate email."

- [ ] Verify the rejection message renders, test that tenant_manager users CANNOT create advertiser accounts with their tenant email.

---

### Task 19: Daily cron — capacity reset + status sweep
**Files:** Modify the box crontab handler `app/api/outreach/tick/route.ts`.

- At UTC midnight tick: reset all `advertiser_campaigns.today*` counters.
- Every tick: sweep `advertiser_campaigns` where status = `out_of_budget` and the advertiser's wallet now has enough balance → revert to `active`.
- Every tick: sweep `advertisers` with referral windows that ended — mark closed (no functional change, just data hygiene).

- [ ] Update tick handler. Confirm cron still runs every minute (or as configured).

---

### Task 20: Marketing footer + nav links (ALREADY DONE)
**Status:** ✅ Shipped 2026-06-02. `MarketingFooter` shows "Advertise with us" link; `MarketingNav` shows "Advertise" link in top bar across all WL pages. `/advertise` marketing page exists.

---

### Task 21: Migration + production deploy
**Files:** Migration 0021 (generated from Task 1).

- Local: `DOTENV_CONFIG_PATH=.env.local npx drizzle-kit migrate` (verify locally first).
- Prod via SSH tunnel: `DOTENV_CONFIG_PATH=.env npx drizzle-kit migrate` against prod DB.
- Standard deploy: tar (exclude node_modules/.next/.git/.env*) → scp → extract → `npm install` → `npm run build` → `pm2 restart r0cketship --update-env`.

- [ ] Apply migration. Deploy. Smoke-test: visit `/advertise` (still works), `/advertise/signup` (form renders), god `/admin/advertisers` (empty list renders).

---

### Task 22: Tests — 40+ new tests
**Files:** Various `*.test.ts` under `src/advertiser/`, `src/auth/`, `tests/`.

Cover at minimum:
- Auth scope isolation (advertiser session can't access customer/tenant routes; vice versa)
- $10 signup bonus idempotent
- $5 CPA floor enforced
- $1,000 minimum deposit enforced
- Coupon path bypasses $1,000 minimum
- Tenant separation rejection on signup
- Rate limit on signups (1 per email, 1 per IP / 24h)
- DOMPurify strips dangerous HTML
- Targeting filter SQL returns expected counts
- Optimizer selection: tenant own-lead path, advertiser selection, daily cap
- Click handler: tenant token, advertiser token, out-of-budget transition
- Referral payout: 15% math, idempotency, routing by kind, window expiry
- Stripe webhook signature verify + idempotency
- Manager wallet credit/balance

- [ ] All tests written + green.

---

### Task 23: Acceptance smoke test (full flow)
**Manual sequence on prod:**

1. Visit `/advertise` → marketing page renders, click "Create an account →" with `?offer=pay-for-success`.
2. Fill signup form including all intake fields → submit → check-email screen.
3. Click verify link → land on `/advertise/login?just_verified=1`.
4. Log in → dashboard shows $10 balance, 0 campaigns.
5. Create a campaign with $5 CPA + simple targeting → if auto-approve ON, status = active immediately.
6. Within 5 minutes of cron tick, the campaign appears in outbound stream for matching leads.
7. Click the tracked CTA → wallet decrements by $5, click recorded, redirect works.
8. Drain wallet (manually charge balance to 0) → campaign flips to `out_of_budget` on next tick.
9. Deposit $1,000 via manual (god marks paid in `/admin/advertisers/[id]`) → campaign reactivates.
10. Verify Phase 1 tenant outreach unaffected (regression check).

- [ ] All steps pass. Document any deviations.

---

## Sequencing & Estimated Effort

| # | Task | Depends on | Est. days |
|---|---|---|---|
| 1 | Schema migration 0021 | — | 0.5 |
| 2 | Advertiser auth scope | 1 | 1.0 |
| 3 | Signup guards | 1 | 0.5 |
| 4 | Signup form + intake | 2,3 | 1.5 |
| 5 | Login + dashboard skeleton | 2 | 0.5 |
| 6 | Wallet + ledger | 1,2 | 1.0 |
| 7 | Stripe advertising provider | 6 | 1.0 |
| 8 | Campaign CRUD | 1,6 | 1.0 |
| 9 | Reach estimator + targeting | 1 | 1.0 |
| 10 | Campaign UI | 8,9 | 1.5 |
| 11 | Billing UI | 6,7 | 0.5 |
| 12 | Optimizer integration | 8,9 | 2.0 |
| 13 | Click handler dispatch | 6,12 | 0.5 |
| 14 | Out-of-budget + cron | 12 | 0.5 |
| 15 | Referrals + manager wallet | 1,13 | 1.0 |
| 16 | God admin pages | 8,15 | 1.5 |
| 17 | Render advertiser ads | 12 | 0.5 |
| 18 | Tenant separation (in Task 4) | — | — |
| 19 | Daily cron updates | 14 | 0.5 |
| 20 | Marketing pages | — | DONE |
| 21 | Migration + deploy | all | 0.5 |
| 22 | Tests | inline | 2.0 |
| 23 | Acceptance smoke | all | 0.5 |
| **Total** | | | **~18 engineer-days** |

Parallel friendly: Tasks 4 + 8 + 9 can run in parallel after 1–3; Tasks 7 + 11 in parallel after 6; Task 16 needs 8 + 15 done.

---

## Open Items Pre-Build

Before kicking off Task 1, founder confirms:

- **Coupon system extension** — current `coupons` table is customer-scoped. Phase 2 task 6 (`grantCoupon`) needs either (a) a new `advertiser_coupons` table or (b) extend existing `coupons` with a `scope` column. **Recommendation: extend existing** with `scope enum(customer|advertiser) default customer` for simpler reuse. Confirm OK before Task 1.
- **External referrer payout** — Task 15 treats `referrerKind=external` as no-op for now (accruing but not paying). Confirm this is fine, or wire a manual-payout flow now.
- **Marketing footer link wording** — currently "Advertise with us" — confirm wording vs alternatives ("Run ads with us", "Become an advertiser").
- **Stripe Connect vs direct?** — Plan assumes direct Stripe account for advertising marketplace. If you want advertisers to onboard with their own Stripe Connect (for tax reasons), that's a Phase 3 consideration.

---

## After Phase 2 Ships

Next up per the 6-phase roadmap:
- **Phase 3** — Per-click billing wired into optimizer with auction mechanics (replace heuristic with real eCPM).
- **Phase 4** — eCPM/exploration-exploitation bandit + ML scoring.
- **Phase 5** — Auto-responder to replies + advertiser offer-list landing page.
- **Phase 6** — Zapmail mailbox autoscaling dashboard + unified Zapbox-style inbox.
