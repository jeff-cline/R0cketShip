/**
 * Offer Box — god-only list page.
 *
 * Shows every configured Offer Box plus its 30-day click count (single GROUP
 * BY against `offer_box_clicks`, no per-row N+1). The "+ New offer box"
 * button takes the user to the create flow.
 *
 * Click counts are scoped to the last 30 days because that's the cadence the
 * partner program / sales team care about; older totals would just inflate
 * boxes that have been around a while.
 */
import { desc, sql } from "drizzle-orm";
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { offerBoxClicks, offerBoxes } from "@/src/db/schema";
import { PageHeader, Card, Badge, Table, Tr, Td } from "@/app/_ui/primitives";

const MODE_LABEL: Record<string, string> = {
  main_only: "Main",
  by_niche: "By niche",
  niche_plus_n: "Niche + N",
  top_n_all: "Top N (all)",
};

const FORMAT_LABEL: Record<string, string> = {
  html: "HTML",
  iframe: "Iframe",
  js: "JS",
  popup: "Popup",
};

export const dynamic = "force-dynamic";

export default async function OfferBoxListPage() {
  await requireAuth(["god"]);

  const boxes = await db.select().from(offerBoxes).orderBy(desc(offerBoxes.createdAt));

  // 30-day click counts per box — one aggregate query, no N+1.
  const clickRows = await db
    .select({
      boxId: offerBoxClicks.offerBoxId,
      c: sql<number>`count(*)::int`,
    })
    .from(offerBoxClicks)
    .where(sql`${offerBoxClicks.createdAt} > now() - interval '30 days'`)
    .groupBy(offerBoxClicks.offerBoxId);
  const clickMap = new Map<string, number>(clickRows.map((r) => [r.boxId, Number(r.c)]));

  return (
    <>
      <PageHeader
        title="Offer Box"
        subtitle="Embeddable offer cards you can drop into any site or email — clicks route back through r0cketship."
        actions={
          <a className="btn btn-primary" href="/admin/offer-box/new">
            + New offer box
          </a>
        }
      />

      <Card pad={false}>
        {boxes.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--muted)" }}>
            No offer boxes yet — create one to start surfacing offers in third-party sites &amp; email.
          </div>
        ) : (
          <Table head={["Name", "Key", "Mode", "Format", "Status", "Clicks 30d", "Created", ""]}>
            {boxes.map((b) => (
              <Tr key={b.id}>
                <Td>
                  <div className="font-medium">{b.name}</div>
                  {b.niches && b.niches.length > 0 && (
                    <div className="text-xs" style={{ color: "var(--muted-2)" }}>
                      {b.niches.join(", ")}
                    </div>
                  )}
                </Td>
                <Td>
                  <code className="text-xs" style={{ color: "var(--ink-2)" }}>
                    {b.key}
                  </code>
                </Td>
                <Td>
                  <Badge tone="neutral">{MODE_LABEL[b.mode] ?? b.mode}</Badge>
                </Td>
                <Td>
                  <Badge tone="neutral">{FORMAT_LABEL[b.format] ?? b.format}</Badge>
                </Td>
                <Td>
                  <Badge tone={b.active ? "pos" : "neutral"}>{b.active ? "active" : "paused"}</Badge>
                </Td>
                <Td className="font-semibold tabular-nums">{(clickMap.get(b.id) ?? 0).toLocaleString()}</Td>
                <Td>
                  <span className="text-xs" style={{ color: "var(--muted-2)" }}>
                    {new Date(b.createdAt).toLocaleDateString()}
                  </span>
                </Td>
                <Td>
                  <div className="flex justify-end">
                    <a
                      className="btn btn-ghost"
                      href={`/admin/offer-box/${b.id}`}
                      style={{ padding: "6px 10px" }}
                    >
                      Edit
                    </a>
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
