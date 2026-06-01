# Phase 10 — Email / Booking Engine Design

**Date:** 2026-05-31
**Status:** Approved (user "keep building all machinery"), ready for build
**Builds on:** Phase 6 deliveries/CRM, Phase 4 integrations

## Goal
Offer #2 ("Booking"): send outbound offer emails to a customer's delivered leads, each with a
**tracked booking link** to the customer's calendar; when a lead clicks, mark the delivery
**booked** (a conversion) then redirect to the calendar. Key-ready: real sending needs SMTP creds in
`/admin/integrations` (no SMTP → the send is a logged no-op).

## Data model
- **`tenant_integrations`** add SMTP: `smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass_enc`
  (encrypted), `smtp_from`.
- **`customer_integrations`** add email settings: `booking_url`, `email_subject`, `email_body_html`.
- **`email_sends`** (audit): `id`, `tenant_id`, `customer_id`, `delivery_id`, `lead_email`, `status`
  (`sent`|`failed`|`skipped`), `created_at`.

## Modules
- `src/email/smtp.ts`: `resolveSmtp(tenantId)` → transporter config from integrations or null;
  `sendEmail(cfg, { to, from, subject, html })` via **nodemailer** (key-ready — if cfg is null,
  returns `"skipped"`). Tested with mocked nodemailer.
- `src/email/campaign.ts`:
  - `trackedBookingLink(baseUrl, deliveryId)` → `${baseUrl}/api/book/${deliveryId}`.
  - `renderOfferEmail(template, { firstName, bookingLink })` → subject/html with `{{name}}` /
    `{{booking_link}}` substitution.
  - `sendOfferEmails(customerId, deliveryIds)` → for each delivery (owned by the customer, lead has
    an email), render + send via SMTP, insert an `email_sends` row; returns `{ sent, skipped, failed }`.
- **Route `/api/book/[delivery]/route.ts`** (GET): load the delivery, set `status="booked"` (only if
  currently new/contacted — a conversion), then redirect to the customer's `booking_url` (or a
  thank-you if none). This makes a lead's click a tracked conversion (Phase 6 stats already count
  `booked` as a conversion).
- Email/booking settings on `customer_integrations` via `getEmailSettings`/`setEmailSettings`.

## UI
- Customer **`/settings/email`**: booking URL, email subject, email body (HTML textarea with
  `{{name}}` / `{{booking_link}}` placeholders), a preview note.
- Customer **CRM** (`/crm`): a "Send offer email" action that emails all delivered leads (with an
  email address) using the template + tracked links.
- Admin **`/admin/integrations`**: SMTP fields (host/port/user/pass/from).

## Testing (TDD, mocked)
- `renderOfferEmail`: substitutes name + booking link.
- `trackedBookingLink`: correct URL.
- `resolveSmtp`: returns config when set, null when not.
- `sendEmail`: calls nodemailer transport with to/subject/html (mocked); null cfg → skipped.
- `sendOfferEmails`: sends to leads with emails, skips those without, records `email_sends`, returns
  counts (nodemailer mocked).
- booking route: marks the delivery `booked` (conversion) and redirects.

## Out of scope
Email open/click analytics beyond the booking click; drip sequences/scheduling; deliverability
(SPF/DKIM) setup; the done-for-you sales (offer #3) tooling.
