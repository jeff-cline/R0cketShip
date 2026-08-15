/**
 * Campaign edit + stats page — server component.
 *
 * - Auth-gates. Resolves the campaign and 404s if not owned by the advertiser
 *   (we never leak existence across advertisers).
 * - Renders status pill + pause/resume controls + stats card + the shared
 *   <CampaignForm/> with the campaign's values prefilled.
 */
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getAdvertiserContext } from "@/src/auth/advertiser";
import { walletBalance } from "@/src/advertiser/wallet";
import { getCampaign } from "@/src/advertiser/campaigns";
import type { TargetingFilters } from "@/src/advertiser/targeting";
import { AdvertiserShell } from "@/app/advertise/_layout/AdvertiserShell";
import { CampaignForm } from "@/app/advertise/campaigns/_components/CampaignForm";
import { listNiches, US_STATES } from "@/src/advertiser/catalog";
import {
  updateCampaignAction,
  pauseCampaignAction,
  resumeCampaignAction,
  sendCampaignTestEmailAction,
} from "@/app/advertise/campaigns/actions";

export const metadata: Metadata = {
  title: "Edit campaign — Advertise with r0cketship",
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

export default async function CampaignEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; test?: string; reason?: string }>;
}) {
  const ctx = await getAdvertiserContext();
  if (!ctx) {
    redirect("/advertise/login");
  }
  const { id } = await params;
  const sp = await searchParams;

  const [campaign, balance] = await Promise.all([
    getCampaign(id),
    walletBalance(ctx.advertiser.id),
  ]);

  // 404 if the campaign doesn't exist OR belongs to another advertiser.
  // We don't differentiate — that would leak existence across accounts.
  if (!campaign || campaign.advertiserId !== ctx.advertiser.id) {
    notFound();
  }

  const pill = statusPill(campaign.status);
  const filters = (campaign.targetingFilters ?? {}) as TargetingFilters;

  // Bind the server action to this campaign id. The action expects (id, formData);
  // we partially apply id here so the form just hands it the FormData.
  const onUpdate = updateCampaignAction.bind(null, campaign.id);
  const onPause = pauseCampaignAction.bind(null, campaign.id);
  const onResume = resumeCampaignAction.bind(null, campaign.id);
  const onTestSend = sendCampaignTestEmailAction.bind(null, campaign.id);

  const cpaActualCents =
    campaign.totalClicks > 0
      ? Math.round(campaign.totalSpendCents / campaign.totalClicks)
      : null;

  const canPause = campaign.status === "active";
  const canResume =
    campaign.status === "paused" || campaign.status === "out_of_budget";

  return (
    <AdvertiserShell email={ctx.advertiser.email} walletBalanceCents={balance}>
      <div className="mb-6">
        <a
          href="/advertise/campaigns"
          className="text-xs font-bold uppercase tracking-[0.32em]"
          style={{ color: COLORS.accent }}
        >
          ← Campaigns
        </a>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1
            className="text-3xl font-black md:text-4xl"
            style={{ letterSpacing: "-0.025em" }}
          >
            {campaign.name}
          </h1>
          <span
            className="inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
            style={{ background: pill.bg, color: pill.color }}
          >
            {pill.label}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {canPause && (
            <form action={onPause}>
              <button
                type="submit"
                className="rounded-full border px-4 py-1.5 text-xs font-bold"
                style={{
                  borderColor: COLORS.hairline2,
                  background: COLORS.surface2,
                  color: COLORS.ink2,
                }}
              >
                Pause
              </button>
            </form>
          )}
          {canResume && (
            <form action={onResume}>
              <button
                type="submit"
                className="rounded-full px-4 py-1.5 text-xs font-bold"
                style={{ background: COLORS.accent, color: COLORS.ink }}
              >
                Resume
              </button>
            </form>
          )}
          <form action={onTestSend}>
            <button
              type="submit"
              className="rounded-full border px-4 py-1.5 text-xs font-bold"
              style={{
                borderColor: COLORS.sky,
                background: "rgba(14,165,233,0.10)",
                color: COLORS.sky,
              }}
              title="Send a preview to your signup email (CCs the founder for QA)"
            >
              Send test email
            </button>
          </form>
        </div>
        {sp?.test === "sent" && (
          <div
            className="mt-3 rounded-lg border px-3 py-2 text-xs"
            style={{ borderColor: "rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.08)", color: "#10B981" }}
          >
            Test sent. Check your inbox.
          </div>
        )}
        {sp?.test === "failed" && (
          <div
            className="mt-3 rounded-lg border px-3 py-2 text-xs"
            style={{ borderColor: "rgba(244,63,94,0.4)", background: "rgba(244,63,94,0.08)", color: COLORS.rose }}
          >
            Test send failed: {sp?.reason ?? "unknown"}
          </div>
        )}
        {sp?.test === "skipped" && (
          <div
            className="mt-3 rounded-lg border px-3 py-2 text-xs"
            style={{ borderColor: "rgba(251,191,36,0.4)", background: "rgba(251,191,36,0.08)", color: "#FBBF24" }}
          >
            Test send skipped: {sp?.reason ?? "no mailbox capacity"}
          </div>
        )}
      </div>

      {/* Stats card */}
      <div
        className="mb-8 grid grid-cols-2 gap-3 rounded-2xl border p-5 md:grid-cols-4"
        style={{ borderColor: COLORS.hairline, background: COLORS.surface }}
      >
        <Stat label="Sends · today" value={formatInt(campaign.todaySends)} sub={`${formatInt(campaign.totalSends)} total`} color={COLORS.sky} />
        <Stat label="Clicks · today" value={formatInt(campaign.todayClicks)} sub={`${formatInt(campaign.totalClicks)} total`} color={COLORS.accent} />
        <Stat label="Spend · today" value={formatUsd(campaign.todaySpendCents)} sub={`${formatUsd(campaign.totalSpendCents)} total`} color={COLORS.ink} />
        <Stat
          label="CPA · actual"
          value={cpaActualCents == null ? "—" : formatUsd(cpaActualCents)}
          sub={`Max ${formatUsd(campaign.maxCpaCents)}`}
          color={COLORS.violet}
        />
      </div>

      <CampaignForm
        action={onUpdate}
        mode="edit"
        submitLabel="Save changes"
        error={sp?.error}
        saved={sp?.saved === "1"}
        availableNiches={await listNiches()}
        usStates={US_STATES}
        initial={{
          name: campaign.name,
          emailSubject: campaign.emailSubject,
          emailBodyHtml: campaign.emailBodyHtml,
          ctaUrl: campaign.ctaUrl,
          ctaLabel: campaign.ctaLabel,
          maxCpaDollars: (campaign.maxCpaCents / 100).toFixed(2),
          dailyBudgetDollars:
            campaign.dailyBudgetCents != null
              ? (campaign.dailyBudgetCents / 100).toFixed(2)
              : "",
          filters,
        }}
      />
    </AdvertiserShell>
  );
}

function Stat({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: COLORS.hairline, background: COLORS.surface2 }}
    >
      <div
        className="text-[11px] font-bold uppercase tracking-wider"
        style={{ color: COLORS.ink3 }}
      >
        {label}
      </div>
      <div
        className="mt-1 text-2xl font-black tabular-nums"
        style={{ color, letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
      <div className="mt-1 text-[11px]" style={{ color: COLORS.ink4 }}>
        {sub}
      </div>
    </div>
  );
}
