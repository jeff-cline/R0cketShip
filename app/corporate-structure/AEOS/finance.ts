// ──────────────────────────────────────────────────────────────────────────
// AEOS financial model.
//
// Ramp as specified by the operator: royalty revenue starts at zero, reaches
// $100k in Q1, doubles in each of Q2–Q5, then compounds at 25% per quarter.
// Contribution margin 40%. Platform operating cost $3.6M a year.
//
// Everything below is COMPUTED from those inputs rather than typed in, so the
// model can be re-run by changing the constants and nothing goes stale or
// inconsistent between the one-pager and the plan.
// ──────────────────────────────────────────────────────────────────────────

export const MODEL_INPUTS = {
  q1: 100_000,
  doublingQuarters: 4,      // Q2, Q3, Q4, Q5 each double the prior quarter
  steadyGrowth: 0.25,       // every quarter thereafter
  margin: 0.40,             // contribution margin on royalty revenue
  opexAnnual: 3_600_000,    // platform operating cost, per year
  quarters: 20,             // five years modelled
};

export type Quarter = {
  q: number; label: string; year: number;
  revenue: number; contribution: number; opex: number; ebitda: number;
  cumulative: number; phase: "ramp" | "compound";
};

function buildQuarters(): Quarter[] {
  const { q1, doublingQuarters, steadyGrowth, margin, opexAnnual, quarters } = MODEL_INPUTS;
  const out: Quarter[] = [];
  let rev = 0;
  let cum = 0;
  for (let i = 1; i <= quarters; i++) {
    if (i === 1) rev = q1;
    else if (i <= 1 + doublingQuarters) rev = rev * 2;
    else rev = rev * (1 + steadyGrowth);
    const contribution = rev * margin;
    const opex = opexAnnual / 4;
    const ebitda = contribution - opex;
    cum += ebitda;
    out.push({
      q: i, label: `Q${((i - 1) % 4) + 1} Y${Math.ceil(i / 4)}`, year: Math.ceil(i / 4),
      revenue: rev, contribution, opex, ebitda, cumulative: cum,
      phase: i <= 1 + doublingQuarters ? "ramp" : "compound",
    });
  }
  return out;
}

export const QUARTERS: Quarter[] = buildQuarters();

export type YearRow = { year: number; revenue: number; contribution: number; opex: number; ebitda: number; margin: number };

export const YEARS: YearRow[] = [1, 2, 3, 4, 5].map((y) => {
  const qs = QUARTERS.filter((q) => q.year === y);
  const revenue = qs.reduce((s, q) => s + q.revenue, 0);
  const contribution = qs.reduce((s, q) => s + q.contribution, 0);
  const opex = qs.reduce((s, q) => s + q.opex, 0);
  const ebitda = contribution - opex;
  return { year: y, revenue, contribution, opex, ebitda, margin: revenue ? ebitda / revenue : 0 };
});

/** First quarter where cumulative EBITDA turns positive. */
export const BREAKEVEN = QUARTERS.find((q) => q.cumulative > 0) ?? null;
/** First quarter where the quarter itself is EBITDA-positive. */
export const FIRST_PROFITABLE_QUARTER = QUARTERS.find((q) => q.ebitda > 0) ?? null;
/** Peak capital requirement — the deepest the cumulative line goes. */
export const PEAK_FUNDING = Math.abs(Math.min(...QUARTERS.map((q) => q.cumulative), 0));

const Y5 = YEARS[4]!;

export const EXIT = {
  basisRevenue: Y5.revenue,
  basisEbitda: Y5.ebitda,
  revenueMultiples: [6, 10, 15],
  ebitdaMultiples: [12, 18, 25],
  note:
    "Exit values are the model's revenue and EBITDA at the end of year five against public comparables for vertical AI and production infrastructure. Multiples are a range, not a forecast — a strategic buyer inside the entertainment stack and a financial buyer will price this very differently.",
  buyers: [
    { who: "Strategic — engine or platform", why: "Buys the orchestration layer that drives consumption of their runtime and locks the production graph inside their ecosystem." },
    { who: "Strategic — studio or streamer", why: "Buys the cost curve. Vertical integration of the production stack, defended against every competitor on the slate." },
    { who: "Strategic — cloud", why: "Buys forecastable, high-margin media compute demand and the software that generates it." },
    { who: "Financial — growth or PE", why: "Buys recurring royalty revenue with an expanding margin and a roll-up thesis across production services." },
  ],
};

/** Illustrative cap table across the modelled rounds. */
export type CapRow = { holder: string; seed: number; a: number; b: number; note: string };
export const CAP_TABLE: CapRow[] = [
  { holder: "R0cketShip Holdings (founder)", seed: 70, a: 56, b: 47.6, note: "Contributes the platform, the existing stack and the operating team." },
  { holder: "Seed", seed: 18, a: 14.4, b: 12.2, note: "Funds the pilot titles and the KPI baseline." },
  { holder: "Series A", seed: 0, a: 18, b: 15.3, note: "Funds go-to-market once the KPIs are established." },
  { holder: "Series B", seed: 0, a: 0, b: 15.0, note: "Funds the data and commerce layer build-out." },
  { holder: "Option pool", seed: 12, a: 11.6, b: 9.9, note: "Refreshed at each round." },
];

export const ROUNDS = [
  { name: "Seed", raise: 4_000_000, use: "Two pilot titles, instrumented end to end. Establishes the KPI baseline against the operator's own comparable productions." },
  { name: "Series A", raise: 15_000_000, use: "Platform hardening, first studio licences, and the rights ledger to a standard a studio's legal department will sign." },
  { name: "Series B", raise: 40_000_000, use: "Data and commerce layer, international delivery, and the slate velocity to make the library compound." },
];

// ────────────────────────────────────────────── the layer above the layer ────
// Entertainment is the vehicle. Commerce is where the second revenue line lives.
export const COMMERCE = {
  premise:
    "Entertainment is the most efficient attention-acquisition mechanism ever built, and it has historically monetised that attention badly — through a box office window, a subscription, or an ad slot sold to somebody else. If the platform already holds the world, the characters, the audience response data and the distribution relationship, the commerce layer is not a separate business. It is the obvious one.",
  layers: [
    { pos: "Above", name: "Product & merchandise", what: "Characters, wardrobe, vehicles and props exist as production-ready 3D assets before the title ships. Merchandise is a manufacturing decision, not a design project." },
    { pos: "Around", name: "Integrated marketing", what: "Brand integration placed inside the world at generation time rather than composited afterwards — and re-renderable per market, per audience, per campaign flight." },
    { pos: "Below", name: "Ad sales & attention", what: "Inventory across every property on the R0cketShip network, sold against first-party audience response data rather than a rate card." },
    { pos: "Through", name: "Commerce engine", what: "Checkout inside the experience. What the audience is watching is what they can buy, priced and stocked against the demand signal the title itself generates." },
  ],
  flywheel: [
    "A title generates audience response data — completion, retention, character engagement, geography.",
    "That data tells the commerce engine which characters, products and markets are actually converting.",
    "Merchandise, ad inventory and brand integration are priced and produced against real demand rather than a guess.",
    "Commerce revenue funds the next title, which generates more data, across more of the network.",
    "Every other R0cketShip division inherits the same audience graph and sells into it.",
  ],
  amazonBerkshire: {
    title: "Amazon and Berkshire Hathaway, in one company.",
    body:
      "A marketplace owns the demand and takes a percentage of somebody else's product. A conglomerate owns the companies outright and takes the whole margin, but its subsidiaries sit beside each other rather than inside each other — a furniture business learns nothing from an insurer. AEOS is inside an ecosystem that does both: R0cketShip owns the demand, the platform and the operating companies, so the entertainment engine earns on its own and then hands its data to forty-five other divisions that are already selling.",
    rows: [
      { who: "Amazon", takes: "A percentage of someone else's product", limit: "No margin on the thing itself" },
      { who: "Berkshire Hathaway", takes: "The whole margin, on the whole product", limit: "No data moving between subsidiaries" },
      { who: "R0cketShip + AEOS", takes: "The whole margin, plus the data every transaction leaves behind", limit: "Both ends owned — which is the accretion" },
    ],
    accretive:
      "The entertainment engine is a revenue business on its own. The data it produces is valuable on its own. The combination is worth more than either, because that data has nowhere better to go than into an ecosystem that already owns the demand, the platform and the companies doing the selling. A marketplace would have to rent that. A conglomerate would have no way to move it. This is what makes the ecosystem worth more than the businesses inside it.",
  },
  why:
    "This is the line that changes the exit conversation. A production platform is worth a production multiple. A production platform with an attached first-party commerce engine, selling across a network of forty operating divisions, is a different asset entirely — and the entertainment IP is what makes the audience worth having.",
};

// ───────────────────────────────────────────────────────────── formatting ────
export function usd(n: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact) {
    if (Math.abs(n) >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2)}M`;
    if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}K`;
  }
  return `${n < 0 ? "−" : ""}$${Math.abs(Math.round(n)).toLocaleString()}`;
}
