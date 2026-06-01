# r0cketship Wave-1 Launch Playbook

**The repeatable 6-hour-per-niche script. Execute every Monday.**

**Date:** 2026-06-01
**Status:** v1 — ready to execute
**Owner:** Operator / Marketer / Data Ops / SDR Lead — distributed
**Goal:** Spin up one new white-label niche site per week with ads live by Friday EOD.

---

## 0. Prerequisites (one-time, do once before Wave 1 starts)

### 0.1 Pre-flight hardening (engineer, 1 sprint)
- [ ] Stripe subscription auto-charge wired (currently monthly invoices are manual — blocks scale at >50 customers)
- [ ] `/signup` rate-limit + email-verify (closes the $50-bonus abuse vector)
- [ ] DOMPurify on footer/email HTML (XSS hardening)
- [ ] Per-niche dedicated SEO landing page templates (`/[slug]-leads-in-[zip]` for AEO)

### 0.2 Integration keys live in `/admin/integrations`
- [ ] Stripe live/prod keys + webhook secret
- [ ] PayPal live/prod keys (backup payment route)
- [ ] SMTP credentials (host/port/user/pass/from) — production email sender (SendGrid, Postmark, or AWS SES recommended)
- [ ] Twilio account SID + auth token + verified caller IDs
- [ ] Hot-transfer phone number(s) for agent role

### 0.3 Team in seats
- [ ] 1 marketer/creator hired (owns ad creative + hero assets + lead-magnet copy)
- [ ] 1 SDR hired (works /agent role — Twilio dialer, scripts, dispositions)
- [ ] 1 closer/AE in seat (handles `booking` and `epartner` upgrades)
- [ ] 1 ops/fulfillment in seat (runs the AI booking workflow, SMTP campaigns, escalations)

### 0.4 Asset library (built once, used every launch)
- [ ] **Ad creative master file** (Figma) with locked layout templates — variables: `[NICHE]`, `[CITY/ZIP]`, `[STAT]`, `[CTA]`
- [ ] **Lead magnet master copy** (`50 free [NICHE] leads in your ZIP, delivered to your CRM`)
- [ ] **SDR call script master** (intro + 3 qualifying questions + objection handlers + booking ask)
- [ ] **Email drip master** (Day 0 welcome → Day 2 social proof → Day 5 booking ask → Day 14 upgrade ask)

---

## 1. Weekly Launch Cycle — 6 hours of work over 5 days

### Friday before launch week (Operator, 30 min)

1. **Pick the niche** — pull from the 52-week deployment plan (see business plan spec)
2. **Domain check** — run availability check on preferred domain + 2 alternates
   - Preferred naming: `[verb][niche].com` / `[niche].live` / `[niche]signal.com` / `[niche]heat.com`
   - Examples already mapped: SolarSignal, CommercialRoofing.Pro, MortgageHeat, AgencyVault
3. **Register domain** at Namecheap or Cloudflare (use Cloudflare for DNS speed + free SSL fallback)
4. **Brief the marketer** with niche + persona one-liner ("commercial roofers doing $1M+/yr, owner-operator, hates spam, wants exclusive ZIP")
5. **Brief data ops** with niche + filter criteria (SIC code(s), revenue band, geography focus)

### Monday — Operator (1 hour)

#### Step 1: DNS (5 min)
At your registrar, add:
```
Type  Host  Value
A     @     137.220.56.129
A     www   137.220.56.129
```
Wait 5–60 min for DNS to propagate. Test:
```bash
dig +short [newdomain].com
# Should return: 137.220.56.129
```

#### Step 2: nginx server_name block (10 min)
SSH to the box:
```bash
ssh r0cketship
```
Edit `/etc/nginx/sites-available/r0cketship` — add the new domain to the existing `server_name` line:
```nginx
server_name roofers.co www.roofers.co r0cketship.com www.r0cketship.com [newdomain].com www.[newdomain].com;
```
Test config & reload:
```bash
nginx -t && systemctl reload nginx
```

#### Step 3: certbot for HTTPS (5 min)
```bash
certbot --nginx -d [newdomain].com -d www.[newdomain].com --non-interactive --agree-tos -m admin@r0cketship.com --redirect
```
Verify HTTPS:
```bash
curl -I https://[newdomain].com
# Should return 200 (will show parent site until tenant is created)
```

#### Step 4: `/admin/launch` wizard (30 min)
Go to https://r0cketship.com/admin/launch (login as god: jeff.cline@me.com). Fill in:

| Field | Value |
|---|---|
| **Domain** | `[newdomain].com` (no protocol, no www) |
| **Niche** | e.g., `commercial roofing` |
| **Money word** | e.g., `Commercial Roofing` (used in hero + brand voice) |
| **Site style** | bold / trust / dark (pick per niche — bold for sales/aggressive niches, trust for healthcare/financial, dark for tech) |
| **Brand colors** | Primary + accent hex picked from niche-color guide (see §3.2) |
| **Logo** | Upload niche-specific logo (or generate via DALL-E / Midjourney with rocket motif + niche imagery) |
| **Hero image / video** | Paste URL or upload (specs in §3.1) |
| **Hero headline** | "High-intent [niche] customers actively looking in your exclusive ZIP" |
| **Hero subhead** | "Delivered daily to your CRM. DNC-clean. No card to start." |
| **Offer 1 — `data`** | Price: 1500, Features: ["ZIP-exclusive lead pool", "Updated daily", "DNC-clean", "5-yr retrospective", "CRM sync (HubSpot, GHL, Salesforce, Pipedrive, Close, Zoho)"] |
| **Offer 2 — `booking`** | Price: 4500, Features: ["Everything in Data", "AI-assisted real-time appointment setting", "Booked meetings on your calendar", "Dedicated success manager", "Hot transfer to your sales rep"] |
| **Offer 3 — `epartner`** | Price: 4500 + revenue share, Features: ["Everything in Booking", "We close deals as an extension of your team", "Monthly base + backend success fee", "Negotiated terms"] |
| **Platform fee rate** | 0.60 (default — adjust only for negotiated partners) |
| **Data cost rate** | 0.00 (default — adjust if you're sourcing premium data for this niche) |
| **Signup bonus credits** | 50 (default — equals $50 of free leads at age-tier $11/$4/$1.44) |
| **Footer copy** | Disclaim: "All leads DNC-scrubbed. Compliance: TCPA, GDPR, CCPA. Use only for permitted purposes." |

Save. Visit `https://[newdomain].com` — the new site should render with your config.

#### Step 5: Verify tenant works (10 min)
- [ ] Marketing landing renders with your hero
- [ ] `/pricing` shows all 3 offers
- [ ] `/signup` creates a test customer + auto-grants $50 wallet credit
- [ ] `/leads` shows the lead pool (filtered by ingest)
- [ ] `/integrations` page renders with CRM grid

---

### Monday–Tuesday — Marketer (3 hours)

#### 3.1 Hero asset (1 hour)
**Static image specs:**
- Resolution: 2400×1400 (or larger, cropped to 16:9)
- Format: JPG or WebP
- Size: <400KB (compress via Squoosh or TinyPNG)
- Subject: niche-relevant, no baked-on text, centered subject, room for overlay
- Lighting: warm, professional, not stock-looking

**Video specs (preferred — 3–5x engagement on landing):**
- Resolution: 1920×1080 minimum (1280 is OK if source-limited)
- Format: H.264 MP4
- Audio: muted (autoplay won't work with audio)
- Length: 6–12 seconds, loops cleanly
- Size: ≤5MB (compress via ffmpeg or Handbrake)
- Compression command (run on box if you have raw source):
```bash
ffmpeg -i source.mp4 -vf "scale=1280:-1" -movflags +faststart -c:v libx264 -crf 28 -preset slow -an output.mp4
```

Upload via `/admin/branding` (per-tenant) — sets `hero_video` and/or `hero_image`. Poster image auto-generated.

#### 3.2 Niche color guide (use this for the `/admin/launch` color picker)

| Niche family | Primary | Accent | Style |
|---|---|---|---|
| Solar / clean energy | `#FFB400` (sun gold) | `#0EA5E9` (sky blue) | bold |
| Commercial roofing / construction | `#1E40AF` (deep blue) | `#F97316` (safety orange) | bold |
| Mortgage / finance | `#065F46` (money green) | `#FBBF24` (gold) | trust |
| Marketing agencies | `#7C3AED` (violet) | `#06B6D4` (cyan) | dark |
| Healthcare / medical | `#0891B2` (clinical blue) | `#10B981` (vital green) | trust |
| Legal | `#1F2937` (charcoal) | `#B45309` (oxblood) | trust |
| Industrial / defense | `#374151` (steel gray) | `#DC2626` (alert red) | dark |
| Real estate / brokers | `#1E3A8A` (navy) | `#F59E0B` (gold) | trust |
| Hospitality / luxury | `#000000` (black) | `#D4AF37` (champagne) | dark |
| Cannabis / agriculture | `#166534` (deep green) | `#FACC15` (sun yellow) | bold |

#### 3.3 Ad creative templates (2 hours)

**Master template (substitute `[NICHE]`, `[STAT]`, `[CITY]` per launch):**

**Hook A — Pain-led:**
> "Tired of stale [NICHE] lists everyone else has? Get the ones actively looking — DNC-clean, ZIP-exclusive, in your CRM tomorrow morning."

**Hook B — Outcome-led:**
> "[NUMBER] [NICHE] businesses booked discovery calls last month from our predictive engine. Get the next batch in your ZIP. 50 free leads."

**Hook C — FOMO/exclusivity-led:**
> "We only sell each ZIP code once. [CITY] is open. After today, your competitor gets it. Claim your ZIP — 50 free leads first."

**Visual treatment options:**
1. Hero shot — clean product shot of the platform UI with niche-specific data
2. Social proof — customer testimonial with face + outcome stat
3. Before/after — pipeline before (empty CRM) vs. after (full CRM with notes)

**Channels & creative count for launch:**
- **Meta (Facebook/Instagram):** 9 ads = 3 hooks × 3 visuals at $200/day starting budget
- **LinkedIn:** 3 ads = focus on Hook B (outcome-led) + visual #2 (social proof) at $100/day starting budget — only for B2B niches
- **Google Search:** Bid on `[niche] leads`, `buy [niche] leads`, `[niche] prospecting`, `predictive [niche] data` — $50/day cap to start

#### 3.4 Lead magnet copy
Use the niche-substituted master:
> **Get 50 Free [NICHE] Leads in Your ZIP**
> Sign up, pick your ZIP, and we'll send 50 high-intent [NICHE] prospects straight to your CRM today. DNC-clean. Updated weekly. No card. Cancel anytime.

CTA button: **"Claim My 50 Free Leads"**

---

### Wednesday — Data Ops (1 hour)

#### 4.1 Source the niche-specific persons
Use the platform's ingest pipeline. Either:

**Option A — CSV upload (best for one-time backfill):**
1. Query your data stack (Apollo + intent + DataForSEO) with niche-specific filters
2. Export CSV in `audience_export` format (the format the platform expects)
3. Go to `/admin/data` → "Upload CSV"
4. Confirm row count + tier distribution (real_time / one_week / thirty_day / older)

**Option B — Webhook (best for ongoing weekly refresh):**
Configure your data stack to POST to:
```
POST https://[newdomain].com/api/ingest/[tenantId]
Header: x-ingest-key: [ingest-key-from-admin-data]
Body: JSON or CSV (audience_export format)
```
Schedule weekly (Mondays 3am UTC recommended so leads are fresh for Monday morning).

#### 4.2 Verify lead pool
- [ ] `/admin/data` shows expected counts by tier/segment/zip
- [ ] `/leads` (as a test customer) shows filterable lead pool
- [ ] Preview hides PII until purchase (privacy check)

---

### Thursday — SDR Lead (1 hour)

#### 5.1 SDR call script template (substitute `[NICHE]`, `[BUSINESS NAME]`, `[CITY]`)

**Opening (3 seconds — earn the right to keep talking):**
> "Hi, this is [NAME] from r0cketship. We sent 50 free leads to [BUSINESS NAME] this morning — I'm calling to make sure they're the right fit. Got 30 seconds?"

**Qualifying (3 questions):**
1. "What's your typical close rate on cold leads vs. warm referrals?"
2. "If we delivered 100 high-intent [NICHE] prospects per month in your ZIP, what's that worth to you?"
3. "Who closes the deals today — you, a team, or are you looking for help?"

**Pitch (anchor on the booking offer):**
> "Most of our [NICHE] customers start on the $1,500/mo data plan, but the ones who 10x their pipeline upgrade to $4,500 where we book the meetings on their calendar in real time. Which sounds more like where you are?"

**Objection handlers:**

| Objection | Response |
|---|---|
| "Too expensive" | "Versus what? One closed [NICHE] deal pays for 6 months. We give you 50 free to prove it." |
| "I already have leads" | "Great — are they ZIP-exclusive? Ours are. Your competitor across town can't have them." |
| "I need to think about it" | "Totally fair. Lock your ZIP for $1,500 now so it doesn't go to your competitor — refund anytime in 30 days if it doesn't work." |
| "I don't believe the data quality" | "We'll send you a sample of 10 with full contact info before you pay anything. Email or text?" |
| "Send me info" | "Of course — but let me grab your calendar first. 15 mins Tuesday or Wednesday?" |

**Booking ask (the only KPI that matters):**
> "Let's get 15 minutes on your calendar to walk through your ZIP. I have Tuesday at 2pm or Wednesday at 10am — which works?"

#### 5.2 Twilio dialer queue config
In `/admin/integrations` (god):
- [ ] Verify Twilio keys live
- [ ] Set `hot_transfer_number` for this tenant (the closer's direct line)

In `/admin/users` (god/manager):
- [ ] Create or assign agent role to your SDR
- [ ] Verify they can log into `/agent` and see queue

SDR's daily workflow at `/agent`:
1. Click "Next Lead" → platform serves highest-predictive-score unworked lead from the pool
2. Click "Call" → Twilio click-to-call dials lead, connects SDR
3. After call, log disposition: no_answer / left_message / callback / hot_transfer / booked / sold / dead
4. KPI dashboard shows daily calls, connects, bookings, conversion rate

---

### Friday — LAUNCH (Operator + Marketer joint, 30 min)

#### 6.1 Final pre-launch checklist
- [ ] Domain resolves with HTTPS + parent landing
- [ ] Tenant created and renders branded site at the domain
- [ ] `/leads` populated with niche-specific data
- [ ] `/signup` works end-to-end (test signup → $50 credit → /leads → buy test lead)
- [ ] Stripe/PayPal/SMTP/Twilio integrations active (or manual fallback confirmed)
- [ ] SDR briefed and ready to dial

#### 6.2 Go-live
1. **Meta ads** — enable 9 ad variants at $200/day. Audience: niche-specific lookalike or interest-based; geo: US (or service area if hyperlocal). Optimization: lead form fills.
2. **LinkedIn ads** (B2B niches only) — enable 3 ad variants at $100/day. Audience: job titles like "[Niche] Owner", "[Niche] Manager", "President of [Niche company]". Optimization: leads.
3. **Google Search** — enable campaign at $50/day cap. Negative keywords: "free", "torrent", "lyrics", "job".
4. **Email** — send "we're live" announcement to any warm list you have for this niche
5. **Tracking** — verify Meta pixel + Google tag + LinkedIn Insight tag firing on landing + signup + purchase events

#### 6.3 Monitoring (every 4 hours for first 48 hours)
- CPL (cost per lead = ad spend / signups) — target <$100 for B2B niches, <$30 for consumer/SMB
- Signup → first-purchase conversion — target ≥30% inside 7 days (free $50 wallet helps)
- SDR dial volume + connect rate — target 50+ dials/day, 15%+ connect, 10%+ booking from connects
- Wallet top-ups — first paid purchase by Day 3 is the trust signal

---

## 2. Week 2–4: Monitor & Decide

### Kill / scale gate at Day 28

#### KILL if:
- CAC > 1.5x first-month payment (e.g., CAC > $2,250 against $1,500 data tier) AND
- No `booking` upgrades within 60 days
- Action: pause ads, archive landing, redirect domain to /niches hub, document the learning

#### SCALE if:
- CAC < first-month payment AND
- ≥10% of buyers upgrade to `booking` within 60 days
- Action: 5x ad budget ($1,000+/day), hire dedicated niche SDR, add 2 more ad creative variants, double down on the winning channel

#### IF AMBIGUOUS (most launches):
- Run a Week 5–8 retry with 2 new creative variants and 1 new lead-magnet test
- Re-evaluate at Day 56

---

## 3. Worked Examples — First 4 Wave-1 Niches

Each example is ready to paste into `/admin/launch` and ship Monday.

### Example 1 — SolarSignal (solarsignal.com — Solar/HVAC/Roofing)

| Field | Value |
|---|---|
| Domain | solarsignal.com |
| Niche | solar, HVAC, roofing |
| Money word | Solar |
| Site style | bold |
| Primary color | `#FFB400` (sun gold) |
| Accent color | `#0EA5E9` (sky blue) |
| Hero headline | "Homeowners ready to install solar — in your exclusive ZIP, delivered to your CRM" |
| Hero subhead | "DNC-clean, intent-scored, 5-yr retrospective. 50 free to start. No card." |
| Offer 1 data | $1,500/mo — features as standard |
| Offer 2 booking | $4,500/mo — "We book solar consultations on your calendar in real time" |
| Offer 3 epartner | "We close installs as an extension of your team. Base + per-install success fee." |
| SDR niche question | "What's your average installed system price + commission per close?" |
| Lead magnet | "50 free solar-intent homeowners in your ZIP — installer ready, DNC-clean" |
| Ad channel mix | Meta 70% / Google 30% — LinkedIn skip (consumer-targeted niche) |

### Example 2 — CommercialRoofing.Pro (Commercial roofing contractors)

| Field | Value |
|---|---|
| Domain | commercialroofing.pro |
| Niche | commercial roofing |
| Money word | Commercial Roofing |
| Site style | bold |
| Primary color | `#1E40AF` (deep blue) |
| Accent color | `#F97316` (safety orange) |
| Hero headline | "Property managers + commercial owners with imminent roof needs — in your ZIP" |
| Hero subhead | "We surface buildings with roof issues, lease turnover, weather events. Exclusive ZIP. Delivered daily." |
| Offer 1 data | $1,500/mo |
| Offer 2 booking | $4,500/mo — "We book site walks on your calendar" |
| Offer 3 epartner | "We close commercial roofing contracts with your estimator. Base + per-job success fee." |
| SDR niche question | "What's your average commercial roof project size and gross margin?" |
| Lead magnet | "50 free commercial buildings in your ZIP with roof-replacement triggers" |
| Ad channel mix | LinkedIn 50% / Meta 30% / Google 20% (B2B + intent search) |

### Example 3 — MortgageHeat (Mortgage brokers)

| Field | Value |
|---|---|
| Domain | mortgageheat.com |
| Niche | mortgage brokers |
| Money word | Mortgage |
| Site style | trust |
| Primary color | `#065F46` (money green) |
| Accent color | `#FBBF24` (gold) |
| Hero headline | "Homeowners ready to refi or buy — in your exclusive ZIP, with triggers + emails" |
| Hero subhead | "Rate-sensitive triggers, life-event triggers, equity triggers. DNC-clean. 50 free to start." |
| Offer 1 data | $1,500/mo |
| Offer 2 booking | $4,500/mo — "We book pre-approval calls on your calendar" |
| Offer 3 epartner | "We close mortgages with your processor. Base + bps success fee per funded loan." |
| SDR niche question | "What's your average funded loan amount and commission?" |
| Lead magnet | "50 free mortgage-intent homeowners in your ZIP — refi + purchase, scored by likelihood" |
| Ad channel mix | Meta 50% / Google 40% / LinkedIn 10% |

### Example 4 — AgencyVault (Marketing agencies, white-label resellers)

| Field | Value |
|---|---|
| Domain | agencyvault.io |
| Niche | marketing agency, lead-gen agency |
| Money word | Agency |
| Site style | dark |
| Primary color | `#7C3AED` (violet) |
| Accent color | `#06B6D4` (cyan) |
| Hero headline | "White-label predictive leads + booking for your agency's clients — branded as you" |
| Hero subhead | "API + dashboard + CRM sync + DNC-clean. Resell at your markup. 30-day pilot." |
| Offer 1 data | $1,500/mo (single client) — or $4,500/mo unlimited clients |
| Offer 2 booking | $4,500/mo + per-client setup — "We book meetings for your clients under your brand" |
| Offer 3 epartner | "We co-sell with you. Rev share on closed business." |
| SDR niche question | "How many clients, what verticals, what's your blended retainer?" |
| Lead magnet | "Free 30-day pilot: pick one client, we'll deliver leads under your brand, no card" |
| Ad channel mix | LinkedIn 70% / Google 30% — Meta skip (B2B SaaS pattern) |

---

## 4. KPI Dashboard (what to track every week)

Per white-label, per week:

| Metric | Source | Target Week 4 | Target Week 12 |
|---|---|---|---|
| Ad spend | Meta + LinkedIn + Google Ads | $7k | $20k+ if scaling |
| CPL (cost per signup) | Ad platform | <$100 (B2B), <$30 (consumer) | <$60 (B2B), <$20 (consumer) |
| Signups | `/admin` tenant dashboard | 50+ | 200+ |
| Free-to-paid conversion (7-day) | wallet top-up tracking | ≥30% | ≥40% |
| Paid customers (`data`) | `/admin` tenant dashboard | 15+ | 60+ |
| `booking` upgrades | subscription analytics | 2+ | 10+ |
| `epartner` deals in pipeline | manual CRM | 1+ | 3+ |
| SDR dials / day / SDR | Twilio + agent KPIs | 50+ | 80+ |
| SDR booking rate | calls → booked | 8%+ | 15%+ |
| Show rate | booked → attended | 50%+ | 70%+ |
| Show → close rate (`booking` tier) | closer CRM | 25%+ | 40%+ |
| MRR | platform billing | $20k+ | $100k+ |
| Net revenue retention (NRR) | cohort tracking | n/a yet | ≥105% (subscription continuation + upgrades) |

---

## 5. Common Failures & Their Fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| High CPL, low signups | Wrong hook for the niche | Test all 3 hooks (pain / outcome / FOMO) — most niches respond to one strongly |
| Signups but no paid conversions | Free tier too generous OR data quality bad | Pull a paid customer to QA the leads they see — if PII is wrong or stale, fix data source |
| Paid but no `booking` upgrades | Price anchor wrong OR onboarding doesn't sell the upgrade | Add upgrade prompt at Day 7 of customer lifecycle; train SDR to pre-position $4,500 from call 1 |
| `epartner` deals stalling | Contract friction | Standardize the epartner contract; cap exposure with monthly reconciliation + advance |
| Lead pool runs dry | Niche too small OR ingest rate too low | Either expand geographic scope OR refresh ingest cadence to daily |
| SDR burning out | Niche has wrong buyer profile | Move SDR to a different SKU within the portfolio; not all niches have the same persona-fit |

---

## 6. Escalation & Decisions

- **Niche kill decision** — only the founder or designated portfolio manager can kill a SKU before Day 56
- **Ad spend >$1k/day decision** — needs founder approval first time; subsequent niches use whatever budget the playbook scaled to last time
- **Pricing deviation** — never deviate from $1,500 / $4,500 / negotiated. Volume discounts (already coded: 2nd ZIP −10%, 3rd −20%, 4th+ −30%) are the only allowed concession.
- **Custom features per partner** — say no. Direct them to existing offers. The operational moat is uniformity.

---

## 7. Next 8 weeks roadmap (Wave 1)

| Week | Monday launch | Operator hours | Marketer hours | Data hours | SDR hours |
|---|---|---|---|---|---|
| 2 | SolarSignal | 1 | 3 | 1 | 1 |
| 3 | CommercialRoofing.Pro | 1 | 3 | 1 | 1 |
| 4 | MortgageHeat | 1 | 3 | 1 | 1 |
| 5 | AgencyVault | 1 | 3 | 1 | 1 |
| 6 | HVACPipeline | 1 | 3 | 1 | 1 |
| 7 | ContractorLeads.Live | 1 | 3 | 1 | 1 |
| 8 | ElectricalPro.Live | 1 | 3 | 1 | 1 |
| 9 | PlumbingPipeline | 1 | 3 | 1 | 1 |

**By Week 9:** 8 white-labels live, $50–100k ad spend total invested, 200+ signups, 60+ paying customers across the portfolio, first `booking` upgrades closing, first `epartner` deals in pipeline.

**Week 10 review gate:** sort all 8 white-labels by composite metric (paid customers × ACV × NRR), kill bottom 2, double ad budget on top 2, start Wave 2.

---

## Appendix A — Domain Registration Checklist

- [ ] Domain available + costs <$50/yr (avoid premium domain markets unless niche is gold)
- [ ] No trademark conflicts (USPTO TESS search)
- [ ] No `.com` squatters — `.com` preferred, `.live` / `.pro` / `.io` acceptable
- [ ] Whois privacy enabled
- [ ] Domain set to auto-renew

## Appendix B — Compliance Pre-Launch Check

- [ ] Footer disclaimer present (TCPA, GDPR, CCPA, DNC)
- [ ] Terms of Service link in footer + signup flow
- [ ] Privacy policy link in footer + signup flow
- [ ] Cookie banner active (GDPR/CCPA states)
- [ ] DNC scrubbing confirmed on all leads in this niche's pool
- [ ] Healthcare niches: HIPAA-aware language, no PHI in leads
- [ ] Financial niches: GLBA-aware language, no SSN/financial PII in leads
- [ ] Legal niches: bar-rule-compliance language ("legal advertising")

## Appendix C — When to Pause Spend

Pause Meta/LinkedIn/Google ads if:
- CPL > 3x target for >48 hours
- Signups but zero paid conversions for >7 days
- SDR can't keep up with inbound (good problem — pause ads, hire 2nd SDR, resume)
- Platform issue (down/data stale/billing broken) — fix first, resume

Pause does not mean kill. Pause = diagnose + fix + relaunch within 7 days.
