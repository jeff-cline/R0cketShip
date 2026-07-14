import type { Deck } from "@/app/_components/deck/types";

// Puerto Rico — the infrastructure/anchor deck. Rebuilt to answer the investor's
// 10-point agenda plus the full business model, economics, timeline, partner
// expectations, the cruise-crew engine, and scaling comps. Anchored by the
// Cataño Project (/catano?v=corporate). Figures sourced: Discover Puerto Rico,
// FCCA 2024, Milken Institute, company filings (2024-2025).

const deck: Deck = {
  brand: "Puerto Rico",
  cover: {
    tag: "An operating node of R0cketShip Holdings · Anchored by the Cataño Project",
    title: "Wired, Owned,",
    titleSub: "Monetized.",
    sub: "A multi-pronged engine that tags and monetizes ~1.4M cruise passengers, 6M+ air arrivals, the cruise crews, and the local island — anchored by the Cataño Project.",
    footer: "PROJECT PR PUERTO RICO · R0CKETSHIP HOLDINGS · 2025-2026",
  },
  slides: [
    {
      n: 1,
      kicker: "The Opportunity",
      title: "A $7.6B visitor economy on a disconnected island.",
      vision: "Millions arrive every year — by air and by sea — yet Puerto Rico runs without a single connected platform tying merchants, attractions, and visitors together. That gap is the opportunity.",
      chart: [
        { label: "Total visitors / yr", value: 7.5, display: "7.5M" },
        { label: "Air arrivals / yr", value: 6.1, display: "6.1M+" },
        { label: "Cruise passengers / yr", value: 1.4, display: "~1.4M" },
      ],
      chartNote: "$7.6B non-resident visitor spending in 2024; ~$18B total economic impact. Sources: Discover Puerto Rico; FCCA 2024.",
      points: [
        { q: "A disconnected, disjointed island", a: "Merchants, ferries, tours, and attractions operate in silos. Nothing routes visitors — or their dollars — across the island." },
        { q: "~$145M in-port cruise wallet", a: "~1.4M cruise passengers spend roughly $104 each ashore — a recurring, capturable wallet, before air visitors and crew." },
        { q: "Multi-pronged by design", a: "Tag and track cruise passengers, air arrivals, crew, and locals — four funnels into one monetization engine." },
        { q: "Anchored in Cataño", a: "Casa Bacardí (250K+ visitors/yr) and the $0.50 Pier 2 ferry give us a high-volume pedestrian funnel straight into our anchor market." },
      ],
    },
    {
      n: 2,
      kicker: "Project Structure & Relationship",
      title: "An operating division of R0cketShip Holdings — a true joint venture.",
      vision: "We are not a vendor. R0cketShip brings the tech stack, capital, and demand engine; the local anchor partner brings relationships, government, and hard assets. We do the boots-on-the-ground build.",
      points: [
        { q: "The relationship", a: "Structured as an operating division under R0cketShip Holdings, run locally as Puerto Rico Masterminds — a joint venture with the anchor partner under an LOI and licensing agreement." },
        { q: "Who does what", a: "R0cketShip: technology, platform, data, paid media, and on-the-ground sales and operations. Partner: relationships, local government, business acumen, and the hard assets we monetize." },
        { q: "Engagement & term", a: "The Cataño build runs at $32,500/month on a 12-month contract. On funding, we begin deploying assets immediately." },
        { q: "LOI first, then activate", a: "A one-page LOI and the first payment unlock the build; we schedule the founder's on-the-ground trip and start immersing in week one." },
      ],
    },
    {
      n: 3,
      kicker: "Platform Strategy",
      title: "One stack tags four funnels — then monetizes them one engine at a time.",
      vision: "The technology is already built. It tags people off the cruise boats, off the airlines, and from the local area — then we light up monetization engines one at a time, funded by paid ads first and a sales team as revenue scales.",
      points: [
        { q: "Tag & track everyone", a: "Cruise passengers, airline arrivals, crew, and locals — captured at the point of intent using unique data, predictive data, machine learning, and our proprietary stack." },
        { q: "Phone-first web + app", a: "A live map, merchant directory, ticketed experiences, the Cataño Passport, and an offers wallet — no app download required to start." },
        { q: "Monetize one engine at a time", a: "Start with paid ads driving traffic; add a sales staff as revenue scales. Build deliberately — fund each engine from the last." },
        { q: "Market them on the water", a: "Begin marketing while passengers are still on the boat to Puerto Rico, and again within 10-15 minutes of docking." },
      ],
    },
    {
      n: 4,
      kicker: "Revenue Streams & Pricing",
      title: "Three revenue engines on one set of data.",
      vision: "Affiliate, SaaS, and advertiser revenue all run on the same proprietary traffic — plus JV revenue from monetizing the partner's physical assets. Every dollar of data we collect compounds across all of them.",
      points: [
        { q: "1) SaaS memberships", a: "A monthly advertiser membership — niche- and product-dependent — at a reduced rate off our normal ~$3,000/month range to fit local SMBs." },
        { q: "2) Affiliate revenue", a: "Traffic from our proprietary stack converts on the back end — affiliate revenue on every funnel we drive." },
        { q: "3) Advertiser & sponsor revenue", a: "Featured listings, sponsored promotions, and sponsor placements across the network." },
        { q: "+ JV & asset monetization", a: "We monetize the partner's venues and events with the same data and tech — and earn on that monetization like any client would pay us. Success-fee ticketing is a Phase 2 build, funded post-revenue." },
        { q: "A full control panel", a: "We manage and change merchant memberships, featured listings, advertisers, sponsors, promotions, ticket sales, and commissions from one back office." },
      ],
    },
    {
      n: 5,
      kicker: "Merchant Recruitment Program",
      title: "A managed recruiting engine — not ad-hoc sales.",
      vision: "We bring local businesses onto the platform with a repeatable engine — canvassing, business-to-business referrals, and chamber-of-commerce initiatives — racing to the Artisanal kickoff.",
      points: [
        { q: "Target categories", a: "Food & beverage, rum / coffee / artisan retail, tours and water excursions, attractions and museums, transport, and lodging — starting at the Casa Bacardí and ferry core." },
        { q: "Onboarding", a: "Claim, configure, and go live the same day — with a branding kit included so each merchant looks the part from day one." },
        { q: "Boots on the ground", a: "One or two part-time canvassers plus founders, current team, and the partner's team going door-to-door to speed up the build." },
        { q: "Businesses know businesses", a: "A BD / affiliate-tracking system so merchants help us scale together, plus niche chamber-of-commerce initiatives and direct liaison with local government." },
      ],
    },
    {
      n: 6,
      kicker: "Merchant Marketing Services",
      title: "We make every merchant look like a business worth visiting.",
      vision: "A full marketing stack delivered as a service — featured advertising, video and branding kits, social and influencer reach, and a loyalty engine — much of it productized so a local team can run it.",
      points: [
        { q: "Featured advertising & thumbnails", a: "Premium placement and clickable thumbnails into each business — with a pay-per-click engine planned for v2 / v3." },
        { q: "Video & branding kits", a: "Recordings, promos, and prompts produced by a local hire — a pass-through or small setup fee gives each merchant a complete branding package." },
        { q: "Social, influencer & events", a: "Our existing social / influencer / event-promotion teams, plus activating and growing local ambassadors to do the same." },
        { q: "Loyalty & rewards", a: "A gamified share-and-earn loyalty engine (Phase 3), with early BD / affiliate tracking so businesses scale alongside us." },
      ],
    },
    {
      n: 7,
      kicker: "Tourism Experience Development",
      title: "The Cataño Passport turns a docking into a day in Cataño.",
      vision: "From the moment they leave the boat, visitors flow into one system — a Cataño Passport, a visitor roadmap, bookings, and connections — all in a single user experience.",
      points: [
        { q: "Cataño Passport (v2) & roadmap", a: "The thank-you / landing experience as visitors transfer from the boat to Cataño — members listed, with an app for info, direct connection, and bookings." },
        { q: "Capture intent early", a: "Market to passengers on the boat to Puerto Rico and within 10-15 minutes of docking — before they default to Old San Juan." },
        { q: "Walking tours & influencers", a: "Self-guided, offer-linked routes (rum, food, waterfront, art) and a launch series with Ivan and local creators." },
        { q: "Cruise excursions", a: "Pre-bookable excursions via the Pier 2 ferry → Casa Bacardí → lunch with offers → back to the ship, sized to the cruise window." },
      ],
    },
    {
      n: 8,
      kicker: "The Crew Engine · Employee Experience",
      title: "Thousands of crew per ship — a second, overlooked wallet.",
      vision: "Every cruise ship carries 1,000-2,350 crew. In Puerto Rico they already spend ~$79 per visit — above the regional average. They need their own experiences, discounts, and a place to go. We build it.",
      chart: [
        { label: "PR crew spend / visit", value: 79, display: "$79.14" },
        { label: "Regional avg / visit", value: 59, display: "$58.78" },
      ],
      chartNote: "~196,300 crew shore visits in PR -> ~$15.5M crew spend (FCCA 2024). ~1.3M people employed in the cruise industry (Milken Institute).",
      points: [
        { q: "Cruise Team Member Portal", a: "A crew login for special discounts, experiences, and perks — a dual engine running alongside the consumer Passport." },
        { q: "Designed for fast visits", a: "72% of crew are ashore under 3 hours and spend on food, calls home, and shopping — we design for high-value, time-boxed visits." },
        { q: "One-for-many", a: "Build it once, reuse it for every cruise port — an upsell product for destinations and their crews." },
        { q: "Rinse-and-repeat for Roatan", a: "We are already tagging and tracking in Roatan, Honduras — the same engine ports straight across at the Holdings level." },
      ],
    },
    {
      n: 9,
      kicker: "Strategic Partnerships",
      title: "Anchor on the names that already pull the crowds.",
      vision: "Bacardí, the cruise lines, and the local attractions already generate the traffic. We capture and extend it — and we help existing operators scale, charging a premium to plug into our stack.",
      points: [
        { q: "Bacardí", a: "Casa Bacardí (250K+ visitors) and the ferry funnel — co-promote every tour into the Cataño Passport and the rest of the day." },
        { q: "Cruise lines & shore-ex", a: "Get our excursions onto shore-excursion manifests; partner on the ferry and transport legs." },
        { q: "Attractions, museums, culture", a: "Onboard local attractions and cultural orgs as ticketed inventory they don't have a system for today." },
        { q: "Help operators scale (a revenue line)", a: "Leverage our holding-company tech to help existing tour operators and venues raise money and scale — at a premium to be part of the process, with first right of refusal." },
      ],
    },
    {
      n: 10,
      kicker: "Government & Economic Incentives",
      title: "Built inside Puerto Rico's incentives — with a partner who knows the room.",
      vision: "Act 60 export-services treatment and Opportunity-Zone qualification are designed in from day one. Our anchor partner brings the government relationships, the incentives knowledge, and the teams to rally around it.",
      points: [
        { q: "Act 60 export services", a: "Off-island services (advertising, SaaS) qualify for the reduced rate; Opportunity-Zone qualification preferred." },
        { q: "Municipal support", a: "Positioned as economic development — foot traffic, merchant revenue, jobs — in exchange for co-marketing, signage rights, and event support." },
        { q: "July meeting in Cataño", a: "Present the deck, a live demo, and a signed first cohort to the City Planner and municipal leadership." },
        { q: "Partner brings the room", a: "Government relationships, plus Act 60 / tax / real-estate expertise the partner already has on the ground." },
      ],
    },
    {
      n: 11,
      kicker: "Expectations from the Local Partner",
      title: "What the anchor partner brings — a clear win-win.",
      vision: "The partner is already there, already invested, and motivated to make every piece come together. Here is exactly what we expect them to bring to the table.",
      points: [
        { q: "✓ Relationships & local knowledge", a: "Government, the business community, and the soft skills only years on the ground provide." },
        { q: "✓ Access to hard assets", a: "Event venues, attractions, and real estate we monetize with our tech — earning on that monetization like any client would pay us." },
        { q: "✓ Government & incentives", a: "Local government support, municipal scale, and Act 60 / tax / real-estate expertise." },
        { q: "✓ Introductions (we take it forward)", a: "Warm intros to merchants and officials; our on-the-ground team builds the relationships forward after the first few." },
        { q: "✓ A waterfront retreat carve-out", a: "A carve-out so we can scale our retreat business — an off-the-side, wholly-operator-owned deal the partner can opt into." },
        { q: "✓ Aligned motivation", a: "They want their own experiences, excursions, and assets monetized — our success is their success." },
      ],
    },
    {
      n: 12,
      kicker: "Destination Development & Real Estate",
      title: "New revenue streams that don't exist yet — including the dirt.",
      vision: "We program Cataño as a managed destination — culture, events, and reasons to stay — and we develop real estate together: found, invested, and owned jointly, with a wholly-operator-owned retreat as the off-the-side prize.",
      points: [
        { q: "Culture, events & sport", a: "A recurring calendar of live music, food nights, and cultural showcases — with boxing nights as a marquee, ticketed draw." },
        { q: "Differentiated ticketing", a: "Ticketing and experiences for museums, attractions, tours, and events — at both the local and the partner level." },
        { q: "Reasons to stay & spend", a: "Convert Bacardí day-trips into Cataño days — dwell time and local spend are the core KPIs." },
        { q: "Jointly-developed real estate", a: "Find, invest, and raise together — plus the waterfront retreat carve-out, wholly owned by the operator, with the partner's first right to participate." },
      ],
    },
    {
      n: 13,
      kicker: "Project Timeline",
      title: "Funded to kickoff in under 60 days.",
      vision: "On funding, we launch the technology and the business process inside 30 days while simultaneously recruiting local merchants — building to a celebration kickoff at Artisanal Pizza.",
      points: [
        { q: "Day 0-30: launch", a: "Deploy the tech stack and start the business process within 30 days of initial funding; begin paid-ads traffic." },
        { q: "In parallel: recruit", a: "Start merchant outreach and pre-meetings immediately, inviting local businesses to the Artisanal kickoff." },
        { q: "July 8: Artisanal kickoff", a: "A big celebration introduction at the Artisanal pizza venue (target July 8), with pre-meetings with local businesses in the weeks ahead." },
        { q: "Phased build", a: "Phase 1: SaaS + ads. Phase 2 (post-revenue): ticketing & back-office success-fee tracking. Phase 3: loyalty & rewards." },
      ],
    },
    {
      n: 14,
      kicker: "The Deal · Economics",
      title: "$32,500/month to run it — and a friends-and-family equity sweetener.",
      vision: "Clean economics with a true win-win-win: a monthly operating engagement, a 50/50 profit split on Cataño, and an optional top-level equity position with first right of refusal across the entire R0cketShip stack.",
      points: [
        { q: "Cataño engagement", a: "$32,500/month on a 12-month contract covers expenses, marketing, advertising, and the build. Profit splits 50/50 between the investing partner and Jeff Cline / R0cketShip." },
        { q: "Founder draw", a: "$7,500/month for the founder, drawn from the $32,500 or from the investment fund once papered — repayable quickly or forgivable as an option." },
        { q: "Friends & family equity", a: "~$400,000 for 10% equity in the top structure. Once $800,000 is returned (2x the money), the stake steps down to 5% — double back, plus 5% in perpetuity." },
        { q: "First right of refusal", a: "First right to invest in every other venture in the stack. At the top level: 95% Jeff Cline / R0cketShip, 5% to the investor on Holdings' share." },
      ],
    },
    {
      n: 15,
      kicker: "Why This Scales",
      title: "Destination & merchant platforms scale to billions.",
      vision: "This isn't theoretical. The same playbook — merchant SaaS, experiences, and digital passes — has produced outcomes from tens of millions to billions. We run it on a captive, recurring, in-port audience.",
      chart: [
        { label: "Toast (restaurant SaaS)", value: 4960, display: "$4.96B rev" },
        { label: "TripAdvisor / Viator", value: 1830, display: "$1.83B rev" },
        { label: "GetYourGuide", value: 2000, display: "~$2B val" },
        { label: "Groupon (local)", value: 493, display: "$493M rev" },
        { label: "GoHighLevel (SaaS)", value: 83, display: "$83M ARR" },
      ],
      chartNote: "Public figures, 2024-2025. Digital-pass proof: Bandwango campaigns drove 23,000+ merchant redemptions (Woodinville) and 352 attributable hotel stays (Traverse City).",
      points: [
        { q: "Proven playbook, captive audience", a: "We point a proven model at ~1.4M cruise passengers, 6M+ air arrivals, and the crews — a recurring, in-port wallet." },
        { q: "Data is the moat", a: "Every funnel we run sharpens what to launch next in Cataño — the data compounds across every revenue engine." },
      ],
    },
    {
      n: 16,
      kicker: "Deal Terms · For Clarity",
      title: "A service agreement, a separate equity option, and a fund — kept clean.",
      vision: "Three distinct things, deliberately separated: the monthly service engagement that builds and runs Cataño, a separate seed-equity option, and a forthcoming acquisitions fund. No IP transfers — this is a service agreement unless otherwise noted.",
      points: [
        { q: "The engagement (service agreement)", a: "Cataño is a client / JV that pays R0cketShip $32,500/month to build, deploy, and manage the project. The majority funds activating, advertising, and driving businesses and consumers into Cataño — leveraging R0cketShip's proprietary stack, including PuertoRicoMasterMinds.com." },
        { q: "Exclusive license · no IP transfer", a: "The technology license for Cataño is exclusive as long as payments are made and in good standing. No intellectual-property rights are transferred — this is a service agreement unless otherwise noted." },
        { q: "How month one ramps", a: "The first month carries more operational expense and less direct consumer impact while merchants are onboarded; as they stabilize, more of the spend shifts to turning up consumers into the flow." },
        { q: "Seed equity — a separate $1.5M raise", a: "The seed investor may seed the first $400,000 for 10% equity until $800,000 is returned, then it steps to 5% — or they may forego the payback and take the full 10% at post-money once set." },
        { q: "Top-up rights & win-win", a: "Once post-money and flowing, we raise up to $1.5M; the same seed investor may join any additional raise, at any level, at a 25% discount — plus a bilateral, first-right-of-refusal relationship where both parties bring each other deals." },
        { q: "Aligned, protected", a: "The seed investor carries the same protections as the founder at the 5% level. Larger acquisitions may require dilution, but the first 5% for both parties is never diluted." },
      ],
    },
    {
      n: 17,
      kicker: "R0cket Fuel · Acquisitions Fund",
      title: "The Acquisitions Fund: opportunities we've already identified, activated.",
      vision: "Starting July, we raise a fund to hold cash for strategic acquisitions — businesses with EBITDA, activatable data, or unique data accretive to the platform. With cash on hand we activate opportunities we have already identified, adding R0cket Fuel across the network.",
      chart: [
        { label: "$100M insurance target", value: 100, display: "$100M" },
        { label: "Mid opportunity", value: 50, display: "$50M" },
        { label: "Entry opportunity", value: 25, display: "$25M" },
      ],
      chartNote: "Anchor target: $12.5M EBITDA and $50M+ in cash reserves. Activations are sized to fund availability.",
      points: [
        { q: "Anchor target — a $100M insurance business", a: "It generates $12.5M EBITDA and holds $50M+ in cash reserves — capital we can strategically activate the moment the fund can move." },
        { q: "Accretive data → three new revenue streams", a: "Its data is accretive to another core business we intend to acquire and fold into the portfolio — jointly creating three new revenue streams." },
        { q: "A third JV on top", a: "A joint venture that increases the partner's unique, high-value client flow — activating $6,000-$10,000 per engaged group." },
        { q: "2-and-20, and Fund-as-a-Service", a: "The fund manager earns a percentage of funds raised plus the customary 2-and-20 to create, manage, and run it. The engine is already built, with a JV to rinse-and-repeat it for others as FaaS — a revenue line of its own." },
      ],
    },
  ],
  closing: {
    kicker: "Win-win-win",
    title: "Let's paper the LOI",
    titleSub: "and activate Cataño.",
    steps: [
      { k: "01", t: "Sign the LOI", d: "Scope, JV split, and territory exclusivity — one page, this month." },
      { k: "02", t: "First $32,500", d: "Activate the build and schedule the founder's on-the-ground trip to immerse." },
      { k: "03", t: "Launch in 30 days", d: "Stand up the tech and start merchant outreach in parallel." },
      { k: "04", t: "July 8 kickoff", d: "Celebrate at Artisanal Pizza — live for cruise season." },
    ],
  },
};

export default deck;
