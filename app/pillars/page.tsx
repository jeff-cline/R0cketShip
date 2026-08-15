import type { Metadata } from "next";
import { PillarsView } from "./PillarsView";

export const metadata: Metadata = {
  title: "The Pillars — R0cketShip",
  description:
    "Seven capability pillars, forty-six divisions, one ecosystem. Lower acquisition cost, less operational strain, less non-selling expense, and predictive data — because a rising tide lifts all boats.",
  robots: { index: false, follow: false },
};

export default function PillarsPage() {
  return <PillarsView />;
}
