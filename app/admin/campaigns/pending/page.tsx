/**
 * Phase 2 Task 16: cross-advertiser pending campaign queue.
 *
 * Shows every campaign in `pending` status, regardless of advertiser. The
 * approve/reject server actions live in `app/admin/advertisers/actions.ts`
 * so all god-level approval logic stays in one place.
 */
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { advertiserCampaigns, advertisers } from "@/src/db/schema";
import { desc, eq } from "drizzle-orm";
import { PageHeader, Card, Table, Tr, Td } from "@/app/_ui/primitives";
import type { TargetingFilters } from "@/src/advertiser/targeting";
import {
  approveCampaignAction,
  rejectCampaignAction,
} from "../../advertisers/actions";

const usd = (cents: number) => "$" + (cents / 100).toFixed(2);

function targetingSummary(t: TargetingFilters): string {
  const bits: string[] = [];
  if (t.zip?.length) bits.push(`${t.zip.length} ZIPs`);
  if (t.segments?.length) bits.push(t.segments.join("/"));
  if (t.age_tiers?.length) bits.push(t.age_tiers.join("/"));
  if (t.niches?.length) bits.push(`${t.niches.length} niches`);
  if (t.income_min || t.income_max) {
    bits.push(`income ${t.income_min ?? "—"}-${t.income_max ?? "—"}`);
  }
  return bits.length ? bits.join(" · ") : "No filters (broad)";
}

export default async function PendingCampaignsPage() {
  await requireAuth(["god"]);

  const rows = await db
    .select({
      id: advertiserCampaigns.id,
      name: advertiserCampaigns.name,
      maxCpaCents: advertiserCampaigns.maxCpaCents,
      targetingFilters: advertiserCampaigns.targetingFilters,
      createdAt: advertiserCampaigns.createdAt,
      advertiserId: advertiserCampaigns.advertiserId,
      advertiserEmail: advertisers.email,
    })
    .from(advertiserCampaigns)
    .innerJoin(advertisers, eq(advertisers.id, advertiserCampaigns.advertiserId))
    .where(eq(advertiserCampaigns.status, "pending"))
    .orderBy(desc(advertiserCampaigns.createdAt));

  return (
    <>
      <PageHeader
        title="Pending campaigns"
        subtitle={`${rows.length} campaigns awaiting review.`}
        actions={
          <a className="btn btn-ghost" href="/admin/advertisers">
            All advertisers
          </a>
        }
      />

      <Card pad={false}>
        {rows.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--muted)" }}>
            No campaigns pending. Inbox zero.
          </div>
        ) : (
          <Table head={["Campaign", "Advertiser", "Max CPA", "Targeting", "Created", ""]}>
            {rows.map((r) => (
              <Tr key={r.id}>
                <Td>
                  <a
                    href={`/admin/advertisers/${r.advertiserId}/campaigns/${r.id}`}
                    className="font-medium"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {r.name}
                  </a>
                </Td>
                <Td>
                  <a href={`/admin/advertisers/${r.advertiserId}`} className="text-sm">
                    {r.advertiserEmail}
                  </a>
                </Td>
                <Td className="tabular-nums">{usd(r.maxCpaCents)}</Td>
                <Td>
                  <span className="text-xs" style={{ color: "var(--muted-2)" }}>
                    {targetingSummary((r.targetingFilters as TargetingFilters) ?? {})}
                  </span>
                </Td>
                <Td>
                  <span className="text-xs" style={{ color: "var(--muted-2)" }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </Td>
                <Td>
                  <div className="flex justify-end gap-2">
                    <form action={approveCampaignAction}>
                      <input type="hidden" name="campaignId" value={r.id} />
                      <input type="hidden" name="advertiserId" value={r.advertiserId} />
                      <button className="btn btn-primary" style={{ padding: "6px 10px" }}>
                        Approve
                      </button>
                    </form>
                    <form action={rejectCampaignAction}>
                      <input type="hidden" name="campaignId" value={r.id} />
                      <input type="hidden" name="advertiserId" value={r.advertiserId} />
                      <button className="btn btn-ghost" style={{ padding: "6px 10px" }}>
                        Reject
                      </button>
                    </form>
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
