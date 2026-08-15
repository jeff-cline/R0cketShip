// The THRIVE ladder — single source of truth for the lander + the tier tools.
export interface Tier {
  key: string;
  name: string;
  price: string;
  monthly: number;
  tagline: string;
  features: string[];
  secretWeapon?: boolean;
  featured?: boolean;
}

export const TIERS: Tier[] = [
  {
    key: "try",
    name: "TRY",
    price: "$1,500",
    monthly: 1500,
    tagline: "See who's in-market, today.",
    features: ["ZIP predictive data", "Unlimited email support"],
  },
  {
    key: "help",
    name: "HELP",
    price: "$3,000",
    monthly: 3000,
    tagline: "Data + a coach to act on it.",
    features: ["Everything in TRY", "Business & tech consulting"],
  },
  {
    key: "response",
    name: "RESPONSE",
    price: "$7,500",
    monthly: 7500,
    tagline: "Predictive-data marketing that responds for you.",
    features: ["Everything in HELP", "Predictive-data marketing"],
    featured: true,
  },
  {
    key: "integrate",
    name: "INTEGRATE",
    price: "$15,500",
    monthly: 15500,
    tagline: "Keyword calls, into your funnel.",
    features: ["Everything in RESPONSE", "Keyword calls in a ZIP code"],
  },
  {
    key: "velocity",
    name: "VELOCITY",
    price: "$32,500",
    monthly: 32500,
    tagline: "Quick-start. Statewide. In-person.",
    features: [
      "Everything in INTEGRATE",
      "Keyword calls up to an entire state",
      "Immersive in-person — live at our location",
    ],
  },
  {
    key: "explode",
    name: "EXPLODE",
    price: "$55,000",
    monthly: 55000,
    tagline: "The Secret Weapon.",
    secretWeapon: true,
    features: [
      "Everything in VELOCITY",
      "Secret Weapon",
      "Exclusive keyword calls (+ new revenue stream)",
      "In-person / onsite live consulting included",
    ],
  },
];

export const TIER_FOOTNOTES = [
  "Ad spend and APIs may require additional budget.",
  "T&E not included — preapproved as needed.",
  "All tiers include tech & business consulting (unlimited emails). This sits on top of the core.",
];
