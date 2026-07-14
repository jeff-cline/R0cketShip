// ──────────────────────────────────────────────────────────────────────────
// The R0cketShip Holdings ecosystem map. Drives /corporate-structure (the public
// hierarchy page) and the per-division decks at /corporate-structure/<slug>.
//
// Operating divisions, all uniform "working" cards. Each has its own deck at
// ./content/<slug>.ts (generated per industry). The Cataño tourism deck still
// lives separately at /catano; the Puerto Rico card here is the infrastructure
// play, not a standout flagship.
// ──────────────────────────────────────────────────────────────────────────

export type Service = { code: string; name: string; role: string };

export type Industry = {
  slug: string;
  name: string;
  group: string;
  tagline: string;
  /** External link instead of a /corporate-structure/<slug> deck (Puerto Rico → Cataño). */
  href?: string;
};

/** Six management & shared-services companies that service every division. */
export const SERVICES: Service[] = [
  { code: "PR.BIZ", name: "Project PR.Biz", role: "Global business development · Dev-as-a-Service · executive team" },
  { code: "PR.NET", name: "Project PR.Net", role: "IoT & cellular connectivity · infrastructure · integrated ad network" },
  { code: "PR.TECH", name: "Project PR.Tech", role: "Master tech stack · one-for-many SaaS platform · delivery" },
  { code: "PR.SALES", name: "R0cketShip Sales Team", role: "Demand-generation engine · reduced CAC across the portfolio" },
  { code: "PR.LAND", name: "Project PR.Land", role: "Management & shared services · AI (stocks, futures) SaaS engine" },
  { code: "PR.FUND", name: "Project PR.Fund", role: "Invests into verticals · recycles revenue · funds dividends & growth" },
];

/** 40 operating divisions, in board order (Puerto Rico last). */
export const INDUSTRIES: Industry[] = [
  { slug: "insurance", name: "Insurance", group: "Financial", tagline: "AI-underwritten coverage and a white-label InsurTech roll-up." },
  { slug: "oil-gas", name: "Oil & Gas", group: "Energy & Industrial", tagline: "Downhole tech, land leases, and an oilfield-services roll-up." },
  { slug: "biotech", name: "Biotech", group: "Health & Life Sciences", tagline: "Contract-backed biotech with a built-in commercial engine." },
  { slug: "transportation", name: "Transportation & Logistics", group: "Energy & Industrial", tagline: "A logistics-optimization platform across the freight ecosystem." },
  { slug: "finance", name: "Finance", group: "Financial", tagline: "A customer-less revenue engine — AI-driven arbitrage across markets." },
  { slug: "manufacturing", name: "Manufacturing", group: "Energy & Industrial", tagline: "Commercial equipment and battery-powered industrial solutions." },
  { slug: "ai", name: "Artificial Intelligence", group: "Technology & Data", tagline: "Vertical AI across education, healthcare, and entertainment." },
  { slug: "home-services", name: "Home Services", group: "Consumer & Local", tagline: "A roll-up of solar, HVAC, plumbing, electrical, and more." },
  { slug: "legal", name: "Legal", group: "Professional Services", tagline: "Title and process automation with a real-time referral network." },
  { slug: "big-data", name: "Big Data", group: "Technology & Data", tagline: "Cross-utilized data lakes, multi-POP tracking, and intent ML." },
  { slug: "mining", name: "Mining", group: "Energy & Industrial", tagline: "Data-driven resource extraction and field-embedded SaaS." },
  { slug: "security", name: "Security", group: "Technology & Data", tagline: "Government, corporate, and personal protection at scale." },
  { slug: "medtech", name: "MedTech", group: "Health & Life Sciences", tagline: "Enterprise medical sales and physician-facing AdTech." },
  { slug: "connectivity", name: "Connectivity", group: "Technology & Data", tagline: "Private enterprise cell connections and global data networks." },
  { slug: "real-estate", name: "Real Estate", group: "Financial", tagline: "A tech-enabled brokerage and investment roll-up." },
  { slug: "healthcare", name: "Healthcare", group: "Health & Life Sciences", tagline: "A patient-acquisition and practice-management platform." },
  { slug: "education", name: "Education", group: "Consumer & Local", tagline: "An outcomes-driven education and workforce-training network." },
  { slug: "travel", name: "Travel & Tourism", group: "Consumer & Local", tagline: "Destination platforms that capture and monetize visitor demand." },
  { slug: "entertainment", name: "Entertainment", group: "Media & Entertainment", tagline: "Live events, talent, and audience monetization." },
  { slug: "gaming", name: "Gaming", group: "Media & Entertainment", tagline: "Player-acquisition and monetization across the gaming stack." },
  { slug: "green-energy", name: "Green Energy", group: "Energy & Industrial", tagline: "Cleantech and renewable-energy project development." },
  { slug: "franchise", name: "Franchise", group: "Consumer & Local", tagline: "A franchise-development and unit-economics engine." },
  { slug: "wealth", name: "Wealth & Investing", group: "Financial", tagline: "Multi-family-office tech and a JV investment platform." },
  { slug: "media", name: "Media & News", group: "Media & Entertainment", tagline: "Owned-and-operated media with a programmatic ad network." },
  { slug: "film", name: "Film & Production", group: "Media & Entertainment", tagline: "Slate financing and distribution with data-driven greenlights." },
  { slug: "eyecare", name: "Eyecare", group: "Health & Life Sciences", tagline: "A vision-care roll-up with retail and tele-optometry." },
  { slug: "pharmacy", name: "Pharmacy", group: "Health & Life Sciences", tagline: "Specialty and retail pharmacy with adherence technology." },
  { slug: "outdoors", name: "Outdoors & Recreation", group: "Consumer & Local", tagline: "Outdoor commerce, experiences, and community." },
  { slug: "excursions", name: "Excursions & Experiences", group: "Consumer & Local", tagline: "Bookable experiences and shore-excursion inventory." },
  { slug: "firearms", name: "Firearms & 2A", group: "Consumer & Local", tagline: "Compliant commerce and community across the 2A market." },
  { slug: "private-label", name: "Private Label & CPG", group: "Consumer & Local", tagline: "Data-led private-label brands across categories." },
  { slug: "cybersecurity", name: "Cybersecurity", group: "Technology & Data", tagline: "Managed detection and de-identified threat intelligence." },
  { slug: "agtech", name: "AgTech", group: "Energy & Industrial", tagline: "Precision-ag data and an equipment-services roll-up." },
  { slug: "construction", name: "Construction", group: "Energy & Industrial", tagline: "Project-bidding, equipment, and a subcontractor network." },
  { slug: "hospitality", name: "Hospitality & Restaurants", group: "Consumer & Local", tagline: "Guest-acquisition and loyalty for hospitality operators." },
  { slug: "telecom", name: "Telecom & 5G", group: "Technology & Data", tagline: "Infrastructure, connectivity, and an integrated ad layer." },
  { slug: "non-profit", name: "Non-Profit & Foundations", group: "Professional Services", tagline: "A Kingdom-impact DAF and Opportunity-Zone fund." },
  { slug: "automotive", name: "Automotive", group: "Consumer & Local", tagline: "Dealer marketing, F&I technology, and a service-center roll-up." },
  { slug: "senior", name: "Senior Living & Care", group: "Health & Life Sciences", tagline: "Senior-care acquisition and a Medicare-marketing engine." },
  { slug: "roatan", name: "Roatan Island", group: "Islands & Infrastructure", tagline: "Island infrastructure and proprietary tech stacks for a cruise economy ripe for disruption." },
  { slug: "cozumel", name: "Cozumel Island", group: "Islands & Infrastructure", tagline: "The Caribbean's busiest cruise port, re-platformed end to end." },
  { slug: "lime-key", name: "Lime Key Island", group: "Islands & Infrastructure", tagline: "A private-island build-out: infrastructure, connectivity, and curated experience." },
  { slug: "cruise-ports", name: "Cruise Port Operations", group: "Islands & Infrastructure", tagline: "Port operations plus passenger tagging — high-net-worth, high-income, high disposable income." },
  { slug: "logistics-ip", name: "Logistics via Connected IP", group: "Islands & Infrastructure", tagline: "Freight and last-mile optimization over a proprietary connected-IP network." },
  { slug: "puerto-rico", name: "Puerto Rico", group: "Islands & Infrastructure", tagline: "Infrastructure and proprietary tech stacks powering a disconnected community ripe for disruption." },
];

/** Default placeholder password for every division deck (Cataño keeps its own). */
export const DIVISION_PASSWORD = "TEMP!234";

export function getIndustry(slug: string): Industry | undefined {
  return INDUSTRIES.find((i) => i.slug === slug);
}
