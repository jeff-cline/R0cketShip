import type { Metadata } from "next";
import { DIVISION_PASSWORD } from "../industries";
import { AEOSExperience } from "./AEOSExperience";

export const metadata: Metadata = {
  title: "AEOS — Autonomous Entertainment Operating System",
  description:
    "One creative intent becomes a film, a series, a game, a campaign and a distribution package — from a single world. The operating system underneath the studio.",
  robots: { index: false, follow: false },
};

// The deck is gated client-side; nothing sensitive renders until it unlocks.
export default function AEOSPage() {
  return <AEOSExperience password={DIVISION_PASSWORD} />;
}
