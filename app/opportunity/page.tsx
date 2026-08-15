import type { Metadata } from "next";
import OpportunityClient from "./OpportunityClient";
export const metadata: Metadata = {
  title: { absolute: "Investor Opportunity" },
  description: "R0cketShip — a technology-enabled permanent-capital compounder. Private & accredited investor access.",
  robots: { index: false },
  openGraph: {
    title: "Investor Opportunity",
    description: "R0cketShip — a technology-enabled permanent-capital compounder. Private & accredited investors.",
    url: "https://r0cketship.com/opportunity",
    images: [{ url: "/og-rocket.png", width: 1200, height: 630, alt: "R0cketShip" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Investor Opportunity",
    description: "R0cketShip — a technology-enabled permanent-capital compounder.",
    images: ["/og-rocket.png"],
  },
};
export default function Page() { return <OpportunityClient />; }
