# Phase 9 — Real Stripe + PayPal Adapters Design

**Date:** 2026-05-31
**Status:** Approved (user directive "do everything"), ready for build
**Builds on:** Phase 5a payments + Phase 4 integrations keys

## Goal
Make the `PaymentProvider` interface real: when a tenant has Stripe/PayPal keys in
`/admin/integrations`, top-ups create a hosted checkout/redirect, and a provider webhook confirms the
payment (calling the existing idempotent `confirmPayment`). No keys → falls back to the manual
provider. Built with mocked SDK/HTTP tests (live verification needs the user's sandbox keys).

## Decisions
- **Stripe**: official `stripe` SDK. Top-up → Checkout Session (mode `payment`), `metadata.paymentId`,
  `success_url`/`cancel_url` back to `/billing`. Webhook verifies signature with the tenant's webhook
  secret (also stored in integrations) and confirms on `checkout.session.completed`.
- **PayPal**: REST via `fetch` (no SDK). Top-up → create order (CAPTURE), return the approve link.
  Webhook (or a return-capture endpoint) confirms. For MVP, a `/api/paypal/capture?paymentId&token`
  return URL captures the order and confirms (PayPal webhook signature verification is heavier; the
  capture-on-return path is simpler and reliable for sandbox).
- `getProviderForTenant(tenantId)` reads `integrations.activePaymentProvider` + keys; returns the
  Stripe or PayPal adapter when its keys are present, else the manual provider.
- `startTopup` returns `{ kind: "redirect", url }` for real providers; the billing top-up action
  redirects the customer there instead of showing "pending".

## Data model
- `tenant_integrations.stripe_webhook_secret_enc` (encrypted) — add column.
- `payments.provider_ref` already exists (store the Stripe session id / PayPal order id).

## Modules
- `src/billing/providers/stripe.ts`: `stripeClient(secret)`, `startStripeTopup(secret, payment, urls)`
  → checkout url; `confirmStripeEvent(secret, webhookSecret, rawBody, sig)` → verify + return
  `{ paymentId }` on completion.
- `src/billing/providers/paypal.ts`: `paypalToken(env)`, `createPaypalOrder(env, payment, urls)` →
  approve url + order id; `capturePaypalOrder(env, orderId)` → `{ ok }`.
- `src/billing/provider-resolve.ts`: `resolveProvider(tenantId)` → `{ name, startTopup }` using the
  integrations store; manual fallback.
- Routes: `/api/webhooks/stripe` (POST, raw body), `/api/paypal/capture` (GET return), wired to
  `confirmPayment`.
- Top-up action update: if the resolved provider returns a redirect, redirect the customer.

## Testing (TDD, mocked)
- `startStripeTopup` calls the SDK with the right amount + metadata and returns the session url
  (Stripe SDK mocked).
- `confirmStripeEvent` returns the paymentId for a `checkout.session.completed` event (verification
  mocked) and ignores other events.
- PayPal: `createPaypalOrder` posts to the orders API with the amount and returns the approve link
  (fetch mocked); `capturePaypalOrder` posts capture and returns ok.
- `resolveProvider`: returns stripe when stripe keys present + active=stripe; paypal when active=paypal
  + keys; manual otherwise.
- Webhook route → `confirmPayment(paymentId)` is invoked (confirm mocked/spied).

## Out of scope
Subscription auto-charge via Stripe Billing (the subscription invoices stay manual for now — a
follow-on once one-time top-ups are proven live); PayPal webhook signature verification (capture-on-
return used instead); refunds.
