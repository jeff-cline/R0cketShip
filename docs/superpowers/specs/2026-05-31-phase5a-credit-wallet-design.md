# Phase 5a — Credit Wallet Design

**Date:** 2026-05-31
**Status:** Approved design, ready for plan
**Builds on:** Phase 1 chassis + Phase 2 identity + Phase 3 ingestion

---

## 1. Goal

Build the credit economy: per-customer wallets, an immutable credit ledger (balance = sum), the
$50 signup bonus on account creation, one-time top-ups through a `PaymentProvider` interface (with a
working **manual** provider now; Stripe/PayPal slot in later), coupons, admin grant/comp, and the
age-tiered lead-pricing helper. ZIP monthly subscriptions + recurring billing are **Phase 5b**; the
per-lead debit on delivery is **Phase 6**.

## 2. Decisions (locked with the user)

- **Provider interface + manual provider now.** Build the full billing domain behind one
  `PaymentProvider` interface; a manual provider lets an admin mark a top-up paid so everything is
  testable. Stripe/PayPal wire in later with no rework.
- **Split Phase 5:** 5a (this) = credit wallet; 5b = ZIP subscriptions.
- **$50 bonus on account creation** (amount is per-tenant, default 50). Public self-signup + TOS
  gate comes with the Phase 4 marketing site.
- **1 credit = $1.** Top-ups are 1:1 USD→credits.

## 3. Data model

### `wallets` (one per customer)
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid pk | |
| `tenant_id` | uuid not null FK tenants | |
| `user_id` | uuid not null FK users, unique | the customer |
| `created_at` | timestamp | |

Balance is **computed** from the ledger — no stored balance (avoids drift).

### `credit_ledger` (immutable)
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid pk | |
| `wallet_id` | uuid not null FK wallets | |
| `tenant_id` | uuid not null | denormalized for scoping/reporting |
| `amount` | numeric not null | credits, may be ± |
| `type` | enum | `signup_bonus`,`topup`,`coupon`,`admin_grant`,`lead_charge`,`refund`,`adjustment` |
| `description` | text | |
| `ref_id` | uuid | nullable — payment id / lead id |
| `created_at` | timestamp | |

`balance(wallet) = SUM(amount)`.

### `payments`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid pk | |
| `tenant_id` | uuid not null | |
| `wallet_id` | uuid not null FK wallets | |
| `provider` | enum(`manual`,`stripe`,`paypal`) not null | |
| `provider_ref` | text | external charge id, nullable |
| `amount_usd` | numeric not null | |
| `credits` | numeric not null | credits to grant on confirm (incl. coupon bonus) |
| `coupon_code` | text | nullable |
| `status` | enum(`pending`,`paid`,`failed`,`refunded`) not null default `pending` | |
| `created_at` / `paid_at` | timestamp | |

### `coupons`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid pk | |
| `tenant_id` | uuid | nullable = global |
| `code` | text not null unique | |
| `kind` | enum(`percent`,`fixed_credits`) not null | |
| `value` | numeric not null | % (e.g. 10) or fixed credits |
| `max_redemptions` | integer | nullable = unlimited |
| `times_redeemed` | integer not null default 0 | |
| `expires_at` | timestamp | nullable |
| `active` | boolean not null default true | |
| `created_at` | timestamp | |

### `tenants.signup_bonus_credits`
Numeric, default `50`. Backfilled by seed/migration.

## 4. Pricing & credit value

`src/billing/pricing.ts`:
- `leadPrice(tier)`: `real_time → 11`, `one_week → 4`, `thirty_day → 1.44`, `older → 1.44` (credits).
- 1 credit = $1; top-up credits = USD amount (1:1).
- Coupon effect: `fixed_credits` adds `value` bonus credits; `percent` adds `value%` of the USD
  amount as bonus credits. Computed at top-up creation and stored on `payments.credits`.

## 5. Provider interface + manual provider

```ts
interface PaymentProvider {
  startTopup(payment): Promise<{ kind: "manual" | "redirect"; url?: string }>;
}
```
- **Manual provider** → `{ kind: "manual" }` (no redirect). Admin confirmation drives it.
- A provider-agnostic, **idempotent** `confirmPayment(paymentId)` flips `pending → paid`, sets
  `paid_at`, and writes the `topup` ledger entry (amount = `payments.credits`, which already includes
  any coupon bonus) plus a `coupon` ledger note if a coupon applied, and increments the coupon's
  `times_redeemed`. Confirming an already-`paid` payment is a no-op (no double credit).
- Stripe/PayPal adapters later implement `startTopup` (returning a redirect/checkout URL) and call
  the same `confirmPayment` from their webhook. Switching is a config + keys change.

## 6. Flows

1. **$50 bonus** — `ensureWalletWithBonus(userId)`: creates the wallet if absent and writes a
   `signup_bonus` ledger entry of `tenants.signup_bonus_credits`. Called when a customer account is
   created (hook in Phase 2 `createUser` for `role=customer`). Idempotent: re-running creates nothing
   if a wallet already exists.
2. **Top-up** — `createTopup(walletId, amountUsd, couponCode?)`: validates the coupon, computes
   total credits (amount + bonus), creates a `pending` payment (`provider=manual`), calls
   `provider.startTopup`. Returns the payment + provider result. Customer sees "awaiting confirmation".
3. **Confirm** — `confirmPayment(paymentId)` (admin "Mark paid", or a provider webhook later).
4. **Admin grant/comp** — `grantCredits(walletId, amount, description)`: writes an `admin_grant`
   ledger entry. (Also usable for negative `adjustment`.)
5. **Balance/history** — `walletBalance(walletId)` = SUM(ledger); `ledgerEntries(walletId)` for the
   customer's history.

## 7. Coupon validation

`validateCoupon(code, tenantId, amountUsd)` → `{ ok, bonusCredits }` or `{ ok: false, reason }`.
Checks: exists; `active`; not expired; `times_redeemed < max_redemptions` (if set); tenant matches or
is global. Computes `bonusCredits` from `kind`/`value`.

## 8. UI

- **Customer** — `/billing` (role customer): balance, ledger history, top-up form (USD + optional
  coupon), list of pending top-ups. (Linked from `/dashboard`.)
- **Admin** — `/admin/billing` (god/manager): pending payments → **Mark paid**; **grant credits** to
  a customer (pick user + amount); **create/list coupons**; a payments report grouped by tenant
  (revenue tagging). Manager scoped to own tenant; god cross-tenant.

## 9. Testing (TDD)

- Ledger: `walletBalance` sums entries (incl. negatives); empty wallet = 0.
- Bonus: `ensureWalletWithBonus` grants the per-tenant amount once; idempotent on re-run.
- Pricing: each tier returns the right credits.
- Coupon: valid percent/fixed; rejected when inactive/expired/over-max/ wrong-tenant; bonus math.
- Top-up: `createTopup` creates a pending payment with correct `credits` (incl. coupon); balance
  unchanged until confirm.
- Confirm: `confirmPayment` grants credits once, sets paid; **double-confirm is a no-op** (balance
  unchanged, coupon `times_redeemed` not double-incremented).
- Admin grant: adds credits; negative adjustment reduces balance.
- Authority: customer sees only their own wallet; only god/manager can confirm/grant/create-coupons;
  manager limited to own tenant.

## 10. Success criteria

1. Creating a customer account yields a wallet with a $50 (per-tenant) balance.
2. A customer tops up $20 with a `fixed_credits=10` coupon → pending payment for 30 credits; balance
   still 50 until an admin marks it paid; after, balance = 80.
3. Double-clicking "Mark paid" credits only once.
4. An admin grant of 25 credits raises the balance to 105; a −5 adjustment → 100.
5. Coupons are rejected when expired / inactive / over max redemptions / wrong tenant.
6. `leadPrice` returns 11 / 4 / 1.44 by tier.
7. A customer cannot view or top up another customer's wallet; a manager cannot confirm a payment in
   another tenant.
8. All covered by passing tests.

## 11. Out of scope

ZIP monthly subscriptions + volume discounts + recurring billing (Phase 5b); real Stripe/PayPal
adapters + their webhooks (wired when keys arrive — the interface is ready); per-lead debit on
delivery (Phase 6); refund automation; invoices/receipts emails (Phase 4 SMTP).
