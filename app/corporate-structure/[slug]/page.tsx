import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { DeckViewer } from "@/app/_components/deck/DeckViewer";
import { DIVISION_PASSWORD, getIndustry } from "../industries";
import { CONTENT } from "../content";
import { db } from "@/src/db/client";
import { operatingDecks } from "@/src/db/schema";

// Rendered on demand so newly uploaded Operating Entity Pitch Decks appear
// immediately (no rebuild needed).
export const dynamic = "force-dynamic";

export default async function DivisionDeck({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const deck = CONTENT[slug];
  const industry = getIndustry(slug);
  if (!deck || !industry) notFound();

  // Optional featured Operating Entity Pitch Deck attached to this division.
  const od = (
    await db
      .select()
      .from(operatingDecks)
      .where(and(eq(operatingDecks.slug, slug), eq(operatingDecks.active, true)))
      .orderBy(desc(operatingDecks.createdAt))
      .limit(1)
  )[0];
  const bonus = od
    ? { title: od.title, subtitle: od.subtitle, description: od.description, highlight: od.highlight, imageUrl: od.imageUrl, pdfUrl: od.pdfUrl }
    : null;

  // Puerto Rico carries a persistent anchor to its flagship Cataño deck, plus
  // its own password (it holds private deal economics — kept off the shared code).
  const anchor = slug === "puerto-rico" ? { label: "Anchored by the Cataño Project — open the deck", href: "/catano?v=corporate" } : null;
  // Every division deck opens with the universal TEMP!234 default; Puerto Rico
  // also accepts its own JEFFCLINE password.
  const password = slug === "puerto-rico" ? ["JEFFCLINE", DIVISION_PASSWORD] : DIVISION_PASSWORD;
  // On Puerto Rico, every "Cataño" mention links to the flagship Cataño deck.
  const linkify = slug === "puerto-rico" ? { term: "Cataño", href: "/catano?v=corporate" } : null;

  return <DeckViewer deck={deck} password={password} storageKey={`cs-${slug}`} gateKey={`cs-${slug}`} bonus={bonus} anchor={anchor} linkify={linkify} />;
}
