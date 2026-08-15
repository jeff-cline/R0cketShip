/**
 * Offer Box edit page.
 *
 * Server-renders:
 *   - Current configuration (in <EditForm>)
 *   - Live HTML preview (rendered via `renderBoxHtml` and shown in a sandboxed
 *     iframe via `srcdoc` so we don't have to round-trip through `/embed/`)
 *   - Five embed snippet tabs (in <SnippetTabs>) — the HTML snapshot tab
 *     contains the same rendered HTML the live preview shows
 *   - Lifecycle controls: rotate key, toggle active, delete
 *
 * Every mutation is a server action with its own form/button so individual
 * actions don't accidentally fire each other.
 */
import { desc, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { offerBoxClicks, offerBoxes, tenants } from "@/src/db/schema";
import { PageHeader, Card, SectionTitle, StatCard, Badge } from "@/app/_ui/primitives";
import { selectOffersForBox } from "@/src/offer_box/select";
import { renderBoxHtml } from "@/src/offer_box/render";
import { buildSnippets } from "@/src/offer_box/snippets";
import { EditForm } from "./EditForm";
import { SnippetTabs } from "./SnippetTabs";
import {
  deleteOfferBoxAction,
  regenerateKeyAction,
  toggleActiveAction,
} from "../actions";

function publicBase(): string {
  return process.env.PUBLIC_BASE_URL ?? "https://r0cketship.com";
}

export const dynamic = "force-dynamic";

export default async function OfferBoxEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; ok?: string }>;
}) {
  await requireAuth(["god"]);
  const { id } = await params;
  const { created, ok } = await searchParams;

  const box = (
    await db.select().from(offerBoxes).where(eq(offerBoxes.id, id)).limit(1)
  )[0];
  if (!box) notFound();

  // Distinct active-tenant niches for the form's checkbox grid.
  const nicheRows = await db
    .selectDistinct({ niche: tenants.niche })
    .from(tenants)
    .where(eq(tenants.status, "active"))
    .orderBy(sql`${tenants.niche} asc`);
  const niches = nicheRows.map((r) => r.niche).filter(Boolean);

  // Clicks (30d) for the header stats.
  const clicks30 = Number(
    (
      await db
        .select({ c: sql<number>`count(*)::int` })
        .from(offerBoxClicks)
        .where(
          sql`${offerBoxClicks.offerBoxId} = ${box.id} AND ${offerBoxClicks.createdAt} > now() - interval '30 days'`,
        )
    )[0]?.c ?? 0,
  );
  const clicksAll = Number(
    (
      await db
        .select({ c: sql<number>`count(*)::int` })
        .from(offerBoxClicks)
        .where(eq(offerBoxClicks.offerBoxId, box.id))
    )[0]?.c ?? 0,
  );
  const recentClicks = await db
    .select()
    .from(offerBoxClicks)
    .where(eq(offerBoxClicks.offerBoxId, box.id))
    .orderBy(desc(offerBoxClicks.createdAt))
    .limit(10);

  // Pre-render the box for the live preview and the HTML-snippet tab.
  const offers = await selectOffersForBox({
    id: box.id,
    mode: box.mode,
    niches: box.niches ?? [],
    maxOffers: box.maxOffers,
  });
  const previewHtml = renderBoxHtml(offers, publicBase(), box.key, {
    variant: "default",
    fragment: false,
  });
  const emailHtml = renderBoxHtml(offers, publicBase(), box.key, {
    variant: "email",
    fragment: false,
  });

  const snippets = buildSnippets({ key: box.key, format: box.format }, publicBase(), emailHtml);

  return (
    <>
      <PageHeader
        title={box.name}
        subtitle={`Key: ${box.key} · created ${new Date(box.createdAt).toLocaleDateString()}`}
        actions={
          <a className="btn btn-ghost" href="/admin/offer-box">
            ← All offer boxes
          </a>
        }
      />

      {(created || ok === "saved" || ok === "key") && (
        <div className="mb-6">
          <Card>
            <div className="flex items-center gap-3 text-sm">
              <Badge tone="pos">
                {created ? "Created" : ok === "key" ? "Key rotated" : "Saved"}
              </Badge>
              <span>
                {created
                  ? "Offer box created — grab a snippet below to embed it."
                  : ok === "key"
                  ? "New embed key generated — update any live embeds with the new snippets."
                  : "Configuration saved."}
              </span>
            </div>
          </Card>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Status" value={box.active ? "Active" : "Paused"} accent={box.active} />
        <StatCard label="Clicks (30d)" value={clicks30.toLocaleString()} />
        <StatCard label="Clicks (all time)" value={clicksAll.toLocaleString()} />
      </div>

      <div className="mb-6">
        <EditForm
          box={{
            id: box.id,
            name: box.name,
            mode: box.mode,
            niches: box.niches ?? [],
            maxOffers: box.maxOffers,
            format: box.format,
            active: box.active,
          }}
          niches={niches}
        />
      </div>

      <div className="mb-6">
        <Card>
          <SectionTitle hint={`${offers.length} offer${offers.length === 1 ? "" : "s"} currently selected`}>
            Live preview
          </SectionTitle>
          <div
            className="overflow-hidden rounded-[var(--radius-lg)]"
            style={{ border: "1px solid var(--line)", background: "#0b1020" }}
          >
            <iframe
              srcDoc={previewHtml}
              title="Offer box live preview"
              sandbox=""
              style={{ width: "100%", height: 360, border: 0, display: "block" }}
            />
          </div>
        </Card>
      </div>

      <div className="mb-6">
        <Card>
          <SectionTitle>Embed snippets</SectionTitle>
          <SnippetTabs
            defaultTab={
              box.format === "html"
                ? "html"
                : box.format === "js"
                ? "js"
                : box.format === "popup"
                ? "popup"
                : "iframe"
            }
            iframe={snippets.iframe}
            js={snippets.js}
            html={snippets.html}
            popup={snippets.popup}
            klaviyoHint={snippets.klaviyoHint}
          />
        </Card>
      </div>

      <div className="mb-6">
        <Card>
          <SectionTitle hint="last 10 clicks tracked through r0cketship.com/c/obx">
            Recent clicks
          </SectionTitle>
          {recentClicks.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              No clicks recorded yet — ship the snippet to start seeing traffic.
            </p>
          ) : (
            <ul className="space-y-1 text-xs" style={{ color: "var(--ink-2)" }}>
              {recentClicks.map((c) => (
                <li key={c.id} className="flex justify-between gap-3">
                  <span className="truncate">
                    {new Date(c.createdAt).toLocaleString()} · {c.referrer ?? "(no referrer)"}
                  </span>
                  <code style={{ color: "var(--muted-2)" }}>{c.offerId.slice(0, 8)}</code>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mb-12">
        <Card>
          <SectionTitle hint="careful — rotating breaks old embeds">Lifecycle</SectionTitle>
          <div className="flex flex-wrap gap-3">
            <form action={toggleActiveAction}>
              <input type="hidden" name="id" value={box.id} />
              <input type="hidden" name="active" value={box.active ? "0" : "1"} />
              <button className="btn btn-ghost" type="submit">
                {box.active ? "Pause" : "Resume"}
              </button>
            </form>
            <form action={regenerateKeyAction}>
              <input type="hidden" name="id" value={box.id} />
              <button className="btn btn-ghost" type="submit">
                Rotate embed key
              </button>
            </form>
            <form action={deleteOfferBoxAction}>
              <input type="hidden" name="id" value={box.id} />
              <button
                className="btn btn-ghost"
                style={{ color: "var(--neg)" }}
                type="submit"
              >
                Delete offer box
              </button>
            </form>
          </div>
        </Card>
      </div>
    </>
  );
}
