# Phase 12 — v2 Predictive Engine Design

**Date:** 2026-05-31
**Status:** Approved (user "keep building all machinery"), ready for build
**Builds on:** Phase 3 global `persons` + per-tenant `leads`, Phase 6 deliveries, Phase 11 calls

## Goal
A cross-site analytics + predictive-scoring layer over the global identity spine (`sha_lc_hem`): score
every lead's likelihood to convert, surface high-intent "predictive" leads, and give the God account
nationwide + cross-niche insight (who's looking, by ZIP; who converts; who looks like a converter).
No external ML — a transparent heuristic over the signals already collected.

## Modules (no new tables — reads persons/leads/lead_deliveries/calls)
- `src/predictive/scoring.ts` (pure):
  `predictiveScore({ scoreCategory, convertedElsewhere, ageTier, hasCompany })` → 0–100.
  Weights: intent tier (high 40 / medium 25 / low 10) + cross-site converted-elsewhere (+30, the
  lookalike signal) + recency (real_time 20 / one_week 12 / thirty_day 6 / older 2) + commercial (+5).
- `src/predictive/analytics.ts` (DB, god/cross-tenant):
  - `convertedHashes()` → `Set<sha_lc_hem>` of persons with a booked/sold delivery OR a sold call in
    ANY tenant (the "converted somewhere" signal).
  - `personFootprint(shaLcHem)` → every lead for that person across tenants + their delivery/call
    outcomes (the cross-site track).
  - `globalLeadCounts(now)` → nationwide totals: total leads, distinct persons, persons spanning ≥2
    tenants (cross-site), by tier, by segment, top ZIPs.
  - `predictiveLeads(tenantId, limit, now)` → that tenant's leads scored with `predictiveScore`
    (using `convertedHashes` for the cross-site signal + dynamic age tier), sorted desc, top N — the
    "high-intent predictive targeting" list.

## UI
- God **`/admin/insights`**: nationwide counts (leads, distinct persons, cross-site persons), top ZIPs,
  conversion summary, and a per-tenant **top predictive leads** table (score + zip + tier + score
  category). Linked from `/admin`.

## Testing (TDD)
- `predictiveScore`: each signal moves the score; capped at 100; a high-intent cross-site converter
  near-real-time scores higher than a cold low-intent older lead.
- `convertedHashes`: includes a person sold in another tenant; excludes non-converters.
- `predictiveLeads`: ranks a high-intent + converted-elsewhere lead above a cold one; respects limit.
- `globalLeadCounts`: counts distinct persons + cross-site persons across two tenants sharing a hash.

## Out of scope
Trained ML models; real-time streaming signals; the "blue tarp → roof" external-purchase signals
(those would arrive via the ingestion `extra` columns and can feed the heuristic later); a
customer-facing predictive UI (god-only insight for now).
