# Phase 3 — Data Ingestion Design

**Date:** 2026-05-31
**Status:** Approved design, ready for plan
**Builds on:** Phase 1 chassis + Phase 2 identity/roles

---

## 1. Goal

Build the lead data pipeline: a `persons` (global identity) + `leads` (per-tenant) schema, a shared
ingestion pipeline (parse → normalize → dedupe → batched upsert), two entry points (admin CSV upload
and a per-tenant webhook), and an admin view of lead counts for QA. Customer-facing delivery and
billing are later phases.

## 2. Decisions (locked with the user)

- **Admin web upload** for the bulk CSV (via a streaming Route Handler, not a server action).
- **Synchronous batched import**, sized for files up to ~100k rows.
- **Webhook accepts both JSON and CSV** (content-type detection); both feed the same pipeline.
- **Scope = ingest + store + admin counts.** No customer lead browsing/delivery this phase.
- **Age tier is computed dynamically** from `last_updated`, never stored (avoids staleness).
- **Segment rule (placeholder):** non-empty `company_name` ⇒ `commercial`, else `residential`.
- **`sha256_lc_hem` is required**; rows without it are counted as errors and skipped.

## 3. Source columns (real `audience_export` format)

```
sha256_lc_hem, first_name, last_name, business_email, personal_phone, mobile_phone,
linkedin_url, personal_address, personal_state, personal_city, personal_zip, personal_zip4,
gender, age_range, income_range, net_worth, job_title, department, company_name,
company_domain, company_revenue, company_employee_count, company_linkedin_url, company_state,
business_email_validation_status, personal_emails, additional_personal_emails, contact_country,
score_category, last_updated
```
`personal_phone` and `mobile_phone` cells may hold comma-separated multiples
(e.g. `"+1843..., +1843..."`). `score_category` ∈ {low, medium, high}. `last_updated` is
`YYYY-MM-DD HH:MM:SS`.

## 4. Data model

### `persons` (global — no tenant_id)
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid pk | |
| `sha_lc_hem` | text not null unique | the hashed email; cross-niche identity key |
| `created_at` / `updated_at` | timestamp | |

### `leads` (per-tenant)
| Column | Type | Source / notes |
|--------|------|----------------|
| `id` | uuid pk | |
| `tenant_id` | uuid not null FK tenants | |
| `person_id` | uuid not null FK persons | |
| `sha_lc_hem` | text not null | denormalized for convenience |
| `first_name` / `last_name` | text | |
| `business_email` | text | `business_email` |
| `personal_phones` | text[] | parsed from `personal_phone` (comma-split, trimmed, deduped) |
| `mobile_phones` | text[] | parsed from `mobile_phone` |
| `emails` | text[] | union of `personal_emails` + `additional_personal_emails` (split, deduped, lowercased) |
| `linkedin_url` | text | |
| `address` | text | `personal_address` |
| `city` / `state` | text | `personal_city` / `personal_state` |
| `zip` / `zip4` | text | `personal_zip` / `personal_zip4` |
| `gender`,`age_range`,`income_range`,`net_worth` | text | demographics |
| `job_title`,`department` | text | |
| `company_name`,`company_domain`,`company_revenue`,`company_employee_count`,`company_state`,`company_linkedin_url` | text | |
| `business_email_validation_status` | text | |
| `contact_country` | text | |
| `score_category` | text | intent tier (low/medium/high) |
| `segment` | enum(`residential`,`commercial`) | derived: company_name present ⇒ commercial |
| `last_updated` | timestamp | source recency; drives dynamic age-tier |
| `extra` | jsonb not null default '{}' | any unmapped columns (e.g. niche `green`/solar flag) |
| `source` | enum(`upload`,`webhook`) | how it arrived |
| `created_at` / `updated_at` | timestamp | |

Unique index on `(tenant_id, person_id)` — one lead per person per tenant.

### `tenants.ingest_key`
A generated secret (random, base64url) per tenant for webhook auth. Added as a nullable column;
backfilled for existing tenants by the seed/migration.

## 5. Age tier (computed, not stored)

`ageTier(lastUpdated, now)`:
- `real_time` if `now - lastUpdated ≤ 24h`
- `one_week` if `≤ 7d`
- `thirty_day` if `≤ 30d`
- `older` otherwise

Used by admin counts now; reused by billing/delivery later.

## 6. Ingestion pipeline (shared)

A single pipeline both entry points call: `ingestRows(tenantId, source, rows)` where `rows` is an
async iterable of raw `Record<string,string>` objects.

1. **Parse** (entry-point specific, streaming):
   - CSV → `csv-parse` streaming parser (handles quoted multi-value cells), yields row objects.
   - JSON → parse the array body into row objects.
   `csv-parse` is pure-JS (no native deps — safe on the Vultr box).
2. **Normalize** (`normalizeRow`, pure + unit-tested): map columns → a `NormalizedLead`; split
   `personal_phone`/`mobile_phone` on commas (trim, drop empties, dedupe); union + lowercase emails;
   derive `segment`; collect any column not in the known set into `extra`. If `sha256_lc_hem` is
   missing/empty → return an error marker (counted, skipped).
3. **Upsert** in batches of ~1000:
   - Upsert `persons` by `sha_lc_hem` (insert if new; touch `updated_at`).
   - Upsert `leads` by `(tenant_id, person_id)`: insert if new (`inserted++`); if existing, update
     only when the incoming `last_updated` is **newer** (`updated++`), else leave (`skipped++`).
4. Returns `{ inserted, updated, skipped, errors }`.

Cross-tenant identity: the same `sha_lc_hem` imported under two tenants creates **one** `persons`
row and **two** `leads` rows — the seed of the cross-site predictive engine.

## 7. Entry points

- **Admin upload** — `POST /api/admin/import?tenantId=<id>` (Route Handler, Node runtime). Requires a
  **god or manager** session (manager limited to their own tenant; god any tenant). Reads the uploaded
  file as a stream → CSV pipeline → returns the summary JSON. Used by the admin upload form.
- **Webhook** — `POST /api/ingest/<tenantId>` with header `x-ingest-key: <key>`. **No session**;
  authenticated solely by matching the tenant's `ingest_key` (constant-time compare). Content-type:
  `application/json` → JSON array; `text/csv`/`text/plain` → CSV body. Same pipeline, `source=webhook`.
  Returns the summary. Invalid/missing key → 401; unknown tenant → 404.

## 8. Admin UI (God area)

A per-tenant **Data panel** (reachable from `/admin`):
- **Webhook Integration** — displays the ready-to-paste `POST https://r0cketship.com/api/ingest/<id>`
  URL and the `ingest_key`, with a one-line example. A "regenerate key" action.
- **CSV upload** — file picker that posts to the import route; shows the returned
  `{inserted, updated, skipped, errors}` summary.
- **Lead counts (QA)** — total leads for the tenant, plus breakdowns: by age-tier, by segment
  (residential/commercial), and top ZIPs by count.

## 9. Testing (TDD)

- `normalizeRow`: phone splitting (single, multi, empty), email union+dedupe+lowercase, segment
  derivation (company present/absent), missing-hash → error, unmapped column → `extra`.
- `ageTier`: each boundary (24h, 7d, 30d).
- `ingestRows` (test DB): insert new; re-import same row → no dup (skipped, not newer); re-import with
  newer `last_updated` → updated; same `sha_lc_hem` across two tenants → one person, two leads; batch
  count correctness over >1000 rows; error rows counted, not inserted.
- Webhook route: missing key → 401, wrong key → 401, good key + JSON → ingested, good key + CSV →
  ingested, unknown tenant → 404.
- Import route: unauthenticated → redirect/401, customer role → 403, manager other-tenant → rejected.
- Stats helpers: counts by tier/segment/zip are tenant-scoped (god cross-tenant view optional).

## 10. Success criteria

1. Uploading the real `audience_export` CSV for roofers.co inserts leads, creating one `persons` row
   per hash and the parsed phone/email arrays.
2. Re-uploading the same file inserts 0 / updates 0 / skips all (idempotent); a file with newer
   `last_updated` updates in place.
3. The webhook URL + key ingests a JSON array and a CSV body identically.
4. The same person hash under two tenants yields one person, two leads.
5. The admin Data panel shows correct counts by age-tier, segment, and ZIP.
6. Webhook rejects missing/wrong keys; import rejects non-god/manager and cross-tenant managers.
7. All covered by passing tests.

## 11. Out of scope (later phases)

Customer-facing lead browsing/delivery + webhooks to customer CRMs (Phase 6), billing/credits/pricing
by tier (Phase 5), background processing for >100k-row files, the AI provisioning wizard, the v2
predictive analytics UI. The finalized residential/commercial classification (beyond the placeholder)
remains deferred.
