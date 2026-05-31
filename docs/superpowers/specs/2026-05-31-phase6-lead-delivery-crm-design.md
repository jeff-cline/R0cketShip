# Phase 6 — Lead Delivery & Customer CRM Design

**Date:** 2026-05-31
**Status:** Approved design, ready for plan
**Builds on:** Phase 1 chassis + Phase 2 identity + Phase 3 leads + Phase 5a wallet

---

## 1. Goal

Let customers turn credits into leads: browse/filter the tenant lead pool, buy leads (debiting the
wallet by age-tier price), work them in a CRM (status/notes/sale value), see counts, download CSV,
and push each delivered lead to their own CRM via a generic outbound webhook.

## 2. Decisions (locked with the user)

- **On-demand purchase from the pool** (ZIP subscriptions/auto-delivery are Phase 5b).
- **Non-exclusive:** a lead can be bought by multiple customers; each customer is charged at most
  once for a given lead.
- **Manual CRM:** customer-set status, notes, and sale value. Automated conversion tracking
  (calendar/call-center) is a later phase.
- **Generic outbound webhook:** paste URL + optional secret; POST lead JSON on delivery. No
  provider-specific OAuth/field-mapping yet.
- **Exact ZIP match** (radius/circumference search deferred).
- **Full contact info is hidden in previews until purchased.**

## 3. Data model

### `lead_deliveries`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid pk | |
| `tenant_id` | uuid not null | |
| `customer_id` | uuid not null FK users | the buyer |
| `wallet_id` | uuid not null FK wallets | |
| `lead_id` | uuid not null FK leads | |
| `price_credits` | numeric not null | what was charged |
| `tier_at_delivery` | enum lead-tier text | `real_time`/`one_week`/`thirty_day`/`older` |
| `status` | enum(`new`,`contacted`,`booked`,`sold`,`dead`) not null default `new` | |
| `notes` | text | |
| `sale_value` | numeric | nullable; set when sold |
| `delivered_at` | timestamp not null default now | |
| `updated_at` | timestamp not null default now | |

Unique `(customer_id, lead_id)` — no double-purchase by the same customer.

### `customer_integrations`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid pk | |
| `tenant_id` | uuid not null | |
| `customer_id` | uuid not null FK users, unique | |
| `webhook_url` | text | nullable |
| `webhook_secret` | text | nullable |
| `active` | boolean not null default true | |
| `last_status` | text | nullable — last delivery attempt result |
| `created_at` | timestamp | |

## 4. Pool search + availability

`src/delivery/search.ts`:
- `LeadFilters { zips?: string[]; segment?: "residential"|"commercial"; tier?: AgeTier; score?: string }`.
- `searchAvailableLeads(customerId, tenantId, filters, limit=100)` → leads in `tenant_id` matching
  filters, **excluding leads already in this customer's `lead_deliveries`**, each annotated with
  `tier = ageTier(last_updated, now)` and `price = leadPrice(tier)`. Returns **preview rows only**:
  `{ leadId, zip, city, state, segment, scoreCategory, tier, price }` — NOT name/phone/email/address.
- `availableCount(customerId, tenantId, filters)` → total matching (for the UI).
- `pickAvailableLeads(customerId, tenantId, filters, limit)` → ordered `leadId[]` (freshest first)
  to feed `purchaseLeads`.

Tier filtering is computed from `last_updated` relative to now (no stored tier — consistent with
Phase 3).

## 5. Purchase (debit)

`src/delivery/purchase.ts`:
- `purchaseLeads(customerId, leadIds[])`:
  1. Load the customer's wallet; load the requested leads (scoped to the wallet's tenant).
  2. Drop leads the customer already owns (idempotent skip).
  3. Compute each price = `leadPrice(ageTier(lead.last_updated, now))`; sum = total.
  4. **In one transaction:** lock + recompute the wallet balance; if `balance < total` → throw
     `insufficient balance` (nothing charged). Otherwise insert `lead_deliveries` rows and write one
     `lead_charge` ledger entry per lead (negative `price`, `ref_id = lead_id`).
  5. Returns `{ delivered: Delivery[], totalCharged, skipped }`.
- After the transaction commits, fire the outbound webhook (best-effort, per delivered lead).

Atomicity: insufficient balance rejects the whole purchase (no partial charge). Re-buying owned
leads never double-charges.

## 6. CRM

`src/delivery/crm.ts`:
- `myDeliveries(customerId, filters?)` → the customer's deliveries joined to full lead contact info.
- `updateDelivery(customerId, deliveryId, { status?, notes?, saleValue? })` → only the owning
  customer may update (verified by `customer_id`). Setting `status = sold` typically accompanies a
  `sale_value`.
- `deliveryStats(customerId)` → `{ delivered, conversions, revenue, creditsSpent }` where
  **conversions = count(status in (booked, sold))**, **revenue = Σ sale_value**, **creditsSpent =
  Σ price_credits**.
- CSV export of the customer's delivered leads (full contact).

## 7. Outbound webhook

`src/delivery/webhook.ts`:
- `getIntegration(customerId)` / `setIntegration(customerId, tenantId, { webhookUrl, webhookSecret, active })`.
- `deliverLeadToWebhook(integration, leadPayload)` → `POST webhook_url` with JSON body and, if set,
  an `x-webhook-secret` header. **Best-effort**: catches errors, records `last_status`, never throws
  into the purchase path. A short timeout so a slow endpoint can't hang delivery.
- `testIntegration(customerId)` → sends a sample payload and returns the result.

## 8. UI

- **`/leads`** (customer) — filter form (ZIPs, segment, tier, score), available-count, preview table
  with per-lead price + select/buy (and a "buy N freshest" shortcut), wallet balance shown; errors
  on insufficient funds.
- **`/crm`** (customer) — delivered leads with full contact + inline status/notes/sale-value edit;
  the stat counts; a "Download CSV" link.
- **`/settings/integrations`** (customer) — webhook URL + secret + active toggle + "Send test".
- All linked from `/dashboard`.

## 9. Testing (TDD)

- `searchAvailableLeads`: excludes owned leads; honors ZIP/segment/tier/score filters; returns
  preview fields only (no PII); price/tier correct.
- `purchaseLeads`: debits exactly the summed price; creates deliveries + `lead_charge` entries;
  **insufficient balance throws and charges nothing (atomic)**; re-buying owned → skipped, no
  double-charge; cross-tenant lead id is ignored.
- `updateDelivery`: owner can update; a different customer cannot.
- `deliveryStats`: conversions = booked+sold; revenue = Σ sale_value; creditsSpent = Σ price.
- `webhook`: payload shape; secret header present when set; a failing endpoint doesn't throw and
  records `last_status`.
- Integration authority: a customer manages only their own integration.
- Route gating: `/leads`, `/crm`, `/settings/integrations` are customer-only.

## 10. Success criteria

1. A customer with 50 credits buys two 1.44-credit (older) leads → balance 47.12; both appear in the
   CRM with full contact; pool no longer offers them to that customer.
2. Buying a real_time lead costs 11 credits; buying with only 5 credits is rejected with no charge.
3. Re-buying an already-owned lead is skipped (no extra charge).
4. Another customer in the same tenant can still buy the same leads (non-exclusive).
5. Marking a delivery `sold` with a $9,000 sale value bumps conversions and revenue; counts are
   correct.
6. A configured webhook receives the lead JSON on delivery; a broken webhook doesn't block the buy.
7. CSV download contains the customer's delivered leads.
8. A customer cannot update another customer's delivery or view the pool's PII before purchase.
9. All covered by passing tests.

## 11. Out of scope

ZIP subscriptions + auto-delivery + exclusivity (5b), radius/geo search, calendar-booking &
call-center conversion automation, provider-specific CRM integrations (HubSpot/GHL OAuth + field
mapping), refunds on bad leads, lead-quality disputes.
