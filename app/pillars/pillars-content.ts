// ──────────────────────────────────────────────────────────────────────────
// The R0cketShip pillars.
//
// The corporate-structure page answers "what do we own." This one answers
// "why does owning all of it together beat owning any of it alone."
//
// The pillars are capabilities, not industries — the things R0cketShip leads
// with. Divisions sit inside them, and deliberately appear in more than one,
// because a division that only draws on a single pillar is not yet part of the
// ecosystem. The overlap is the thesis.
// ──────────────────────────────────────────────────────────────────────────

export const RISING_TIDE = {
  line: "A rising tide lifts all boats.",
  sub:
    "Every business that joins the ecosystem makes the next one cheaper to acquire, cheaper to run, and easier to predict. Every user who engages deepens the data underneath all of it. The ecosystem is not a portfolio of companies that happen to share an owner — it is one machine with forty-six front doors.",
};

/** The four outcomes every pillar is built to produce. */
export const THESIS = [
  { k: "CAC", title: "Decreased cost per acquisition",
    body: "One demand engine serving forty-six divisions means the cost of finding a customer is shared, and the intent data that finds them keeps getting better. A lead that is wrong for one division is right for another — so almost nothing is wasted." },
  { k: "STRAIN", title: "Decreased operational strain",
    body: "Agents run the repeatable work: intake, quoting, routing, follow-up, reconciliation, reporting. Headcount stops being the thing that scales with volume, which is what lets a division grow without a proportional back office." },
  { k: "WASTE", title: "Decreased expense that is not driving sales",
    body: "One tech stack, one identity layer, one payment rail, one ad network, one data warehouse. Every division that joins stops paying for its own copy of all of it." },
  { k: "SIGNAL", title: "Predictive data",
    body: "Forty-six verticals producing first-party behaviour into one graph. The system stops reporting what happened and starts telling you what is about to — which customer, which market, which product, which week." },
];

export type Pillar = {
  id: string;
  n: string;
  name: string;
  icon: string;
  color: string;
  claim: string;           // what R0cketShip is at the top of
  what: string;            // the capability in one paragraph
  drives: string[];        // which of the four outcomes
  services: string[];      // which shared-services companies power it
  products: { name: string; href?: string; note: string }[];
  divisions: string[];     // slugs from corporate-structure
  proof?: string;
};

export const PILLARS: Pillar[] = [
  {
    id: "demand",
    n: "01",
    name: "Demand",
    icon: "🎯",
    color: "#ff5b2e",
    claim: "We are at the top of the demand chain, not buying from it.",
    what:
      "Most companies rent their customers from an auction they do not control. R0cketShip owns the properties that create the intent in the first place — hundreds of category-specific sites, a national inbound call network, keyword-level bidding and a television layer feeding all of it. When you own the top of the funnel, acquisition cost stops being a market price and becomes an internal one.",
    drives: ["CAC", "WASTE"],
    services: ["PR.SALES", "PR.NET", "PR.TECH"],
    products: [
      { name: "KeywordCalls", href: "https://keywordcalls.com", note: "Pick a keyword, set a bid, take high-intent calls live on your line." },
      { name: "R0cketShip Sales Team", note: "The shared demand-generation engine — one CAC curve across every division." },
      { name: "Money-word call tracking", note: "Inbound calls attributed to the phrase that produced them, before the agent speaks." },
      { name: "Integrated ad network", note: "Inventory across every property in the ecosystem, sold on first-party data." },
    ],
    divisions: ["insurance", "home-services", "healthcare", "senior", "legal", "real-estate", "automotive", "franchise", "education", "travel", "hospitality", "eyecare"],
    proof: "1-800-MEDIGAP, 1-800-HAVEVAN and the national call network run on this today.",
  },
  {
    id: "data",
    n: "02",
    name: "Predictive Data",
    icon: "📊",
    color: "#f5a623",
    claim: "Forty-six verticals feeding one graph. Nobody else can assemble that.",
    what:
      "A single-vertical company sees a single vertical. The person shopping for Medicare is also a homeowner, a traveller, a retiree with a portfolio and a family with an insurance renewal coming. When those signals land in one graph, prediction stops being a statistical exercise and becomes an observation. This is the pillar that makes every other one sharper as the ecosystem grows.",
    drives: ["SIGNAL", "CAC"],
    services: ["PR.TECH", "PR.LAND", "PR.NET"],
    products: [
      { name: "PredictiveData", href: "https://predictivedata.org", note: "The demand engine — audiences scored on intent before a form is filled." },
      { name: "Audience graph", note: "First-party behaviour across every division, resolved to a person rather than a cookie." },
      { name: "Attribution layer", note: "TV, call, click and conversion tied together — see medigap.plus/888." },
      { name: "Predictive scoring", note: "Which customer, which market, which product, which week." },
    ],
    divisions: ["big-data", "ai", "finance", "wealth", "medtech", "media"],
    proof: "Live at predictivedata.org and instrumented across the network.",
  },
  {
    id: "autonomy",
    n: "03",
    name: "Autonomy",
    icon: "🤖",
    color: "#39c07c",
    claim: "Agentic operations in production, at scale, today.",
    what:
      "The repeatable work inside any business — intake, qualification, quoting, routing, follow-up, reconciliation, reporting — is now software. Not a chatbot bolted onto a website, but agents that answer the phone, ask the right questions, price from a real rate sheet, take the enrolment and post the result. This is the pillar that breaks the link between growth and headcount.",
    drives: ["STRAIN", "WASTE"],
    services: ["PR.TECH", "PR.BIZ"],
    products: [
      { name: "AEOS", href: "/corporate-structure/AEOS", note: "Autonomous Entertainment Operating System — the flagship agentic build." },
      { name: "Autonomous agency stack", href: "https://policystore.com", note: "A fully autonomous insurance agency: quote, enrol, pay, issue." },
      { name: "Voice answer engine", note: "Answers on the first ring, at any hour, at any volume." },
      { name: "Agent orchestration", note: "Orchestrator → department agents → specialists, with human approval gates." },
    ],
    divisions: ["ai", "AEOS", "insurance", "legal", "healthcare", "security"],
    proof: "60B AI tokens a month already running across three model providers.",
  },
  {
    id: "platform",
    n: "04",
    name: "Platform",
    icon: "⚙️",
    color: "#2f9df4",
    claim: "One stack. Forty-six businesses. Built once, deployed endlessly.",
    what:
      "Every division inherits the same identity layer, CRM, payment rail, email and SMS infrastructure, admin tooling, site generator and deployment pipeline. A new vertical does not start at zero — it starts with everything the last forty-five paid to build. That is the difference between a holding company and an operating system.",
    drives: ["WASTE", "STRAIN"],
    services: ["PR.TECH", "PR.BIZ", "PR.LAND"],
    products: [
      { name: "One-for-many SaaS", note: "A single codebase serving every division and every white label." },
      { name: "White-label engine", href: "https://roofers.co", note: "A new operating brand stood up on the existing stack in days." },
      { name: "Core services API", note: "Shared email, SMS, lead and CRM services every property calls." },
      { name: "Uptime & monitoring", href: "https://websitedowncheckers.com", note: "The network watching itself." },
    ],
    divisions: ["ai", "big-data", "connectivity", "franchise", "private-label", "non-profit"],
    proof: "One deploy pipeline behind r0cketship.com, roofers.co and the division network.",
  },
  {
    id: "connectivity",
    n: "05",
    name: "Connectivity",
    icon: "📡",
    color: "#8b6ef6",
    claim: "We own the physical layer most software companies have to rent.",
    what:
      "IoT, cellular, edge devices and the low-power communication layer underneath them. This is the pillar that turns a software ecosystem into a physical one — connected assets, connected logistics, connected islands, connected ports. It is also the hardest pillar for a pure software competitor to copy, because it requires infrastructure rather than a repository.",
    drives: ["STRAIN", "SIGNAL"],
    services: ["PR.NET", "PR.TECH"],
    products: [
      { name: "IoT & cellular", note: "Device identity, telemetry and low-latency signalling across the estate." },
      { name: "Connected logistics", note: "Assets that report their own position, condition and availability." },
      { name: "Island infrastructure", note: "Whole-market connectivity, from cruise port to merchant." },
      { name: "Edge & offline resilience", note: "Systems that keep working when the network does not." },
    ],
    divisions: ["connectivity", "telecom", "logistics-ip", "cruise-ports", "roatan", "cozumel", "lime-key", "puerto-rico", "security", "cybersecurity", "transportation"],
    proof: "Puerto Rico and the island programme are the reference deployments.",
  },
  {
    id: "entertainment",
    n: "06",
    name: "Entertainment",
    icon: "🎬",
    color: "#e14b8a",
    claim: "Attention is the cheapest customer acquisition ever invented. We produce it.",
    what:
      "Entertainment is the vehicle, not the destination. A film, a game, a series or a live property produces attention at a cost per impression no ad auction can match — and the ecosystem underneath it turns that attention into commerce, data and demand for every other pillar. AEOS is the machine that makes producing it economic.",
    drives: ["CAC", "SIGNAL"],
    services: ["PR.TECH", "PR.NET", "PR.SALES"],
    products: [
      { name: "AEOS", href: "/corporate-structure/AEOS", note: "Autonomous Entertainment Operating System — one world, every medium." },
      { name: "Investment one-pager", href: "/corporate-structure/AEOS/one-pager", note: "The private-equity case for the entertainment platform." },
      { name: "Business plan", href: "/corporate-structure/AEOS/business-plan", note: "Model, commerce layer, cap table and exit." },
      { name: "Commerce engine", note: "Merchandise, brand integration and checkout inside the experience." },
    ],
    divisions: ["entertainment", "AEOS", "gaming", "media", "film", "excursions", "outdoors"],
    proof: "AEOS is live and gated at /corporate-structure/AEOS.",
  },
  {
    id: "commerce",
    n: "07",
    name: "Commerce & Capital",
    icon: "💠",
    color: "#00c2b2",
    claim: "The ecosystem sells to itself, then reinvests the margin into the next vertical.",
    what:
      "Owning demand, data and attention only matters if there is something to sell and somewhere for the profit to go. This pillar closes the loop: private-label product, marketplaces, franchising and financial services on the sell side, and a fund that recycles revenue back into the verticals on the other. Growth is funded by the ecosystem rather than dependent on the next round.",
    drives: ["CAC", "WASTE"],
    services: ["PR.FUND", "PR.LAND", "PR.SALES"],
    products: [
      { name: "Private label & CPG", note: "Product built for demand the ecosystem already sees coming." },
      { name: "Marketplaces", href: "https://retreats.plus", note: "Two-sided platforms where the network is the supply." },
      { name: "Financial services", href: "https://mortgages.plus", note: "Mortgage, insurance and wealth against first-party intent." },
      { name: "PR.Fund", note: "Recycles revenue into verticals, funds dividends and growth." },
    ],
    divisions: ["private-label", "hospitality", "firearms", "outdoors", "wealth", "finance", "insurance", "real-estate", "franchise", "non-profit", "manufacturing", "agtech", "construction", "mining", "oil-gas", "green-energy", "biotech", "pharmacy"],
    proof: "PR.Fund invests into verticals and recycles revenue across the portfolio.",
  },
];

/** How the ecosystem compounds — the loop that makes the tide rise. */
export const FLYWHEEL = [
  { k: "More businesses join", v: "Each new division arrives onto a stack that is already built, and immediately shares the cost of it." },
  { k: "More users engage", v: "Every interaction across every division writes into the same first-party graph." },
  { k: "The data gets stronger", v: "Prediction improves with breadth, not just volume — the same person seen in six contexts." },
  { k: "Acquisition gets cheaper", v: "Better prediction means less waste, and a lead wrong for one division is right for another." },
  { k: "Margin improves", v: "Lower CAC and lower operating strain fall straight to the line." },
  { k: "Capital recycles", v: "PR.Fund reinvests the margin into the next vertical, which starts the loop again — one division stronger." },
];

export const SERVICES_MAP: Record<string, { name: string; role: string }> = {
  "PR.BIZ": { name: "Project PR.Biz", role: "Global business development · Dev-as-a-Service · executive team" },
  "PR.NET": { name: "Project PR.Net", role: "IoT & cellular connectivity · infrastructure · integrated ad network" },
  "PR.TECH": { name: "Project PR.Tech", role: "Master tech stack · one-for-many SaaS platform · delivery" },
  "PR.SALES": { name: "R0cketShip Sales Team", role: "Demand-generation engine · reduced CAC across the portfolio" },
  "PR.LAND": { name: "Project PR.Land", role: "Management & shared services · AI SaaS engine" },
  "PR.FUND": { name: "Project PR.Fund", role: "Invests into verticals · recycles revenue · funds dividends & growth" },
};

// ────────────────────────────────────────────── the accretive thesis ─────────
// Entertainment is one pillar. What makes it worth more than a pillar is what
// it does to the other six.
export const ACCRETIVE = {
  kicker: "The compounding effect",
  title: "What happens when Amazon and Berkshire Hathaway have a baby.",
  lede:
    "Entertainment is one pillar. But the data it produces, and the audience access it buys, compound across every other pillar — which makes the ecosystem more unique, more valuable, and harder to replicate than the sum of the businesses inside it.",

  models: [
    {
      who: "Amazon",
      shape: "The marketplace",
      owns: "The demand, the storefront, the logistics and the data",
      takes: "A percentage of somebody else's product",
      limit:
        "Enormous leverage on other people's margin — but it does not make the thing being sold. When the supplier's margin compresses, so does the take.",
      color: "#f5a623",
    },
    {
      who: "Berkshire Hathaway",
      shape: "The owner",
      owns: "The companies that manufacture, sell and service the product",
      takes: "The whole margin, on the whole product",
      limit:
        "Owns the earnings outright — but the businesses sit beside each other rather than inside each other. A furniture company learns nothing from an insurer.",
      color: "#2f9df4",
    },
    {
      who: "R0cketShip",
      shape: "The ecosystem",
      owns: "The demand, the data, the platform — and the companies that make and sell",
      takes: "The whole margin, plus the data every transaction leaves behind",
      limit:
        "Each division earns on its own. Then every transaction, view, call and purchase writes into one graph that makes all forty-six cheaper to run and easier to sell into.",
      color: "#ff5b2e",
      us: true,
    },
  ],

  entertainmentPoint: [
    { k: "It earns on its own", v: "AEOS is a real revenue engine in the entertainment space — a perpetual royalty on production, standing up as a business without reference to anything else in the ecosystem." },
    { k: "It buys attention at a price no auction can match", v: "A film, a series, a game or a live property produces audience at a cost per impression that no paid media channel competes with. That attention is acquisition for every other pillar." },
    { k: "It produces data nobody else has", v: "Not clicks. Completion, retention, which character an audience actually cares about, which market over-indexes, which product a viewer stopped to look at. First-party, behavioural, and unavailable anywhere else." },
    { k: "That data makes the other six sharper", v: "It flows into the sales engine, the advertising engine and the business-enhancement engine — lowering acquisition cost and sharpening prediction across insurance, home services, travel, healthcare and every other division." },
  ],

  accretion:
    "This is the accretive effect. The entertainment engine is worth something on its own. The data it generates is worth something on its own. But the combination is worth more than either — because the data has nowhere better to go than into an ecosystem that already owns the demand, the platform and the companies doing the selling. A marketplace would have to rent that. A conglomerate would have no way to move it between subsidiaries. We own both ends.",

  close:
    "One pillar, earning like a business. Feeding six others, compounding like a platform. That is the rising tide — and it is why the ecosystem is worth more than the businesses inside it.",
};
