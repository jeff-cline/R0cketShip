/**
 * Advertiser dashboard — server component.
 *
 * - Requires an authenticated advertiser; bounces to /advertise/login otherwise.
 * - Pulls wallet balance, campaign count, today aggregates, and the 5 most
 *   recent campaigns. Renders inside <AdvertiserShell />.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getAdvertiserContext } from "@/src/auth/advertiser";
import { walletBalance } from "@/src/advertiser/wallet";
import { db } from "@/src/db/client";
import { advertiserCampaigns } from "@/src/db/schema";
import { AdvertiserShell } from "@/app/advertise/_layout/AdvertiserShell";

export const metadata: Metadata = {
  title: "Dashboard — Advertise with r0cketship",
};

export const dynamic = "force-dynamic";

const COLORS = {
  bg: "#050608",
  surface: "rgba(255,255,255,0.025)",
  surface2: "rgba(255,255,255,0.04)",
  ink: "#FFFFFF",
  ink2: "#E5E7EB",
  ink3: "#A1A1AA",
  ink4: "#6B7280",
  accent: "#FF6B35",
  sky: "#0EA5E9",
  success: "#10B981",
  gold: "#FBBF24",
  violet: "#7C3AED",
  rose: "#F43F5E",
  hairline: "rgba(255,255,255,0.08)",
  hairline2: "rgba(255,255,255,0.16)",
};

const ACTIVE_STATUSES = ["active", "paused", "out_of_budget"] as const;

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

function statusPill(status: string): { label: string; color: string; bg: string } {
  switch (status) {
    case "active":
      return { label: "Active", color: COLORS.success, bg: `${COLORS.success}22` };
    case "paused":
      return { label: "Paused", color: COLORS.gold, bg: `${COLORS.gold}22` };
    case "out_of_budget":
      return { label: "Out of budget", color: COLORS.rose, bg: `${COLORS.rose}22` };
    case "pending":
      return { label: "Pending review", color: COLORS.sky, bg: `${COLORS.sky}22` };
    case "rejected":
      return { label: "Rejected", color: COLORS.rose, bg: `${COLORS.rose}22` };
    case "frozen":
      return { label: "Frozen", color: COLORS.ink3, bg: COLORS.surface2 };
    default:
      return { label: status, color: COLORS.ink3, bg: COLORS.surface2 };
  }
}

export default async function AdvertiserDashboardPage() {
  const ctx = await getAdvertiserContext();
  if (!ctx) {
    redirect("/advertise/login");
  }
  const advertiser = ctx.advertiser;

  // Wallet + active campaign count + today aggregates run in parallel.
  const [balance, activeCountRows, todayRows, recent] = await Promise.all([
    walletBalance(advertiser.id),
    db
      .select({ count: sql<string>`COUNT(*)` })
      .from(advertiserCampaigns)
      .where(
        and(
          eq(advertiserCampaigns.advertiserId, advertiser.id),
          inArray(advertiserCampaigns.status, [...ACTIVE_STATUSES]),
        ),
      ),
    db
      .select({
        sends: sql<string>`COALESCE(SUM(${advertiserCampaigns.todaySends}), 0)`,
        clicks: sql<string>`COALESCE(SUM(${advertiserCampaigns.todayClicks}), 0)`,
        spend: sql<string>`COALESCE(SUM(${advertiserCampaigns.todaySpendCents}), 0)`,
      })
      .from(advertiserCampaigns)
      .where(eq(advertiserCampaigns.advertiserId, advertiser.id)),
    db
      .select({
        id: advertiserCampaigns.id,
        name: advertiserCampaigns.name,
        status: advertiserCampaigns.status,
        todaySends: advertiserCampaigns.todaySends,
        todayClicks: advertiserCampaigns.todayClicks,
        todaySpendCents: advertiserCampaigns.todaySpendCents,
      })
      .from(advertiserCampaigns)
      .where(eq(advertiserCampaigns.advertiserId, advertiser.id))
      .orderBy(desc(advertiserCampaigns.createdAt))
      .limit(5),
  ]);

  const activeCount = Number(activeCountRows[0]?.count ?? 0);
  const todaySends = Number(todayRows[0]?.sends ?? 0);
  const todayClicks = Number(todayRows[0]?.clicks ?? 0);
  const todaySpend = Number(todayRows[0]?.spend ?? 0);
  const greetingName = advertiser.displayName?.trim() || advertiser.email;

  const stats: Array<{ label: string; value: string; sub: string; color: string }> = [
    {
      label: "Wallet balance",
      value: formatUsd(balance),
      sub: balance > 0 ? "Available to spend" : "Add funds to launch",
      color: COLORS.accent,
    },
    {
      label: "Active campaigns",
      value: formatInt(activeCount),
      sub:
        activeCount === 0
          ? "Zero running today"
          : `${activeCount === 1 ? "1 flight" : `${activeCount} flights`} in market`,
      color: COLORS.sky,
    },
    {
      label: "Sends today",
      value: formatInt(todaySends),
      sub: "Across all campaigns",
      color: COLORS.success,
    },
    {
      label: "Clicks today",
      value: formatInt(todayClicks),
      sub: `${formatUsd(todaySpend)} spent`,
      color: COLORS.gold,
    },
  ];

  return (
    <AdvertiserShell email={advertiser.email} walletBalanceCents={balance}>
      {/* Greeting */}
      <div className="mb-8">
        <div
          className="text-xs font-bold uppercase tracking-[0.32em]"
          style={{ color: COLORS.accent }}
        >
          Advertiser console
        </div>
        <h1
          className="mt-1 text-3xl font-black md:text-4xl"
          style={{ letterSpacing: "-0.025em" }}
        >
          Welcome back, {greetingName}.
        </h1>
        <p className="mt-2 text-sm" style={{ color: COLORS.ink3 }}>
          Forward and upward only — here&rsquo;s how today is shaping up.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border p-5"
            style={{
              borderColor: COLORS.hairline,
              background: COLORS.surface2,
            }}
          >
            <div
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: COLORS.ink3 }}
            >
              {s.label}
            </div>
            <div
              className="mt-1.5 text-3xl font-black"
              style={{ color: s.color, letterSpacing: "-0.02em" }}
            >
              {s.value}
            </div>
            <div className="mt-1 text-xs" style={{ color: COLORS.ink4 }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Your campaigns */}
      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2
              className="text-2xl font-black md:text-3xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              Your campaigns
            </h2>
            <p className="mt-1 text-sm" style={{ color: COLORS.ink3 }}>
              Your five most recent flights.
            </p>
          </div>
          {recent.length > 0 && (
            <a
              href="/advertise/campaigns/new"
              className="rounded-full px-4 py-2 text-sm font-bold"
              style={{ background: COLORS.accent, color: COLORS.ink }}
            >
              New campaign →
            </a>
          )}
        </div>

        {recent.length === 0 ? (
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
            <h3
              className="text-2xl font-black"
              style={{ letterSpacing: "-0.02em" }}
            >
              No campaigns yet.
            </h3>
            <p
              className="mx-auto mt-2 max-w-md text-sm"
              style={{ color: COLORS.ink3 }}
            >
              You have <strong style={{ color: COLORS.accent }}>{formatUsd(balance)}</strong> in your wallet.
              Launch your first flight and start paying only for success.
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
            style={{
              borderColor: COLORS.hairline,
              background: COLORS.surface,
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${COLORS.hairline}` }}>
                    {[
                      "Campaign",
                      "Status",
                      "Sends today",
                      "Clicks today",
                      "Spend today",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider ${
                          i === 0 ? "text-left" : "text-right"
                        }`}
                        style={{ color: COLORS.ink3 }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((c, idx) => {
                    const pill = statusPill(c.status);
                    return (
                      <tr
                        key={c.id}
                        style={{
                          borderBottom:
                            idx === recent.length - 1
                              ? "none"
                              : `1px solid ${COLORS.hairline}`,
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
                        <td className="px-4 py-3 text-right">
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
                          {formatInt(c.todaySends)}
                        </td>
                        <td
                          className="px-4 py-3 text-right tabular-nums"
                          style={{ color: COLORS.ink2 }}
                        >
                          {formatInt(c.todayClicks)}
                        </td>
                        <td
                          className="px-4 py-3 text-right tabular-nums font-semibold"
                          style={{ color: COLORS.ink }}
                        >
                          {formatUsd(c.todaySpendCents)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Need ideas footer */}
      <section className="mt-12">
        <div
          className="rounded-xl border px-5 py-4 text-sm flex flex-wrap items-center justify-between gap-3"
          style={{
            borderColor: COLORS.hairline,
            background: COLORS.surface2,
            color: COLORS.ink3,
          }}
        >
          <span>
            Need ideas? Re-read{" "}
            <a
              href="/advertise"
              className="font-semibold"
              style={{ color: COLORS.accent }}
            >
              why r0cketship is built for this moment
            </a>
            .
          </span>
          <a
            href="/advertise"
            className="rounded-full border px-3 py-1.5 text-xs font-semibold"
            style={{ borderColor: COLORS.hairline2, color: COLORS.ink2 }}
          >
            Open the pitch →
          </a>
        </div>
      </section>
    </AdvertiserShell>
  );
}
