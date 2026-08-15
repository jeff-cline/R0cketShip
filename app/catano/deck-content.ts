// ──────────────────────────────────────────────────────────────────────────
// Cataño deck — types + host-aware variant selector.
//
// Two decks share the /catano route and switch on the request host:
//   • CORPORATE  → puertoricomasterminds.com  (Puerto Rico Masterminds /
//                  R0cketShip Holdings; institutional voice) — content-corporate.ts
//   • PARTNER    → r0cketship.com             (Jeff as operator-partner) — content-partner.ts
//
// Anything else (localhost, previews) defaults to CORPORATE — the deck we're
// actively building. Edit copy in the two content-*.ts files; this file only
// defines shapes and routing.
// ──────────────────────────────────────────────────────────────────────────

import { CORPORATE } from "./content-corporate";
import { PARTNER } from "./content-partner";

// Types are shared with the corporate-structure decks. Re-exported here so the
// content-*.ts files can keep importing from "./deck-content".
export type { Point, Slide, Step, Deck } from "@/app/_components/deck/types";
import type { Deck } from "@/app/_components/deck/types";

/** Pick the deck variant from the hostname. */
export function pickDeck(host: string | undefined | null): Deck {
  const h = (host ?? "").toLowerCase();
  if (h.includes("r0cketship") || h.includes("rocketship")) return PARTNER;
  return CORPORATE;
}
