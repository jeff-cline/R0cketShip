// ──────────────────────────────────────────────────────────────────────────
// Shared pitch-deck content types. Used by the Cataño deck (app/catano) and the
// corporate-structure division decks (app/corporate-structure). One shape, one
// renderer (DeckViewer), many decks.
// ──────────────────────────────────────────────────────────────────────────

export type Point = { q: string; a: string };
export type ChartBar = { label: string; value: number; display: string };

// Richer, data-backed visualizations (rendered as self-contained SVG/CSS — no
// chart library). A slide may carry one. `source` is printed under the chart.
export type VizDatum = { label: string; value: number; display: string; sub?: string; color?: string };
export type Viz =
  | { kind: "bars"; data: VizDatum[]; note?: string; source?: string }
  | { kind: "funnel"; data: VizDatum[]; note?: string; source?: string }
  | { kind: "donut"; data: VizDatum[]; note?: string; source?: string };

export type Slide = { n: number; kicker: string; title: string; vision: string; points: Point[]; chart?: ChartBar[]; chartNote?: string; viz?: Viz; footnote?: string };
export type Step = { k: string; t: string; d: string };

/** Persistent anchor link shown at the bottom of each content slide. */
export type DeckAnchor = { label: string; href: string };

export type Deck = {
  brand: string;
  cover: { tag: string; title: string; titleSub: string; sub: string; footer: string };
  closing: { kicker: string; title: string; titleSub: string; steps: Step[] };
  slides: Slide[];
};

/** A featured "Operating Entity Pitch Deck" appended as the final deck slide. */
export type OperatingDeck = {
  title: string;
  subtitle: string | null;
  description: string | null;
  highlight: string | null;
  imageUrl: string | null;
  pdfUrl: string;
};
