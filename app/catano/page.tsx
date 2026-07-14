"use client";

import { useEffect, useState } from "react";
import { pickDeck } from "./deck-content";
import type { Deck } from "@/app/_components/deck/types";
import { DeckViewer } from "@/app/_components/deck/DeckViewer";

export default function CatanoDeck() {
  const [deck, setDeck] = useState<Deck | null>(null);

  // Resolve the variant from the host (route is shared across domains).
  // A `?v=corporate|partner` query param overrides the host — lets us preview
  // either deck on any domain before DNS for puertoricomasterminds.com is live.
  useEffect(() => {
    const override = new URLSearchParams(window.location.search).get("v");
    const host = override ? (override === "partner" ? "r0cketship.com" : "puertoricomasterminds.com") : window.location.hostname;
    setDeck(pickDeck(host));
  }, []);

  if (!deck) {
    return <main className="grid-bg-dark min-h-[100dvh]" style={{ background: "radial-gradient(120% 90% at 80% -10%, #161d2e, #0a0e17 60%)" }} />;
  }
  // Cataño opens with its own JEFFCLINE password OR the universal TEMP!234 default.
  return <DeckViewer deck={deck} password={["JEFFCLINE", "TEMP!234"]} storageKey="catano-ok" />;
}
