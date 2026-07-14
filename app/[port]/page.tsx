import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { portFromSlug } from "@/app/_crew/ports";
import { PortPage } from "@/app/_crew/PortPage";

// cruise.plus/<Port-Slug> — top-level dynamic. Only resolves known cruise ports;
// anything else 404s (so it doesn't shadow real routes, which take priority).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ port: string }> }): Promise<Metadata> {
  const { port } = await params;
  const name = portFromSlug(port);
  if (!name) return { title: "Cruise.Plus" };
  const city = name.split(",")[0];
  return {
    title: `${city} cruise deals & excursions — Cruise.Plus`,
    description: `Crew-vetted discounts on food, beaches, excursions, and experiences in ${name}. Activate free with Cruise.Plus.`,
    robots: { index: true, follow: true },
  };
}

export default async function Page({ params }: { params: Promise<{ port: string }> }) {
  const { port } = await params;
  const name = portFromSlug(port);
  if (!name) notFound();
  return <PortPage portName={name} />;
}
