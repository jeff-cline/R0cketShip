# Phase 5b — ZIP Subscriptions Design

**Date:** 2026-05-31
**Status:** Approved (user directive "do everything"), ready for build
**Builds on:** Phase 5a wallet + Phase 6 delivery

## Goal
Monthly per-ZIP subscriptions with the volume-discount ladder; a subscribed ZIP makes its leads
free to that customer (covered by the monthly fee). Manual recurring invoices now; real Stripe later.

## Data model
- **`zip_subscriptions`**: `id`, `tenant_id`, `customer_id` (FK users), `zip`, `offer`
  (`data`|`booking`|`epartner`), `monthly_price` (numeric, after volume discount, locked at create),
  `status` (`active`|`canceled`), `paid_through` (timestamp, nullable), `started_at`, `canceled_at`.
  Unique active `(customer_id, zip)` enforced in app (one active sub per ZIP per customer).
- **`payments.subscription_id`** (nullable uuid) + **`payments.purpose`** (`topup`|`subscription`,
  default `topup`). A `subscription` payment, when confirmed, marks the subscription `paid_through`
  +1 month and does **NOT** grant wallet credits.

## Pricing
`src/billing/subscription-pricing.ts`:
- `baseMonthlyPrice(tenant, offer)`: `data` → `tenant.monthlyPriceDefault` (e.g. 1500);
  `booking` → 4500; `epartner` → 0 (negotiated/manual).
- `volumeDiscountedPrice(base, existingActiveCount)`: 0 existing → base; 1 → −10%; 2 → −20%;
  3+ → −30%. Rounded to 2 dp.

## Domain (`src/billing/subscriptions.ts`)
- `subscribeZip(customerId, zip, offer)`: counts the customer's active subs → computes price →
  inserts an `active` `zip_subscription` → creates a `pending` `subscription` payment (first
  invoice, provider=manual) → returns `{ subscription, payment }`. Rejects a duplicate active ZIP.
- `cancelZip(customerId, subscriptionId)`: owner-only → status `canceled`, `canceled_at=now`.
- `listSubscriptions(customerId)` → active + canceled.
- `subscribedZips(customerId)` → `Set<string>` of the customer's ACTIVE subscribed ZIPs.
- `confirmSubscriptionPayment` is handled by extending Phase 5a `confirmPayment`: if
  `purpose=subscription`, set the sub's `paid_through` to (max(now, current) + 1 month) and mark the
  payment paid, **no ledger credit**.

## Delivery integration
`purchaseLeads` (Phase 6): before pricing, load the customer's `subscribedZips`. Any candidate lead
whose `zip` is in that set is priced at **0** (subscription-covered) — delivered free, still recorded
as a `lead_delivery` with `price_credits = 0`, no `lead_charge` ledger row. Non-subscribed-ZIP leads
keep age-tier pricing. (Search/preview shows price 0 for subscribed ZIPs.)

## UI
- Customer **`/subscriptions`**: list active/canceled subs; a "Subscribe a ZIP" form (zip + offer →
  shows the volume-discounted price) → subscribe; cancel buttons. Note that subscribed ZIPs deliver
  free leads.
- Admin billing: `subscription` pending invoices appear alongside top-ups for "Mark paid".

## Testing (TDD)
- pricing: base by offer; discount ladder (0/1/2/3 existing).
- subscribeZip: creates active sub + pending subscription payment at the discounted price; duplicate
  active ZIP rejected; volume discount reflects existing count.
- cancelZip: owner-only.
- confirmPayment(subscription): advances `paid_through` +1mo, no wallet credit; (topup still credits).
- delivery: a lead in a subscribed ZIP costs 0 and writes no `lead_charge`; non-subscribed keeps tier
  price; insufficient-funds still blocks paid leads.

## Out of scope
Real Stripe recurring auto-charge (next: wire adapters from the keys page); proration; the booking
($4,500) email automation + e-partner sales delivery (their own phases); exclusivity enforcement.
