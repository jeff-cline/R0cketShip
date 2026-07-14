/**
 * Phase 2 Task 16: read-only campaign detail under an advertiser.
 *
 * Shows the full creative, targeting filters, recent send/click activity, and
 * basic stats. No mutations from this page — those live on the advertiser
 * detail (approve/reject pending) or in /admin/campaigns/pending.
 */
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import {
  advertiserCampaigns,
  advertiserClickEvents,
  advertiserSendEvents,
  advertisers,
} from "@/src/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  PageHeader,
  Card,
  SectionTitle,
  StatCard,
  Badge,
  Table,
  Tr,
  Td,
} from "@/app/_ui/primitives";
import type { TargetingFilters } from "@/src/advertiser/targeting";

const usd = (cents: number) => "$" + (cents / 100).toFixed(2);

function statusTone(s: string): "neutral" | "pos" | "neg" | "warn" | "accent" {
  if (s === "active") return "pos";
  if (s === "pending") return "warn";
  if (s === "paused" || s === "out_of_budget" || s === "frozen") return "neutral";
  if (s === "rejected") return "neg";
  return "neutral";
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string; campaignId: string }>;
}) {
  await requireAuth(["god"]);
  const { id, campaignId } = await params;

  const camp = (
    await db
      .select()
      .from(advertiserCampaigns)
      .where(eq(advertiserCampaigns.id, campaignId))
      .limit(1)
  )[0];
  if (!camp || camp.advertiserId !== id) notFound();

  const adv = (
    await db.select({ email: advertisers.email }).from(advertisers).where(eq(advertisers.id, id)).limit(1)
  )[0];

  const recentSendsRows = await db
    .select({
      id: advertiserSendEvents.id,
      sentAt: advertiserSendEvents.sentAt,
      leadId: advertiserSendEvents.leadId,
    })
    .from(advertiserSendEvents)
    .where(eq(advertiserSendEvents.campaignId, campaignId))
    .orderBy(desc(advertiserSendEvents.sentAt))
    .limit(25);

  const recentClicksRows = await db
    .select({
      id: advertiserClickEvents.id,
      clickedAt: advertiserClickEvents.clickedAt,
      chargeCents: advertiserClickEvents.chargeCents,
    })
    .from(advertiserClickEvents)
    .where(eq(advertiserClickEvents.campaignId, campaignId))
    .orderBy(desc(advertiserClickEvents.clickedAt))
    .limit(25);

  const totalClicksRow = (
    await db
      .select({ c: sql<number>`count(*)::int` })
      .from(advertiserClickEvents)
      .where(eq(advertiserClickEvents.campaignId, campaignId))
  )[0];

  const targeting = (camp.targetingFilters as TargetingFilters) ?? {};

  return (
    <>
      <PageHeader
        title={camp.name}
        subtitle={adv?.email ?? "Campaign"}
        actions={
          <a className="btn btn-ghost" href={`/admin/advertisers/${id}`}>
            ← Back to advertiser
          </a>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Status" value={camp.status} />
        <StatCard label="Max CPA" value={usd(camp.maxCpaCents)} accent />
        <StatCard label="Total sends" value={camp.totalSends.toLocaleString()} />
        <StatCard
          label="Total clicks"
          value={(Number(totalClicksRow?.c ?? 0) || camp.totalClicks).toLocaleString()}
          sub={`Spend ${usd(camp.totalSpendCents)}`}
        />
      </div>

      <Card className="mb-6">
        <SectionTitle>Overview</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Row label="Status" value={<Badge tone={statusTone(camp.status)}>{camp.status}</Badge>} />
          <Row label="Daily budget" value={camp.dailyBudgetCents ? usd(camp.dailyBudgetCents) : "—"} />
          <Row label="Today sends" value={camp.todaySends.toLocaleString()} />
          <Row label="Today clicks" value={camp.todayClicks.toLocaleString()} />
          <Row label="Today spend" value={usd(camp.todaySpendCents)} />
          <Row label="Created" value={new Date(camp.createdAt).toLocaleString()} />
          <Row
            label="Approved"
            value={camp.approvedAt ? new Date(camp.approvedAt).toLocaleString() : "—"}
          />
        </div>
      </Card>

      <Card className="mb-6">
        <SectionTitle>Creative</SectionTitle>
        <div className="grid gap-4">
          <Row label="Subject" value={camp.emailSubject} />
          <Row
            label="CTA"
            value={
              <span>
                <span className="chip">{camp.ctaLabel}</span>{" "}
                <a
                  href={camp.ctaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm"
                  style={{ color: "var(--color-accent)" }}
                >
                  {camp.ctaUrl} ↗
                </a>
              </span>
            }
          />
          <div>
            <div className="label">Body (sanitized HTML)</div>
            <div
              className="mt-2 rounded-[var(--radius-lg)] border p-4 text-sm"
              style={{ borderColor: "var(--line)", background: "var(--surface-2)" }}
            >
              <pre className="whitespace-pre-wrap break-words" style={{ color: "var(--ink-2)" }}>
                {camp.emailBodyHtml}
              </pre>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <SectionTitle>Targeting</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Row label="ZIPs" value={targeting.zip?.length ? targeting.zip.join(", ") : "Any"} />
          <Row
            label="Segments"
            value={targeting.segments?.length ? targeting.segments.join(", ") : "Any"}
          />
          <Row
            label="Age tiers"
            value={targeting.age_tiers?.length ? targeting.age_tiers.join(", ") : "Any"}
          />
          <Row label="Niches" value={targeting.niches?.length ? targeting.niches.join(", ") : "Any"} />
          <Row
            label="Income range"
            value={
              targeting.income_min || targeting.income_max
                ? `${targeting.income_min ?? "—"} → ${targeting.income_max ?? "—"}`
                : "Any"
            }
          />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>Recent sends (25)</SectionTitle>
          {recentSendsRows.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>No sends yet.</p>
          ) : (
            <Table head={["When", "Lead"]}>
              {recentSendsRows.map((r) => (
                <Tr key={r.id}>
                  <Td>
                    <span className="text-xs" style={{ color: "var(--muted-2)" }}>
                      {new Date(r.sentAt).toLocaleString()}
                    </span>
                  </Td>
                  <Td>
                    <span className="font-mono text-xs">{r.leadId.slice(0, 8)}…</span>
                  </Td>
                </Tr>
              ))}
            </Table>
          )}
        </Card>

        <Card>
          <SectionTitle>Recent clicks (25)</SectionTitle>
          {recentClicksRows.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>No clicks yet.</p>
          ) : (
            <Table head={["When", "Charge"]}>
              {recentClicksRows.map((r) => (
                <Tr key={r.id}>
                  <Td>
                    <span className="text-xs" style={{ color: "var(--muted-2)" }}>
                      {new Date(r.clickedAt).toLocaleString()}
                    </span>
                  </Td>
                  <Td className="tabular-nums">{usd(r.chargeCents)}</Td>
                </Tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}
