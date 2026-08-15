# Phase 1 — White-Label Automated Outreach + Deliverability — Design

**Date:** 2026-06-02
**Status:** Draft for review
**Parent vision:** the autonomous advertising marketplace / email ad-exchange. This is **sub-project 1 of 6** (outreach → advertiser portal → ad backfill+click billing → optimizer → reply auto-responder → mailbox autoscaling+dashboard). Each gets its own spec → plan → build.
**Builds on:** Zapmail mailbox pool (`email_mailboxes`), `sendViaPool`, `email_outbound`, inbound webhook + auto-reply, lead ingest (`leads`, per-tenant), `/admin/email`.

## Goal
Turn every white-label's incoming lead data into automated outreach: each white-label sets up **one outreach offer**, and every lead that enters that white-label's database is emailed that offer — **dripped so the whole intake clears within 5–7 days**, sent through the shared Zapmail pool, with deliverability protection, click tracking, and mailbox autoscaling to keep the deadline. Built to run **hundreds of thousands of emails** across all niches.

## Decisions (locked with the user)
- **"Customer" = the white-label (tenant).** It owns one outreach offer; recipients are the white-label's ingested **leads** (homeowner/business data), emailed on the white-label's behalf.
- **Trigger:** every lead that first enters a white-label's account (manual CSV upload OR the POST ingest webhook) is queued for **one** outreach email. Already-queued/sent leads are never re-queued.
- **Pacing:** dripped, not back-to-back; a white-label's batch should fully send within **5–7 days max** (target spread 3–5 days). A **deadline scheduler** paces sends.
- **Capacity / autoscaling:** if the active mailbox pool can't clear the queue within the deadline, the system **buys more Zapmail mailboxes via the API** ($50/mo each) — guarded by a god-set cap + the existing key — so the 5–7-day promise holds. When it can't/shouldn't auto-buy, it alerts on the god dashboard.
- **Sender:** shared Zapmail pool, neutral system identity; replies route to the system inbox (Phase-5 auto-responder).
- **Optimize for clicks AND success:** track click-through now and lay the foundation to weight by white-label success/retention later (a thriving white-label keeps paying). Real optimization is Phase 4; Phase 1 captures the signals.
- **Deliverability is foundational:** pre-send verify (syntax + MX; verify-API key-gated), **global suppression** (bounces/unsubscribes/complaints), per-mailbox bounce-rate throttle, warmup ramp, CAN-SPAM unsubscribe + address footer, spam-safe rotating subjects.

## Data model (new)
- **`outreach_offers`** — one per tenant: `tenantId (unique), logoUrl, title, description, ctaUrl, active, createdAt, updatedAt`. Also rendered on the white-label homepage.
- **`outreach_queue`** — `id, tenantId, leadId, toEmail, status (queued|sent|skipped|suppressed|failed), scheduledFor (timestamp), batchDeadline, mailboxId, sentAt, createdAt`. One row per (tenant, lead). Unique `(tenantId, leadId)` prevents re-queue.
- **`email_suppression`** — `address (unique), reason (bounce|unsubscribe|complaint|invalid), tenantId (nullable; global), createdAt`. Checked before every send; never re-emailed.
- **`email_clicks`** — `id, token (unique), outreachQueueId, tenantId, leadId, targetUrl, clickedAt (nullable until clicked), createdAt`. Token in the CTA redirect.
- Extend **`email_outbound`** (exists) as the send log; add a `kind='outreach'` and link `outreachQueueId`.
- **`mailbox_purchases`** — `id, provider, count, monthlyCost, reason, createdBy (system|god), createdAt` — audit of autoscaling buys.

## Components (`src/outreach/`)
- **`offers.ts`** — get/set a tenant's outreach offer.
- **`enqueue.ts`** — `enqueueLeads(tenantId, leadIds)` called from the ingest pipeline (after `ingestRows`) and CSV import. Verifies addresses (syntax+MX, suppression check), inserts `outreach_queue` rows with `batchDeadline = now + 7d` and `scheduledFor` spread across the window. Skips suppressed/invalid.
- **`verify.ts`** — `verifyAddress(email)` → syntax + MX lookup now; pluggable provider (key-gated) later. `isSuppressed(email)`.
- **`scheduler.ts`** — a worker (cron/interval) that, each tick: computes due rows (`scheduledFor <= now`), checks pool capacity (`poolCapacity`), sends as many as caps allow via `sendViaPool` (kind outreach), records `email_outbound` + click token, marks rows sent. Re-paces remaining rows toward the deadline.
- **`capacity.ts`** — `planCapacity()` → per active queue, compute required sends/day to hit each deadline vs available daily capacity; if deficit, recommend/trigger mailbox purchase.
- **`autoscale.ts`** — `ensureCapacity(deficit)` → buy N Zapmail mailboxes via the API (guarded by god cap + key), import to pool, log `mailbox_purchases`. Falls back to an alert when auto-buy is off/unavailable.
- **`render.ts`** — render the outreach email from the offer + a spam-safe template (unsubscribe + footer + tracked CTA). Rotating subject lines.
- **`clicks.ts`** — `/c/[token]` route handler: log click → 302 to `targetUrl`. `/u/[token]` unsubscribe → suppress + confirmation page.
- **Bounce handling** — extend the inbound webhook/auto-reply path: bounce notifications (mailer-daemon) parse the failed address → `email_suppression`. Per-mailbox bounce-rate monitor throttles/pauses a hot mailbox.

## UI
- **White-label admin** (`/admin/branding` or a new `/admin/outreach`): outreach offer editor (logo upload, title, description, CTA link, active toggle) + stats (queued / sent / clicks / bounces, est. days to clear). Offer block renders on the homepage.
- **God dashboard** (`/admin/email` extended or `/admin/outreach`): platform queue depth, daily capacity vs demand, sends/day, bounce rate, **autoscaling panel** (recommended buys, auto-buy toggle + cap, purchase log), and the **Zapbox-style unified inbox** (replies + bounces from the inbound feed).

## Scale & reliability
- Queue-based, batched; the scheduler processes in capped batches (never loads all rows). Sends spread across mailboxes + time. Idempotent (unique `(tenantId, leadId)`, one click token per queue row). At 100k+ rows, queries are indexed (`scheduledFor`, `status`, `tenantId`).

## Testing (TDD where logic exists)
Pure/unit: address syntax, suppression check, capacity math (deficit → required mailboxes), deadline spread (N leads over the window → per-day schedule), subject rotation. Integration: enqueue skips suppressed/invalid + dedups; scheduler respects per-mailbox caps + marks sent; bounce → suppression; click token logs + redirects; unsubscribe suppresses.

## Out of scope (later phases)
Advertiser portal + ad backfill (Ph 2–3); the eCPM/exploration optimizer (Ph 4); reply auto-responder offer-list page (Ph 5 — Phase 1 just captures replies/bounces); WYSIWYG template editor + A/B optimization (Ph 4+). Multi-step follow-up sequences (Phase 1 = one touch per lead). Actual Zapmail *purchase* endpoint is key-gated and may need verification against the live API.

## Open (proposed defaults — confirm on review)
- **Auto-buy guardrails:** default OFF until god enables it + sets a max-mailboxes cap; until then, deficit → dashboard alert only. (Spending money automatically should be opt-in.)
- **One outreach offer per white-label** for Phase 1 (multiple offers / per-segment offers later).
