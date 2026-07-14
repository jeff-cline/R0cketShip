/**
 * Iframe / JS-fragment target for an embedded Offer Box.
 *
 * GET /embed/<key>          — full HTML doc, drop into an <iframe>
 * GET /embed/<key>?fmt=fragment — body-only fragment, used by the JS loader
 *
 * Inactive / missing boxes still render a polite empty state (rather than
 * 404) so a stale embed never breaks a host page.
 *
 * Cache for 60s at the edge so we don't hit the DB for every page-view of
 * every host. Click attribution is unaffected — clicks go to /c/obx/.
 *
 * `frame-ancestors *` is intentional: by design these boxes are meant to be
 * embedded on third-party sites we don't control.
 */
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { offerBoxes } from "@/src/db/schema";
import { selectOffersForBox } from "@/src/offer_box/select";
import { renderBoxHtml } from "@/src/offer_box/render";

export const runtime = "nodejs";

function publicBase(): string {
  return process.env.PUBLIC_BASE_URL ?? "https://r0cketship.com";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const url = new URL(req.url);
  const isFragment = url.searchParams.get("fmt") === "fragment";

  const box = (
    await db.select().from(offerBoxes).where(eq(offerBoxes.key, key)).limit(1)
  )[0];

  let html: string;
  if (!box || !box.active) {
    html = renderBoxHtml([], publicBase(), key, {
      variant: "default",
      fragment: isFragment,
    });
  } else {
    const offers = await selectOffersForBox({
      id: box.id,
      mode: box.mode,
      niches: box.niches ?? [],
      maxOffers: box.maxOffers,
    });
    html = renderBoxHtml(offers, publicBase(), box.key, {
      variant: "default",
      fragment: isFragment,
    });
  }

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60",
      // Allow embedding anywhere — by design, this is what an embed is for.
      "Content-Security-Policy": "frame-ancestors *",
      "X-Robots-Tag": "noindex",
    },
  });
}
