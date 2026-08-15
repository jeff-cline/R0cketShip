/**
 * Phase 2 Task 16: pending advertiser queue.
 *
 * One-click approve / reject directly from the row. Approve cascades to that
 * advertiser's pending campaigns when `god_auto_approve_campaigns` is on
 * (handled inside the server action).
 */
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { advertiserIntake, advertisers } from "@/src/db/schema";
import { desc, eq } from "drizzle-orm";
import { PageHeader, Card, Table, Tr, Td } from "@/app/_ui/primitives";
import { approveAdvertiserAction, rejectAdvertiserAction } from "../actions";

export default async function PendingAdvertisersPage() {
  await requireAuth(["god"]);

  const rows = await db
    .select({
      id: advertisers.id,
      email: advertisers.email,
      displayName: advertisers.displayName,
      createdAt: advertisers.createdAt,
      businessName: advertiserIntake.businessName,
      businessUrl: advertiserIntake.businessUrl,
      industry: advertiserIntake.industry,
      monthlyBudget: advertiserIntake.monthlyAdBudgetCents,
    })
    .from(advertisers)
    .leftJoin(advertiserIntake, eq(advertiserIntake.advertiserId, advertisers.id))
    .where(eq(advertisers.status, "pending"))
    .orderBy(desc(advertisers.createdAt));

  return (
    <>
      <PageHeader
        title="Pending advertisers"
        subtitle={`${rows.length} awaiting review.`}
        actions={
          <a className="btn btn-ghost" href="/admin/advertisers">
            ← All advertisers
          </a>
        }
      />

      <Card pad={false}>
        {rows.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--muted)" }}>
            Nothing pending. Inbox zero.
          </div>
        ) : (
          <Table
            head={["Email", "Business", "Industry", "Monthly budget", "Submitted", ""]}
          >
            {rows.map((r) => (
              <Tr key={r.id}>
                <Td>
                  <a
                    href={`/admin/advertisers/${r.id}`}
                    className="font-medium"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {r.email}
                  </a>
                  {r.displayName && (
                    <div className="text-xs" style={{ color: "var(--muted-2)" }}>{r.displayName}</div>
                  )}
                </Td>
                <Td>
                  <div className="text-sm">{r.businessName ?? "—"}</div>
                  {r.businessUrl && (
                    <a
                      href={r.businessUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs"
                      style={{ color: "var(--muted-2)" }}
                    >
                      {r.businessUrl} ↗
                    </a>
                  )}
                </Td>
                <Td>
                  <span className="text-sm" style={{ color: "var(--muted)" }}>{r.industry ?? "—"}</span>
                </Td>
                <Td className="tabular-nums">
                  {r.monthlyBudget ? "$" + Math.round(r.monthlyBudget / 100).toLocaleString() : "—"}
                </Td>
                <Td>
                  <span className="text-xs" style={{ color: "var(--muted-2)" }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </Td>
                <Td>
                  <div className="flex justify-end gap-2">
                    <form action={approveAdvertiserAction}>
                      <input type="hidden" name="advertiserId" value={r.id} />
                      <button className="btn btn-primary" style={{ padding: "6px 10px" }}>
                        Approve
                      </button>
                    </form>
                    <form action={rejectAdvertiserAction}>
                      <input type="hidden" name="advertiserId" value={r.id} />
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
