import type { Metadata } from "next";
import { PortOpportunity } from "@/app/_crew/PortOpportunity";

export const metadata: Metadata = {
  title: "Port Opportunity Data & Statistics — CrewPerk",
  description: "Cruise ports ranked by annual revenue opportunity — visitors, shore spend, demand, and value per port. The CrewPerk expansion roadmap.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PortOpportunity />;
}
