/**
 * Campaigns list page — server component.
 *
 * Auth-gated: redirects to /advertise/login if no session.
 * Shows every campaign for the advertiser with stats + status pill + per-row
 * link to the edit page. Empty state nudges new users to create their first flight.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdvertiserContext } from "@/src/auth/advertiser";
import { walletBalance } from "@/src/advertiser/wallet";
import { listCampaigns } from "@/src/advertiser/campaigns";
import { AdvertiserShell } from "@/app/advertise/_layout/AdvertiserShell";

export const metadata: Metadata = {
  title: "Campaigns — Advertise with r0cketship",
};

export const dynamic = "force-dynamic";

const COLORS = {
  bg: "#050608",
  surface: "rgba(255,255,255,0.025)",
  surface2: "rgba(255,255,255,0.04)",
  surface3: "rgba(255,255,255,0.06)",
  ink: "#FFFFFF",
  ink2: "#E5E7EB",
  ink3: "#A1A1AA",
  ink4: "#6B7280",
  accent: "#FF6B35",
  sky: "#0EA5E9",
  violet: "#7C3AED",
  rose: "#F43F5E",
  gray: "#6B7280",
  hairline: "rgba(255,255,255,0.08)",
  hairline2: "rgba(255,255,255,0.16)",
};

function formatUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatInt(n: number): string {
  return n.toLocaleString("en-US");
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Status pill colors per spec:
 *   pending=gray, active=orange, paused=sky, out_of_budget=violet,
 *   rejected/frozen=red.
 */
function statusPill(status: string): { label: string; color: string; bg: string } {
  switch (status) {
    case "active":
      return { label: "Active", color: COLORS.accent, bg: `${COLORS.accent}26` };
    case "paused":
      return { label: "Paused", color: COLORS.sky, bg: `${COLORS.sky}22` };
    case "out_of_budget":
      return { label: "Out of budget", color: COLORS.violet, bg: `${COLORS.violet}22` };
    case "pending":
      return { label: "Pending review", color: COLORS.gray, bg: `${COLORS.gray}22` };
    case "rejected":
      return { label: "Rejected", color: COLORS.rose, bg: `${COLORS.rose}22` };
    case "frozen":
      return { label: "Frozen", color: COLORS.rose, bg: `${COLORS.rose}22` };
    default:
      return { label: status, color: COLORS.ink3, bg: COLORS.surface2 };
  }
}

export default async function CampaignsListPage() {
  const ctx = await getAdvertiserContext();
  if (!ctx) {
    redirect("/advertise/login");
  }
  const advertiser = ctx.advertiser;

  const [balance, campaigns] = await Promise.all([
    walletBalance(advertiser.id),
    listCampaigns(advertiser.id),
  ]);

  return (
    <AdvertiserShell email={advertiser.email} walletBalanceCents={balance}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div
            className="text-xs font-bold uppercase tracking-[0.32em]"
            style={{ color: COLORS.accent }}
          >
            Campaigns
          </div>
          <h1
            className="mt-1 text-3xl font-black md:text-4xl"
            style={{ letterSpacing: "-0.025em" }}
          >
            Every flight you&rsquo;ve launched.
          </h1>
          <p className="mt-2 text-sm" style={{ color: COLORS.ink3 }}>
            Pay only for clicks. Set the CPA. We optimize delivery against your budget.
          </p>
        </div>
        <a
          href="/advertise/campaigns/new"
          className="rounded-full px-5 py-2.5 text-sm font-bold"
          style={{
            background: COLORS.accent,
            color: COLORS.ink,
            boxShadow: `0 12px 32px ${COLORS.accent}40`,
          }}
        >
          + Create campaign
        </a>
      </div>

      {campaigns.length === 0 ? (
        <div
          className="rounded-2xl border p-10 text-center"
          style={{
            borderColor: COLORS.hairline2,
            background: `linear-gradient(180deg, ${COLORS.surface}, ${COLORS.bg})`,
          }}
        >
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: `${COLORS.accent}26`, color: COLORS.accent, fontSize: 22 }}
          >
            ✈
          </div>
          <h3 className="text-2xl font-black" style={{ letterSpacing: "-0.02em" }}>
            No campaigns yet.
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: COLORS.ink3 }}>
            Create your first to start delivering.
          </p>
          <a
            href="/advertise/campaigns/new"
            className="mt-6 inline-flex justify-center rounded-full px-6 py-3 text-base font-bold"
            style={{
              background: COLORS.accent,
              color: COLORS.ink,
              boxShadow: `0 12px 32px ${COLORS.accent}40`,
            }}
          >
            Create your first campaign →
          </a>
        </div>
      ) : (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ borderColor: COLORS.hairline, background: COLORS.surface }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.hairline}` }}>
                  {[
                    { label: "Name", align: "left" },
                    { label: "Status", align: "left" },
                    { label: "CPA", align: "right" },
                    { label: "Sends (today / total)", align: "right" },
                    { label: "Clicks (today / total)", align: "right" },
                    { label: "Spend (today / total)", align: "right" },
                    { label: "Created", align: "right" },
                  ].map((h) => (
                    <th
                      key={h.label}
                      className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider ${
                        h.align === "left" ? "text-left" : "text-right"
                      }`}
                      style={{ color: COLORS.ink3 }}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c, idx) => {
                  const pill = statusPill(c.status);
                  const last = idx === campaigns.length - 1;
                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: last ? "none" : `1px solid ${COLORS.hairline}`,
                      }}
                    >
                      <td className="px-4 py-3 text-left">
                        <a
                          href={`/advertise/campaigns/${c.id}`}
                          className="font-semibold"
                          style={{ color: COLORS.ink }}
                        >
                          {c.name}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-left">
                        <span
                          className="inline-block rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider"
                          style={{ background: pill.bg, color: pill.color }}
                        >
                          {pill.label}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-right tabular-nums"
                        style={{ color: COLORS.ink2 }}
                      >
                        {formatUsd(c.maxCpaCents)}
                      </td>
                      <td
                        className="px-4 py-3 text-right tabular-nums"
                        style={{ color: COLORS.ink2 }}
                      >
                        {formatInt(c.todaySends)}{" "}
                        <span style={{ color: COLORS.ink4 }}>/ {formatInt(c.totalSends)}</span>
                      </td>
                      <td
                        className="px-4 py-3 text-right tabular-nums"
                        style={{ color: COLORS.ink2 }}
                      >
                        {formatInt(c.todayClicks)}{" "}
                        <span style={{ color: COLORS.ink4 }}>/ {formatInt(c.totalClicks)}</span>
                      </td>
                      <td
                        className="px-4 py-3 text-right tabular-nums font-semibold"
                        style={{ color: COLORS.ink }}
                      >
                        {formatUsd(c.todaySpendCents)}{" "}
                        <span style={{ color: COLORS.ink4, fontWeight: 400 }}>
                          / {formatUsd(c.totalSpendCents)}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 text-right tabular-nums"
                        style={{ color: COLORS.ink3 }}
                      >
                        {formatDate(c.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdvertiserShell>
  );
}
