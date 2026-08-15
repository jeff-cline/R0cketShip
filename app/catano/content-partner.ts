// ──────────────────────────────────────────────────────────────────────────
// Cataño deck — OPERATOR-PARTNER variant. Served at r0cketship.com/catano.
// Voice: Jeff Cline, founder. "I bring the engine, you bring Cataño."
// This is the second deck we'll dial in; corporate (Puerto Rico Masterminds)
// is the primary. Mirrored in the one-page doc.
// ──────────────────────────────────────────────────────────────────────────

import type { Deck } from "./deck-content";

export const PARTNER: Deck = {
  brand: "Cataño",
  cover: {
    tag: "A destination operating system",
    title: "Cataño,",
    titleSub: "reinvented.",
    sub: "A platform that turns every cruise visitor into foot traffic, every merchant into a storefront, and a 90-minute Bacardí stop into a half-day in Cataño.",
    footer: "JEFF CLINE · OPERATOR-PARTNER PROPOSAL",
  },
  closing: {
    kicker: "Let's go",
    title: "I bring the engine.",
    titleSub: "You bring Cataño.",
    steps: [
      { k: "01", t: "Sign the LOI", d: "One page — scope, split, Cataño exclusivity. This month." },
      { k: "02", t: "Stand up the platform", d: "Theme it, onboard the first 20 merchants within walking distance of Bacardí." },
      { k: "03", t: "Win the room in July", d: "Walk into the municipal meeting with a live demo and a signed cohort." },
      { k: "04", t: "Kickoff at Artisanal Pizza", d: "Launch loud, launch local — live for cruise season." },
    ],
  },
  slides: [
    {
      n: 1,
      kicker: "Project Structure & Relationship",
      title: "We build one thing: the operating system for a destination.",
      vision:
        "I bring the platform and the playbook. You bring Cataño — the relationships, the merchants, the municipal trust. We move now and paper it as we go.",
      points: [
        { q: "Proposed business relationship", a: "Operator-partner. I own and run the platform — the build, the technology, the ad-exchange, the billing. You own the ground game — merchant relationships, government, Bacardí, local credibility. One venture, shared upside." },
        { q: "Roles, responsibilities & ownership", a: "Me: product, engineering, payments, data, and national ad demand. You: merchant recruitment, the municipal liaison, on-island operations, and events. The split and ownership get defined in the LOI before anyone spends real money." },
        { q: "Timeline & target launch date", a: "Sign the LOI in June → stand up the Cataño platform and onboard the first 20 merchants by the July municipal meeting → public kickoff at Artisanal Pizza in late summer, timed to cruise season." },
        { q: "Letter of Intent & formal contract", a: "Start with a one-page LOI this month — scope, split, and Cataño exclusivity. The full operating agreement follows once the first cohort proves the model. We don't let paperwork outrun momentum." },
      ],
    },
    {
      n: 2,
      kicker: "Platform Strategy",
      title: "Every visitor gets a phone-first concierge. Every merchant gets a storefront, an audience, and a checkout.",
      vision:
        "I've already built the engine that runs my white-label networks. Cataño is the destination we point it at — themed, local, and live on day one.",
      points: [
        { q: "Website & mobile app functionality", a: "A no-app-needed web platform: live map, merchant directory, ticketed experiences, the Cataño Passport, and an offers wallet — all on the phone they're already holding." },
        { q: "Tourist acquisition & engagement", a: "Capture them at the moment of intent. A QR at the ferry, at Casa Bacardí, at the cruise pier becomes an instant itinerary — then SMS and push keep working them with offers while they're still on the island." },
        { q: "Revenue model & monetization", a: "Three stacked meters: recurring merchant memberships, per-transaction ticket commissions, and sponsored placement fed by national ad demand from my exchange — the stream nobody else can bring." },
        { q: "Integrating promotions, events & attractions", a: "One feed. A merchant's freebie, a museum's timed ticket, a boxing match, a Bacardí tour — all discoverable and bookable in the same wallet." },
      ],
    },
    {
      n: 3,
      kicker: "Merchant Recruitment Program",
      title: "We don't sell software to merchants. We bring them tourists with money already in motion.",
      vision:
        "The pitch to a local business is simple: you only show up to people who are already here and already spending. Pay to be the one they see first.",
      points: [
        { q: "Target categories of businesses", a: "Restaurants and bars, rum / coffee / artisan retail, tours and water excursions, attractions and museums, transport, and lodging — starting with the cluster within walking distance of the ferry and Casa Bacardí." },
        { q: "Merchant onboarding process", a: "A 10-minute signup: claim your listing, add photos, a menu, and an offer, and go live the same day. White-glove onboarding for the first cohort, then self-serve as it scales." },
        { q: "Membership pricing & participation levels", a: "Tiered like my existing ZIP model — Free → Featured → Sponsored — so every merchant can start for nothing and upgrade the moment they see foot traffic." },
        { q: "Value proposition for local businesses", a: "“Be the freebie they redeem, the table they book, the tour they take.” We convert passing cruise traffic into paying customers they'd never have reached." },
      ],
    },
    {
      n: 4,
      kicker: "Revenue Streams & Pricing",
      title: "Two engines: experiences and exposure. One scales with visitors, the other scales with merchants. We own both meters.",
      vision:
        "Keep tickets and advertising cleanly separated so the model is legible to every partner — and so we can tune each lever independently.",
      points: [
        { q: "Ticketed experiences vs. merchant advertising", a: "Ticketed = museum admissions, attractions, tours, and events; we take a commission per transaction. Advertising = memberships, featured listings, and sponsored promos; merchants pay for visibility whether or not a single ticket sells." },
        { q: "Merchant memberships", a: "Tiered monthly, mirroring my proven subscription ladder and scaled to a local SMB: a free tier, a Featured tier, and a Sponsored tier. (Exact price points tuned with you before launch.)" },
        { q: "Featured listings", a: "A flat monthly add-on for top-of-category placement and map-pin priority — the difference between being found and being first." },
        { q: "Sponsored promotions", a: "Pay-to-boost a specific offer or event, sold by campaign or by impressions through the exchange — including outside ad dollars routed onto local inventory." },
        { q: "Ticket sales & commissions", a: "Roughly 10–20% per ticket. We handle checkout, QR redemption, and payout — attractions get a dashboard instead of a spreadsheet." },
      ],
    },
    {
      n: 5,
      kicker: "Merchant Marketing Services",
      title: "Turn every merchant into a media company they don't have to staff.",
      vision:
        "I already run the ad-exchange and content pipeline; merchants just plug in. The menu:",
      points: [
        { q: "Featured thumbnails & listings", a: "Premium imagery, top placement, category dominance." },
        { q: "Promotional offers & freebies", a: "“Free shot of rum, free coffee, 2-for-1” redeemable in the Passport wallet — the hook that pulls cruise traffic off the pier." },
        { q: "Video tours", a: "Short vertical walkthroughs we produce and distribute across the network and social." },
        { q: "Social media promotion", a: "Cross-posted to the destination's channels with merchant tagging." },
        { q: "Influencer marketing", a: "Activations with Ivan and a local creator roster, driving audiences into the Passport." },
        { q: "Event promotion", a: "Push a merchant's event into the live feed and out as a notification to everyone on-island." },
        { q: "Loyalty & rewards programs", a: "The Passport doubles as a loyalty wallet — stamps, repeat-visit rewards, win-back." },
      ],
    },
    {
      n: 6,
      kicker: "Tourism Experience Development",
      title: "The Cataño Passport turns a 90-minute Bacardí stop into a half-day in Cataño.",
      vision:
        "Collect stamps, unlock rewards, spend more, stay longer. It's the spine tying merchants, attractions, and tickets together.",
      points: [
        { q: "“Cataño Passport” & visitor roadmap", a: "A digital passport: check in at stops, redeem offers, earn rewards. The product that gives a visitor a reason to keep moving through town." },
        { q: "Walking tours & self-guided experiences", a: "Mapped routes (rum, food, waterfront, art) with turn-by-turn directions and offers along the way. Zero staff to run." },
        { q: "Influencer partnerships, including Ivan", a: "Ivan as the face of the launch — a content series, “Ivan's Cataño,” driving his audience into the Passport on day one." },
        { q: "Cruise-passenger experiences & excursions", a: "Pre-bookable mini-excursions sized to a cruise window (3–4 hrs): ferry over, Casa Bacardí, lunch with offers, back to the ship with money spent in Cataño." },
      ],
    },
    {
      n: 7,
      kicker: "Strategic Partnerships",
      title: "Anchor on the names that already pull people to Cataño — then be the layer that monetizes the foot traffic they create.",
      vision:
        "We capture and extend demand; we don't manufacture it.",
      points: [
        { q: "Bacardí partnership opportunities", a: "Casa Bacardí is the magnet. Every tour ticket hands off to a Passport loaded with offers for the rest of the day — we extend the visit beyond the distillery and make Bacardí the front door to the town." },
        { q: "Cruise lines & shore-excursion operators", a: "Get our half-day excursions onto shore-ex manifests; partner on the ferry and transport legs so the trip is seamless gangway to gangway." },
        { q: "Local attractions, museums & cultural organizations", a: "Onboard as ticketed inventory. They get a real booking and redemption system they don't have today." },
      ],
    },
    {
      n: 8,
      kicker: "Government & Economic Incentives",
      title: "Build this inside Puerto Rico's incentive structure from day one.",
      vision:
        "The tax code and the municipality should be co-investors, not bystanders.",
      points: [
        { q: "Export Services tax incentives & credits", a: "Structure the platform entity under Act 60. Services sold off-island — national ad demand and SaaS — qualify for the reduced rate. Locked in at formation." },
        { q: "Municipal support opportunities", a: "Position the platform as economic development for Cataño: more foot traffic, merchant revenue, jobs. The ask in return — co-marketing, pier and ferry signage rights, event support." },
        { q: "July meeting with the City Planner & leadership", a: "Walk in with this deck, a live demo on a phone, and the first merchant cohort already signed. Goal: a memo of support plus signage and permitting cooperation." },
      ],
    },
    {
      n: 9,
      kicker: "Destination Development",
      title: "Give cruise passengers a reason to choose Cataño over staying in Old San Juan.",
      vision:
        "Culture, a fight night, a festival, a reason to come back — the more reasons we manufacture, the longer they stay and the more they spend.",
      points: [
        { q: "Local culture, entertainment & sporting events", a: "Curate a recurring calendar — live music, food nights, cultural showcases — all bookable in-app." },
        { q: "Boxing events & spectator attractions", a: "Puerto Rico is a boxing nation. Recurring fight nights become a marquee draw — ticketed, sponsored, promoted across the network." },
        { q: "Evaluating additional experiences & attractions", a: "Waterfront, art, rum and coffee trails — scored on draw versus cost; build the winners." },
        { q: "Reasons for cruise passengers to visit & spend", a: "The whole game: convert a Bacardí day-trip into a Cataño day. Passport + offers + excursions = longer dwell, more dollars left on the island." },
      ],
    },
    {
      n: 10,
      kicker: "Launch Planning",
      title: "Launch loud, launch local. One night, the whole community in the room, the platform live on every phone.",
      vision:
        "The launch is the proof.",
      points: [
        { q: "Kickoff event at Artisanal Pizza", a: "Host it there — merchants, municipal leaders, Ivan, press. Live demo, sign up the first cohort on the spot." },
        { q: "Presentation materials & merchant invitations", a: "This deck (you're in it), a one-page merchant flyer with a QR-to-claim, a personal-invite list built from your relationships." },
        { q: "Media, influencer & community outreach", a: "Ivan and local creators seed it, local press covers the “Cataño goes digital” story, municipal channels amplify." },
        { q: "Next steps & action items", a: "1) Sign the LOI (June). 2) Theme and stand up the platform; onboard the first 20 merchants. 3) Walk into the July municipal meeting with proof. 4) Kickoff at Artisanal Pizza for cruise season." },
      ],
    },
  ],
};
