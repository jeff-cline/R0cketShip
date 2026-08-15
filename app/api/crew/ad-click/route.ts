import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/src/db/client";
import { crewAds, crewAdClicks } from "@/src/db/schema";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const ad = id ? (await db.select().from(crewAds).where(eq(crewAds.id, id)).limit(1))[0] : null;
  const dest = ad?.linkUrl || "https://crewperk.com";

  if (ad && ad.status === "active" && ad.balanceCents >= ad.bidCents) {
    const charge = Math.min(ad.bidCents, ad.balanceCents);
    await db.insert(crewAdClicks).values({ adId: ad.id, port: ad.port, chargeCents: charge });
    await db.update(crewAds).set({
      balanceCents: sql`${crewAds.balanceCents} - ${charge}`,
      spentCents: sql`${crewAds.spentCents} + ${charge}`,
      clicks: sql`${crewAds.clicks} + 1`,
      updatedAt: new Date(),
    }).where(eq(crewAds.id, ad.id));
  }
  return NextResponse.redirect(dest, 302);
}
