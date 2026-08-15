import type { Metadata } from "next";
import { getBdPartnerBySlug } from "@/src/bd/partners";
import OpportunityClient from "../OpportunityClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getBdPartnerBySlug(slug);
  const who = p ? `${p.firstName} ${p.lastName}` : "R0cketShip";
  const title = `Investor Opportunity — ${who}`;
  const description = p
    ? `${who}, ${p.title}, invites you to explore the R0cketShip investor opportunity.`
    : "Explore the R0cketShip investor opportunity.";
  return {
    title: { absolute: title },
    description,
    robots: { index: false },
    openGraph: { title, description, url: `https://r0cketship.com/opportunity/${slug}`, images: [{ url: "/og-rocket.png", width: 1200, height: 630, alt: "R0cketShip" }] },
    twitter: { card: "summary_large_image", title, description, images: ["/og-rocket.png"] },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getBdPartnerBySlug(slug);
  return <OpportunityClient slug={slug} refName={p ? `${p.firstName} ${p.lastName}` : undefined} />;
}
