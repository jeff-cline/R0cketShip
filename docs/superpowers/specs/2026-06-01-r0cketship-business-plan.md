# r0cketship — Business Plan & Go-to-Market Strategy

**Date:** 2026-06-01
**Status:** Draft v2 — reframed after discovering deployed platform state
**Author:** Jeff Cline + Claude (brainstorming session)

---

## What r0cketship Already Is

This is **not** a build plan. r0cketship is **already a live, multi-tenant, white-label lead-generation platform** on production infrastructure (Vultr, Next.js, Postgres, nginx, pm2, HTTPS via Let's Encrypt). 14 build phases shipped. 164 tests green. The first white-label tenant (roofers.co) is live.

### Already shipped & deployed

- **Multi-tenant chassis** — hostname routing, tenant-scoped theming, God account = r0cketship.com
- **Identity & RBAC** — roles: god / manager / customer / agent, impersonation, session auth
- **Data ingestion** — global `persons` (sha_lc_hem keyed) + per-tenant `leads` pipeline, CSV upload + per-tenant webhook (`POST /api/ingest/<tenantId>` with `x-ingest-key`), normalize → dedupe → upsert
- **Marketing site** — branded landing, /about, /how-it-works, /contact, /pricing, /partner (e-partnership application), /signup, /terms
- **Wallet & billing** — `wallets` + immutable `credit_ledger` + `payments` + `coupons`, $50 signup bonus, age-tiered lead pricing ($11 / $4 / $1.44 per lead), Stripe + PayPal + manual provider (key-gated, ready to activate)
- **ZIP subscriptions** — already coded with **three offer types: `data` ($1,500), `booking` ($4,500), `epartner` (negotiated)** + volume discount ladder (2nd ZIP −10%, 3rd −20%, 4th+ −30%), recurring monthly invoices, leads free inside subscribed ZIPs
- **Lead delivery + CRM** — pool filtering by zip/segment/tier/score, atomic wallet debit, PII hidden until purchase, customer CRM with stats/notes/CSV export, outbound webhook per customer
- **Affiliate program** — 10% commission on referred top-ups, `?ref=` capture, customer `/affiliate` page
- **Tenant provisioning wizard** — `/admin/launch` (god) creates new white-label in minutes: domain, niche, hero image/video/headline/subhead/offers/features/theme/colors/logo/fee-rate/data-cost-rate
- **Stripe + PayPal adapters** — built, key-gated, activate when sandbox keys pasted in `/admin/integrations`
- **Email + booking engine** — nodemailer SMTP, tracked booking redirects (`/api/book/[delivery]` marks delivery `booked`), per-customer email template, key-gated
- **Twilio call-center dialer** — `agent` role, calls table with dispositions (no_answer/left_msg/callback/hot_transfer/booked/sold/dead), click-to-call, hot-transfer numbers, agent KPIs, key-gated
- **v2 predictive engine** — heuristic scoring (intent tier + cross-site converted +30 + recency + commercial), `/admin/insights` with nationwide counts + top ZIPs + top predictive leads
- **Premium design system** — Plus Jakarta Sans / Inter / Fraunces, three site styles (trust/bold/dark), themable per tenant, primitives & charts components, AppShell + AppNav for customer app, MarketingNav for public, ImpersonationBanner
- **Admin redesign + economics** — left dark sidebar with rocket-bullet nav, per-tenant P&L, god platform dashboard (revenue/GP/sales + area + bar by white-label), 60% platform fee / 40% white-label split visible
- **SEO/AEO** — host-aware metadata, JSON-LD @graph, dynamic sitemap + robots per tenant, niche directory page (`/niches`), mobile menus
- **Integrations hub** — `/integrations` public page listing 9 easy-API CRMs (GoHighLevel/HubSpot/Zapier/Make/Pipedrive/Salesforce/Keap/ActiveCampaign/Zoho), inbound data webhook docs in admin, CRM push guide for customers

### The economic model already coded
- **r0cketship takes 60% of every white-label sale** (platform/data revenue)
- **White-label keeps 40%** (their lift after data cost)
- Per-tenant `platform_fee_rate` (default 0.60) and `data_cost_rate` (default 0.00) — tunable per partner
- God dashboard shows platform revenue, gross profit, and 60%-by-white-label bar chart
- Each white-label sees the 60% as a COST on their P&L (transparency, not hidden)

### What's left (small)
- Hardening: rate-limit/email-verify `/signup` ($50-bonus abuse), DOMPurify on footer/email HTML
- Scale: push in-memory pool/predictive/global-counts scans to SQL at 100k+ rows
- Stripe subscription auto-charge (subscription invoices still manual)
- Per-niche dedicated SEO landing pages (template ready, just need niche content)
- New-domain go-live still a manual operator step: DNS → 137.220.56.129 + nginx server_name + certbot

**Implication:** new SKU launch is no longer a "build week." It's **~1–2 hours of platform work** (DNS, nginx, certbot, `/admin/launch` wizard) + **the marketing engine for that niche** (ad creative, lead magnet copy, data sourcing if not already ingested). That changes everything about the deployment plan.

---

## Executive Summary

r0cketship is a **deployed, white-label, multi-tenant lead-generation platform** that monetizes a $100k/yr predictive-data stack across an unbounded portfolio of niche-branded sites. The platform handles tenant provisioning, theming, data ingestion, lead pricing, wallet/subscriptions, CRM, affiliate, dialer, email, and Stripe/PayPal — all built. The remaining work is **GTM**: choose the highest-LTV niches, spin up tenants via the existing wizard, drive traffic, and operate the SDR/closer team that monetizes Tier 2 ($4,500/mo booking) and JV (negotiated success-fee).

**Target outcome:** $100M ARR within 3 years, $1B valuation at 8–10x revenue, ~2,400 customers at $42k blended ACV. Reachable faster than typical SaaS because the platform is already operational and the unit economics (60% take rate, ~85% software margin on Tier 1) are exceptional.

---

## Pricing Tiers (already coded as ZIP subscription offers)

| Offer type in DB | Price | What's included | Gross margin | Buyer |
|---|---|---|---|---|
| `data` | $1,500/mo | Predictive intent + ZIP exclusivity + CRM sync + DNC-clean + 5-yr retrospective + weekly refresh + compliance-disclaimed | ~85% | SMB owner running own outbound |
| `booking` | $4,500/mo | All of `data` + AI/agent-assisted real-time appointment setting + dedicated success manager | ~55% | Owner outsourcing the dial motion |
| `epartner` | Negotiated ($4,500/mo + 10–25% of closed revenue, or per-deal success fee) | All of `booking` + we run the closing motion as an extension of their team | 30–50% + upside | Operator with proven LTV who wants a partner |

Volume discounts already coded: 2nd ZIP −10%, 3rd −20%, 4th+ −30%.

Blended ACV target: **$42,000/customer/year** (50% Tier 1 / 40% Tier 2 / 10% Tier 3 with $5k/mo JV add-on)

---

## Portfolio of 12 SKUs — Scored & Ranked

Scoring: Demand (search vol + competitor count + ad CPC heat), Revenue (blended ACV × retention × upsell × win rate), +1 adjacency bonus if it inherits the existing roofers.co playbook.

| Rank | SKU brand idea | Niche | Demand | Revenue | Adj. | Composite |
|---|---|---|---|---|---|---|
| 1 | SolarSignal | Solar/HVAC/Roofing | 10 | 9 | ✅ | 10.0 |
| 2 | ContractorLeads.Live | Home services | 9 | 8 | ✅ | 9.0 |
| 3 | Pipeline.Weekly | B2B SaaS sales | 10 | 8 | ❌ | 9.0 |
| 4 | AgencyVault | Marketing agencies (white-label) | 7 | 10 | ❌ | 8.5 |
| 5 | MortgageHeat | Mortgage brokers | 9 | 8 | ❌ | 8.5 |
| 6 | WealthScope | Financial advisors | 7 | 10 | ❌ | 8.5 |
| 7 | LifeEventAlerts | Insurance agents | 8 | 8 | ❌ | 8.0 |
| 8 | ShopperPulse | Ecom/DTC | 8 | 8 | ❌ | 8.0 |
| 9 | MoverIntel | Realtors | 9 | 6 | ❌ | 7.5 |
| 10 | PatientPulse | Med spas/dental/chiro | 8 | 7 | ❌ | 7.5 |
| 11 | TalentRadar | Recruiters | 7 | 7 | ❌ | 7.0 |
| 12 | BizOwner.Pro | M&A/B2B brokers | 6 | 8 | ❌ | 7.0 |

---

## Micro-Niche Universe (1,030+ sub-niches across 20 buckets)

| # | Bucket | Sub-niches | LTV ceiling | Best offer |
|---|---|---|---|---|
| 1 | Specialty Construction & Trades | 80 | $4.5k–10k/mo | booking + epartner |
| 2 | Medical / Specialty Healthcare | 90 | $4.5k–15k/mo | booking + epartner |
| 3 | Industrial Manufacturing | 70 | $4.5k–10k/mo | booking |
| 4 | Energy & Cleantech | 50 | $4.5k–15k/mo | epartner |
| 5 | Specialty Professional Services (legal/finance) | 80 | $4.5k–15k/mo | booking + epartner |
| 6 | Vertical B2B SaaS | 70 | $1.5k–4.5k/mo | data |
| 7 | Specialty Finance & Lending | 50 | $4.5k–10k/mo | epartner |
| 8 | Commercial Real Estate (specialty) | 50 | $4.5k–15k/mo | epartner |
| 9 | DTC / Ecommerce verticals | 60 | $1.5k–4.5k/mo | data–booking |
| 10 | Government & Defense contracting | 40 | $4.5k–15k/mo | epartner |
| 11 | Specialty Insurance | 40 | $4.5k–10k/mo | booking |
| 12 | Agriculture / Food / Cannabis | 50 | $1.5k–4.5k/mo | booking |
| 13 | Marine / Aviation / Auto specialty | 40 | $4.5k–15k/mo | epartner |
| 14 | Senior care / hospice / LTC | 30 | $4.5k–10k/mo | booking + epartner |
| 15 | Education / training / coaching | 50 | $1.5k–4.5k/mo | data |
| 16 | Logistics & supply chain | 40 | $4.5k–10k/mo | booking |
| 17 | Veterinary / pet specialty | 30 | $1.5k–4.5k/mo | booking |
| 18 | Cybersecurity & compliance services | 40 | $4.5k–10k/mo | booking |
| 19 | Hospitality / events / boutique | 40 | $1.5k–4.5k/mo | data |
| 20 | Religious / nonprofit / mission-driven | 30 | $1.5k–4.5k/mo | data |
| **Total** | | **~1,030** | | |

### Top 40 Highest-LTV Micro-Niches

| # | Micro-niche | Bucket | Avg deal size | Best offer / monthly ceiling |
|---|---|---|---|---|
| 1 | Commercial roofing contractors | Construction | $250k–$5M | epartner, $10k/mo |
| 2 | Solar farm developers (utility scale) | Energy | $5M–$100M | epartner, $15k+/mo |
| 3 | Data center electrical contractors | Construction | $5M–$50M | epartner, $15k+/mo |
| 4 | EV fleet electrification consultants | Energy | $1M–$20M | epartner, $10k+/mo |
| 5 | Bio 3D printing | MedTech | $500k–$5M | booking, $10k/mo |
| 6 | Cardiac genetic testing labs | Healthcare | $50k–$500k | booking, $10k/mo |
| 7 | Industrial automation integrators | Industrial | $500k–$10M | epartner, $10k+/mo |
| 8 | Mass tort / class action law firms | Legal | $50k–$5M per case | epartner, $15k+/mo |
| 9 | R&D tax credit consultants | Finance | $50k–$500k fee | booking, $10k/mo |
| 10 | Federal contracting consultants (GovCon) | GovDef | $100k–$5M contracts | epartner, $10k+/mo |
| 11 | Aerospace machining (AS9100) | Industrial | $500k–$50M | epartner, $10k+/mo |
| 12 | Defense contractor (Tier 2/3) sourcing | GovDef | $1M–$100M | epartner, $15k+/mo |
| 13 | CRO clinical trial site sourcing | Healthcare | $1M–$50M | epartner, $15k+/mo |
| 14 | Surgical centers (ASCs) acquisition | Healthcare | $5M–$50M | epartner, $15k+/mo |
| 15 | Veterinary specialty practice acquirers | Healthcare | $2M–$20M | epartner, $10k+/mo |
| 16 | Hospice / palliative care growth | Healthcare | $500k–$10M | epartner, $10k+/mo |
| 17 | TMS / ketamine clinic chains | Healthcare | $500k–$5M | booking, $10k/mo |
| 18 | Compounding pharmacies (B2B) | Healthcare | $50k–$500k | booking, $10k/mo |
| 19 | Dental implant labs | Healthcare | $100k–$2M | booking, $10k/mo |
| 20 | IVF / fertility clinics | Healthcare | $20k–$50k per patient | booking, $10k/mo |
| 21 | Industrial coatings (commercial) | Industrial | $500k–$10M | booking, $10k/mo |
| 22 | Crane operators / heavy lift | Construction | $100k–$5M per job | booking, $10k/mo |
| 23 | Industrial scaffolding | Construction | $500k–$10M | booking, $10k/mo |
| 24 | Curtain wall installers | Construction | $1M–$50M | booking, $10k/mo |
| 25 | Fire protection / sprinkler (commercial) | Construction | $250k–$10M | booking, $10k/mo |
| 26 | Geothermal HVAC developers | Energy | $500k–$10M | epartner, $10k+/mo |
| 27 | Battery storage integrators | Energy | $1M–$50M | epartner, $15k+/mo |
| 28 | Microgrid developers | Energy | $5M–$100M | epartner, $15k+/mo |
| 29 | Hydrogen developers | Energy | $10M–$500M | epartner, $15k+/mo |
| 30 | Carbon capture firms | Energy | $10M–$500M | epartner, $15k+/mo |
| 31 | Tax attorneys (HNW / international) | Legal | $50k–$500k retainers | booking, $10k/mo |
| 32 | Immigration attorneys (EB-5, O-1, EB-1) | Legal | $20k–$100k per case | booking, $10k/mo |
| 33 | Patent attorneys (boutique) | Legal | $50k–$500k per case | booking, $10k/mo |
| 34 | M&A boutique advisories | Finance | $250k–$5M fees | epartner, $15k+/mo |
| 35 | Family offices (alt investment) | Finance | $1M–$50M placements | epartner, $15k+/mo |
| 36 | Superyacht brokers | Marine | $5M–$200M sales | epartner, $15k+/mo |
| 37 | Private aviation (charter / fractional) | Aviation | $500k–$10M annually per client | epartner, $15k+/mo |
| 38 | Aircraft maintenance (MRO) | Aviation | $500k–$50M contracts | epartner, $10k+/mo |
| 39 | Self-storage / mobile home park investors | Real Estate | $5M–$50M acquisitions | epartner, $10k+/mo |
| 40 | Data center developers | Real Estate | $50M–$5B projects | epartner, $15k+/mo |

---

## $1B Valuation Path

### Comps (2026)
- ZoomInfo — public, ~$5–6B mkt cap, ~6x revenue (decelerating)
- 6sense — private, ~$5.2B (12–15x revenue, intent-data thesis)
- Clay — private, ~$1.25B at 2025 round (~30x revenue, AI-enrichment thesis)
- Apollo.io — private, ~$1.6B (5–7x revenue)
- Cognism / Lusha / LeadIQ — $300M–$1.5B

### Multiple target: 8–10x revenue
(vertical-AI platform + NRR >115% + GM >65% + 60% take rate + already-deployed = premium)

| Target valuation | Required ARR | Customers @ $42k blended ACV |
|---|---|---|
| $250M (Series B exit-ready) | $30M | ~715 |
| $500M | $60M | ~1,430 |
| **$1B** | **$100M** | **~2,400** |
| $2B | $200M | ~4,800 |

### Equity narrative (revised, stronger)
> *"r0cketship is the deployed vertical-AI sales platform for the 1,200 micro-industries that ZoomInfo and Apollo overlook. Unlike data resellers, we own the **full stack from data ingestion to closed-deal revenue share** — built and live: multi-tenant platform, white-label provisioning wizard, ZIP-exclusive subscriptions ($1,500 / $4,500 / JV), AI booking, integrated dialer, CRM, affiliate, and a 60% platform take-rate already coded into every transaction. Each new vertical = a new branded white-label deployed in hours via our wizard. Year 1 target: 30+ verticals, $5M ARR. Year 3: 80 verticals, $100M ARR. Year 5: 200 verticals, $250M ARR — IPO scale."*

### Milestones the market needs to see
- **Year 1:** 12–20 white-labels live, $3–5M ARR, NRR ≥110%, ≥10% revenue from `booking` tier
- **Year 2:** 30–50 white-labels, $15–25M ARR, NRR ≥120%, 15%+ epartner revenue, two $1M+ JV partners
- **Year 3:** 60–80 white-labels, $50–100M ARR, NRR ≥125%, gross margin ≥65%
- **Year 5:** 150–200 white-labels, $200M+ ARR — IPO/strategic exit

---

## 52-Week Deployment Plan (revised — provision, not build)

Since the platform is shipped, each weekly "launch" is now ~1–2 hours of platform work + a marketing engine spin-up. We can run **more than 1 per week** with one engineer + one marketer, but we'll pace at 1/week so the SDR team can ramp on each new niche before the next one drops.

### Pre-flight (Week 1 only — small hardening + readiness)
- W0/W1: Activate Stripe + Twilio + SMTP in `/admin/integrations` with real keys; rate-limit /signup; finalize Subscription auto-charge via Stripe Billing (currently manual invoices); spin up first SDR and first closer; finalize ad creative templates; finalize lead magnet template

### Wave 1 — Weeks 2–9 — extend the roofers.co playbook (adjacent contractor verticals)
Each week: register domain → DNS → nginx + certbot → `/admin/launch` wizard → ad creative → SDR scripts
- W2 SolarSignal · W3 CommercialRoofing.Pro · W4 HVACPipeline · W5 ContractorLeads.Live · W6 ElectricalPro.Live · W7 PlumbingPipeline · W8 ConcreteIntel · W9 WindowAndDoorPro

### Wave 2 — Weeks 10–17 — B2B sales + agencies + specialty finance
- W10 Pipeline.Weekly · W11 AgencyVault · W12 MortgageHeat · W13 WealthScope · W14 TaxCreditPro · W15 M&AScope · W16 LifeEventAlerts · W17 FamilyOfficeIntel

### Wave 3 — Weeks 18–29 — medical & regulated
- W18 SurgicalCenterIntel · W19 VetSpecialty.Live · W20 HospicePipeline · W21 DentalImplantLab.Live · W22 IVFConnect · W23 TMS.Live · W24 CompoundingRx · W25 ConciergeMedicine · W26 AestheticPractice · W27 BehavioralHealthIntel · W28 PatientPulse · W29 MedDeviceB2B

### Wave 4 — Weeks 30–41 — industrial & energy
- W30 AutomationIntegrator.Pro · W31 AerospaceMachining · W32 DefenseSubcontractor · W33 DataCenterEC · W34 EVFleetPro · W35 BatteryStorage.Live · W36 GeothermalPro · W37 HydrogenIntel · W38 CarbonCapturePro · W39 IndustrialCoatings · W40 HeavyLift.Live · W41 FabricationPro

### Wave 5 — Weeks 42–52 — specialty professional / lifestyle / GovCon
- W42 GovConPipeline · W43 MassTortIntel · W44 PatentPipeline · W45 ImmigrationIntel · W46 SuperyachtPro · W47 PrivateAviation.Live · W48 SelfStorageIntel · W49 DataCenterDev.Pro · W50 SeniorHousingIntel · W51 NetLeaseIntel · W52 PortfolioReview (kill bottom 8, double ad spend on top 10)

### Per-launch checklist (repeatable, ~6 hours work spread over 1 week)
**Mon (operator, ~1 hour):**
1. Register domain
2. DNS A + AAAA → 137.220.56.129
3. Add nginx server_name + run certbot
4. `/admin/launch`: niche + style + colors + hero image/video + headline + subhead + 3 offers (`data $1,500`, `booking $4,500`, `epartner negotiated`) + features per offer + fee/data-cost rates

**Mon–Tue (marketer, ~3 hours):**
5. Hero image/video shot or sourced (2400×1400 JPG/WebP <400KB OR 1920×1080 H.264 <5MB)
6. Ad creative (Meta + LinkedIn + Google) variants — 3 hooks × 3 visuals
7. Lead magnet copy ("50 free [niche] leads in your ZIP")

**Wed (data ops, ~1 hour):**
8. Pull niche-specific persons via ingest pipeline (CSV upload or webhook), verify counts in `/admin/data`

**Thu (SDR lead, ~1 hour):**
9. SDR script + objection handlers + qualifying questions for the niche
10. Twilio dialer queue configured + agent assigned

**Fri (launch):**
11. Ads go live at $500–1,000 spend
12. SDR starts dialing inbound leads
13. CPL/CAC dashboard monitored

### Kill / scale criteria (gate at week 4 per SKU)
- **Kill** if: CAC > 1.5x first-month payment AND no `booking`-tier upgrades within 60 days
- **Scale** if: CAC < first-month payment AND ≥10% of buyers upgrade to `booking` within 60 days → 5x ad spend, hire dedicated SDR

---

## Team & Org (next 6 months)

You already have the platform. The hiring focus is the **revenue engine**, not the build:

- **Founder/CEO (you)** — vision, JV deals, partner relationships, ad creative direction
- **1 platform engineer (existing)** — keep maintenance work + small hardening (rate-limit signup, DOMPurify, Stripe subscription auto-charge, per-niche SEO pages)
- **1 marketer/creator** — owns per-SKU funnels, ad creative, lead magnets, video production
- **2 SDRs** — Wave 1 SKUs at first, then specialized as portfolio expands; agent role in the platform
- **1 closer / AE** — runs `booking` + `epartner` conversations, owns conversion to Tier 2/3
- **1 ops / fulfillment** — runs the dialer, manages handoffs, manages SMTP campaigns, runs the AI booking workflow
- **1 fractional CFO + counsel** — epartner contracts, billing structure, fundraise prep

### CAC / payback per tier

| Tier | Target CAC | Payback | LTV (24-mo) |
|---|---|---|---|
| `data` ($1,500) | <$1,500 | 1 month | $30k+ |
| `booking` ($4,500) | <$3,000 | <1 month | $90k+ |
| `epartner` (JV) | <$5,000 + relationship | <2 months | $250k+ |

---

## Branding & Website Architecture (already in place)

- Parent brand: **r0cketship.com** (God account) — rocket motif, "Your unfair advantage," predictive intent + ZIP exclusivity positioning
- First white-label live: **roofers.co**
- Hub `/niches` page already exists for cross-linking all white-labels
- Each new white-label gets:
  - Its own domain (preferred for SEO + ad relevance + buyer trust)
  - Theme/color picker via `/admin/branding`
  - Hero image/video + headline/subhead via admin
  - Inherits 3 offers (`data`, `booking`, `epartner`) automatically
  - SEO/AEO host-aware metadata + JSON-LD + dynamic sitemap

**Strategy:** keep niche domains separate (proven to convert 3–5x better on paid ads than generic data domains), with r0cketship.com as the parent corporate brand and `/niches` as the master directory.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Data source dependency (Apollo, etc.) | Diversify across 5+ sources; build first-party intent capture via lead magnets |
| Compliance (TCPA, GDPR, CCPA, DNC) | DNC-scrub is core; legal review per vertical (esp. healthcare, financial) |
| AI booking agent quality | Start with human-in-the-loop (agent role exists), ramp automation per niche; track booking-to-show rate |
| Channel concentration (Meta / LinkedIn algorithm shifts) | Diversify per SKU; build SEO long-tail per niche (template ready, content needed) |
| Cannibalization between white-labels | Disciplined ICP definition per brand; share-of-buyer audit quarterly |
| JV partners default on revenue share | Standardized epartner contracts; advance + monthly reconciliation; cap exposure |
| $50 signup-bonus abuse | Rate-limit + email-verify /signup (small hardening, ~1 day) |
| Scale (in-memory pool scans) | Push to SQL queries at 100k+ rows (hardening, ~1 sprint) |

---

## Immediate Next Steps

1. Founder approves this revised spec
2. Pick first 4 niches for Wave 1 launches (recommendation: **SolarSignal, CommercialRoofing.Pro, MortgageHeat, AgencyVault** — different ad channels, different buyers = clean A/B/C/D test)
3. Decide pre-flight hardening priorities (Stripe subscription auto-charge, /signup rate-limit, per-niche SEO pages — pick what's blocking $-flow)
4. Hire/contract the marketing creator + first SDR
5. Move to writing-plans skill for the Wave-1 launch playbook (the exact repeatable 6-hour-per-niche script)
