# Phase 4 — Marketing Site, Self-Service Signup & Admin Integrations Design

**Date:** 2026-05-31
**Status:** Approved (user directive "do everything"), ready for plan
**Builds on:** Phases 1–6

## 1. Goal

Give each white-label a public marketing front door with self-service signup (auto $50 wallet), an
e-partnership application, and a single admin **Integrations** page where Stripe / PayPal / Twilio
API keys are stored encrypted — so adapters light up the moment keys are pasted.

## 2. Decisions

- **Self-service signup** at `/signup` on the tenant's own domain → creates a `customer` in that
  tenant, sets their own password (no forced reset), grants the $50 wallet (Phase 5a hook),
  auto-logs-in, redirects to `/leads`. Pre-checked TOS checkbox; `/terms` page.
- **Keys live in one admin Integrations page**, encrypted at rest with **AES-256-GCM** using
  `SECRETS_KEY` (32-byte hex env var, present in `.env.local`/`.env.test`/box `.env`). Per tenant.
- **E-partnership applications** stored in DB + shown in admin; operator email deferred until SMTP.
- Marketing pages render from tenant config (theme/offers/money-word) — config-driven, per tenant.

## 3. Data model

- **`tenant_integrations`** (one per tenant): `tenant_id` unique, `stripe_secret_enc`,
  `stripe_publishable`, `paypal_client_id`, `paypal_secret_enc`, `twilio_account_sid`,
  `twilio_auth_token_enc`, `twilio_from_number`, `active_payment_provider`
  (`manual`|`stripe`|`paypal`), `updated_at`. `*_enc` columns hold AES-256-GCM ciphertext.
- **`epartner_applications`**: `id`, `tenant_id`, `name`, `phone`, `business_name`, `location`,
  `roofs_last_12mo`, `seasons_in_business`, `territories`, `team_w2`, `team_1099`, `canvassers`,
  `tech_used`, `annual_revenue`, `annual_ebitda`, `approached_before` (bool), `agree_exit` (bool),
  `created_at`.

## 4. Secrets crypto

`src/crypto/secrets.ts`: `encryptSecret(plain) → "v1:iv:tag:ct"` (base64 parts) and
`decryptSecret(enc) → plain` using AES-256-GCM with `SECRETS_KEY`. `null`/empty passes through as
`null`. Tested round-trip + tamper-detection.

## 5. Integrations store

`src/integrations/store.ts`: `getIntegrations(tenantId)` → decrypted view
`{ stripeSecret, stripePublishable, paypalClientId, paypalSecret, twilioAccountSid, twilioAuthToken,
twilioFromNumber, activePaymentProvider }`; `setIntegrations(tenantId, patch)` → encrypts the
secret fields and upserts. A `maskedView` helper returns secrets as `••••last4` for display.

## 6. Self-signup

`src/auth/signup.ts`: `signupCustomer(tenantId, { email, password, name, businessName })` →
rejects if the email already exists in the tenant; creates a `customer` user with their chosen
password (`must_reset_password = false`), stores `businessName` in `name`/notes; the existing
`createUser`/wallet path is reused so the **$50 wallet** is granted; returns the user. The signup
**action** then creates a session + sets the cookie + redirects to `/leads`.

## 7. UI

- **Marketing landing** (`app/page.tsx`, rewritten) — themed hero + money-word + subhead + a big
  **"Get started — $50 in leads free"** CTA → `/signup`; the 3 offers (from tenant config); a
  feature grid (predictive intent targeting, door-knocker optimization, saturation marketing,
  done-for-you booking, CRM webhooks, ZIP exclusivity, 5-year retrospective data, daily/weekly
  updates); residential + commercial note; testimonials (seeded static); an **E-Partnership** band
  → `/partner`; the global footer.
- `app/about/page.tsx`, `app/how-it-works/page.tsx`, `app/contact/page.tsx`, `app/terms/page.tsx`
  (TOS content referencing the tenant brand + DNC/legal acceptable-use language).
- **`/signup`** — form (name, business, email, password) + pre-checked TOS checkbox → signup action.
- **`/partner`** — e-partnership application form → stored; thank-you state.
- **`/admin/integrations`** (god/manager) — Stripe / PayPal / Twilio key fields (secrets shown
  masked, blank = unchanged) + active-provider select; saves encrypted. Manager scoped to own tenant.
- **`/admin/partners`** (god/manager) — list e-partnership applications.

## 8. Testing (TDD)

- `secrets`: encrypt→decrypt round-trip; different ciphertext each call (random IV); tamper → throws.
- `integrations store`: set then get returns plaintext; DB stores ciphertext (not plaintext);
  masked view hides secrets; upsert idempotent; manager-scope respected at the action layer.
- `signup`: creates a customer with the chosen password (login works, no forced reset) + $50 wallet;
  duplicate email rejected; cross-tenant emails independent.
- `epartner`: submit stores all fields; list returns them.
- Route gating: marketing/signup/partner/terms public; `/admin/integrations` + `/admin/partners`
  god/manager only.

## 9. Out of scope

Real Stripe/PayPal/Twilio API calls (next phases — the keys + adapters interface land here);
operator email on application (SMTP phase); the AI "unique look / refresh" generator (its own phase).
