/**
 * Phase 2 Task 16: god-only advertisers list.
 *
 * Joins each advertiser to their intake row for business name display, and
 * pre-aggregates campaign counts so the table renders without a per-row N+1.
 *
 * Filters are URL-driven (`?status=pending|approved|frozen|suspended`) so the
 * page is fully bookmark-/share-friendly and avoids client-side state.
 */
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import {
  advertiserCampaigns,
  advertiserIntake,
  advertisers,
} from "@/src/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { PageHeader, Card, Badge, Table, Tr, Td } from "@/app/_ui/primitives";

type StatusFilter = "all" | "pending" | "approved" | "frozen" | "suspended";

const usd = (cents: number) => "$" + (cents / 100).toFixed(2);

function statusTone(s: string): "neutral" | "pos" | "neg" | "warn" | "accent" {
  if (s === "approved") return "pos";
  if (s === "pending") return "warn";
  if (s === "frozen") return "neutral";
  if (s === "suspended") return "neg";
  return "neutral";
}

export default async function AdvertisersListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAuth(["god"]);
  const { status: rawStatus } = await searchParams;
  const status: StatusFilter = (
    ["all", "pending", "approved", "frozen", "suspended"] as const
  ).includes(rawStatus as StatusFilter)
    ? (rawStatus as StatusFilter)
    : "all";

  // Pre-aggregate campaign counts per advertiser so we don't N+1 from the table.
  const counts = await db
    .select({
      advertiserId: advertiserCampaigns.advertiserId,
      c: sql<number>`count(*)::int`,
    })
    .from(advertiserCampaigns)
    .groupBy(advertiserCampaigns.advertiserId);
  const countMap = new Map<string, number>(counts.map((r) => [r.advertiserId, Number(r.c)]));

  const rows = await db
    .select({
      id: advertisers.id,
      email: advertisers.email,
      status: advertisers.status,
      walletBalanceCents: advertisers.walletBalanceCents,
      displayName: advertisers.displayName,
      createdAt: advertisers.createdAt,
      businessName: advertiserIntake.businessName,
    })
    .from(advertisers)
    .leftJoin(advertiserIntake, eq(advertiserIntake.advertiserId, advertisers.id))
    .orderBy(desc(advertisers.createdAt));

  const filtered = status === "all" ? rows : rows.filter((r) => r.status === status);

  const tabs: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "frozen", label: "Frozen" },
    { value: "suspended", label: "Suspended" },
  ];

  const pendingCount = rows.filter((r) => r.status === "pending").length;

  return (
    <>
      <PageHeader
        title="Advertisers"
        subtitle={`${rows.length} advertisers in the marketplace.`}
        actions={
          <a className="btn btn-ghost" href="/admin/advertisers/pending">
            Pending queue ({pendingCount})
          </a>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <a
            key={t.value}
            href={t.value === "all" ? "/admin/advertisers" : `/admin/advertisers?status=${t.value}`}
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: status === t.value ? "var(--color-accent)" : "var(--surface-2)",
              color: status === t.value ? "#fff" : "var(--ink-2)",
            }}
          >
            {t.label}
          </a>
        ))}
      </div>

      <Card pad={false}>
        {filtered.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--muted)" }}>
            No advertisers {status === "all" ? "yet" : `with status "${status}"`}.
          </div>
        ) : (
          <Table head={["Email", "Business", "Status", "Wallet", "Campaigns", "Created", ""]}>
            {filtered.map((r) => (
              <Tr key={r.id}>
                <Td>
                  <div className="font-medium">{r.email}</div>
                  {r.displayName && (
                    <div className="text-xs" style={{ color: "var(--muted-2)" }}>{r.displayName}</div>
                  )}
                </Td>
                <Td>
                  <span className="text-sm">{r.businessName ?? "—"}</span>
                </Td>
                <Td>
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                </Td>
                <Td className="font-semibold tabular-nums">{usd(r.walletBalanceCents)}</Td>
                <Td className="tabular-nums">{countMap.get(r.id) ?? 0}</Td>
                <Td>
                  <span className="text-xs" style={{ color: "var(--muted-2)" }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </Td>
                <Td>
                  <div className="flex justify-end">
                    <a
                      className="btn btn-ghost"
                      href={`/admin/advertisers/${r.id}`}
                      style={{ padding: "6px 10px" }}
                    >
                      View
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
