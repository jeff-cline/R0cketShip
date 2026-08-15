import type { Metadata } from "next";
import { CrewPerkLander } from "./CrewPerkLander";

export const metadata: Metadata = {
  title: "CrewPerk — The Secret Knock for Cruise Crew",
  description: "Crew-only pricing, local experiences, transportation discounts, and perks at verified partners in every port. Built by crew, for crew — starting in Puerto Rico.",
  robots: { index: true, follow: true },
};

export default function Page() {
  return <CrewPerkLander />;
}
