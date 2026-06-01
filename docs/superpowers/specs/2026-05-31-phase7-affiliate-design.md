# Phase 7 — Affiliate Program Design

**Date:** 2026-05-31
**Status:** Approved (user directive "do everything"), ready for build
**Builds on:** Phase 2 signup, Phase 5a wallet/ledger/confirmPayment

## Goal
Members share a referral link; when a referred member's purchased credits are confirmed, the
referrer earns **10% of those credits** into their own wallet (ledger type `affiliate`).

## Data model
- **`affiliates`**: `customer_id` (FK users, unique), `code` (text unique), `created_at`.
- **`referrals`**: `referred_customer_id` (FK users, unique), `affiliate_customer_id` (FK users),
  `code`, `created_at`. One referrer per referred customer; self-referral disallowed.

## Domain (`src/affiliate/*`)
- `code.ts`: `getOrCreateCode(customerId)` → ensures a short unique code, returns it; `codeOwner(code)`.
- `referral.ts`: `recordReferral(referredCustomerId, code)` → if code valid, not self, and the
  referred customer isn't already referred → insert a referral. `affiliateStats(customerId)` →
  `{ referrals, earnedCredits }` (earned = sum of the affiliate-type ledger entries on their wallet).
- `commission.ts`: `creditAffiliateCommission(tx, payment)` — called inside `confirmPayment` for a
  `purpose="topup"` payment: look up the payment's customer; if referred, credit the referrer's
  wallet **10% of `payment.credits`** as an `affiliate` ledger entry (`ref_id = payment.id`). No-op
  if not referred or commission rounds to 0.

## Integration
- **`confirmPayment`** (Phase 5a, topup branch, inside the tx, after the credit grant): call
  `creditAffiliateCommission(tx, p)`. (Subscription payments don't earn commission.)
- **Signup**: `signupCustomer(..., { refCode })` → after creating the customer, `recordReferral`.
  The signup action reads `?ref=` (query) / a `ref` form field and passes it through. The marketing
  signup link includes the visitor's referral code when present.

## UI
- Customer **`/affiliate`**: shows the member's referral link
  (`https://<tenant-domain>/signup?ref=<code>`), referral count, and credits earned.
- (Admin already sees all ledger entries via existing tools; no new admin UI required.)

## Testing (TDD)
- `getOrCreateCode`: stable per customer, unique, idempotent.
- `recordReferral`: links a valid code; rejects self-referral; ignores an unknown code; one referrer
  per referred customer (second attempt no-ops).
- `creditAffiliateCommission`: a referred customer's confirmed $20 top-up credits the referrer 2
  credits (`affiliate` ledger); a non-referred customer's top-up credits no one; subscription
  payments earn nothing.
- End-to-end via `confirmPayment`: confirming a referred customer's top-up raises the referrer's
  balance by 10%.
- `affiliateStats`: counts referrals + sums earned.

## Out of scope
Payouts to cash (credits only); multi-tier/MLM; affiliate-of-affiliate; fraud detection beyond
self-referral + one-referrer.
