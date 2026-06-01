# Phase 11 — Twilio Call-Center Dialer Design

**Date:** 2026-05-31
**Status:** Approved (user "keep building all machinery"), ready for build
**Builds on:** Phase 2 roles, Phase 3 leads, Phase 6 deliveries, Phase 4 integrations

## Goal
A call center on the white-label: **agent** users log in, get the next lead to call, click to dial
(Twilio click-to-call), and disposition the call (left message / callback / hot-transfer / booked /
sold / no-answer / dead). KPIs per agent. Key-ready: dialing needs Twilio keys in
`/admin/integrations` (no keys → the call is a logged no-op).

## Data model
- Add **`agent`** to the `user_role` enum (ALTER TYPE ADD VALUE).
- **`calls`**: `id`, `tenant_id`, `lead_id`, `agent_id`, `disposition`
  (`no_answer`|`left_message`|`callback`|`hot_transfer`|`booked`|`sold`|`dead`), `notes`,
  `callback_at` (nullable), `sale_value` (nullable), `created_at`.
- `customer_integrations.hot_transfer_number` (a tenant/customer phone for hot transfers — for MVP
  store one per tenant on `tenant_integrations.hot_transfer_number`).

## Modules
- `src/dialer/twilio.ts`: `resolveTwilio(tenantId)` → `{ sid, token, from }` or null;
  `placeClickToCall(cfg, { agentNumber, leadNumber })` → Twilio REST: create a call to `agentNumber`
  with TwiML that dials `leadNumber` (returns `{ sid }` or `"skipped"` when cfg null). Mock-tested
  (fetch mocked).
- `src/dialer/queue.ts`:
  - `nextLeadToCall(tenantId)` → the oldest tenant lead with NO `call` row whose disposition is
    terminal, and no pending callback in the future — i.e. a lead not yet worked (or a due callback).
    MVP: a lead with no `calls` row, or a `callback` whose `callback_at <= now`.
  - `recordCall(tenantId, leadId, agentId, { disposition, notes?, callbackAt?, saleValue? })` → insert
    a `calls` row; if the lead has a `lead_delivery`, mirror booked/sold onto it (conversion).
  - `agentKpis(agentId)` → `{ calls, contacts, bookings, sales, revenue }` (contacts = non
    no_answer/left_message; bookings = booked+sold; revenue = Σ sale_value).

## UI
- **`/agent`** (role agent): the next lead's contact info, the lead's phone(s), a **Call** button
  (places the click-to-call via the agent's own number, entered once), a disposition form
  (disposition select + notes + callback datetime + sale value), and the agent's KPIs. Plus the
  tenant's hot-transfer number shown for manual transfers.
- **`/manage`** (manager) / **`/admin`**: a "create agent" path (reuse the existing create-user
  flow, role `agent`) and a call-KPI summary.
- **`/admin/integrations`**: Twilio fields already exist (SID/token/from); add a hot-transfer number.

## Testing (TDD, mocked)
- `placeClickToCall`: posts to Twilio with the agent + lead numbers (fetch mocked); null cfg → skipped.
- `resolveTwilio`: config when set, null when not.
- `nextLeadToCall`: returns an un-worked lead; excludes a lead already dispositioned terminal; returns
  a due callback.
- `recordCall`: inserts the call; mirrors booked/sold to the delivery; agentKpis aggregates.

## Out of scope
Browser WebRTC softphone (using click-to-call REST instead); call recording; ACD/skills routing;
real-time presence; inbound IVR.
