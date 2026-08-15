/**
 * Phase 2 Task 16: marketplace settings (god only).
 *
 * Two toggles control the auto-approve behavior for the advertising
 * marketplace; both live on the r0cketship.com tenant row. The stats below
 * are quick situational awareness — they intentionally don't try to be a
 * full reporting dashboard (that lives on /admin/insights and the
 * advertiser-side analytics).
 *
 * Pool revenue split = the percentage of recent sends that came from tenant
 * outreach vs advertiser ads. Useful to gauge how much of the email pool
 * advertisers are consuming. Window = trailing 30 days.
 */
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import {
  advertiserCampaigns,
  advertiserLedger,
  advertiserSendEvents,
  advertisers,
  outreachQueue,
  tenantIntegrations,
  tenants,
} from "@/src/db/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { PageHeader, Card, SectionTitle, StatCard, Badge, Table, Tr, Td } from "@/app/_ui/primitives";
import { saveMarketplaceSettingsAction } from "./actions";

const usd = (cents: number) => "$" + (cents / 100).toFixed(2);

export default async function MarketplaceSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  await requireAuth(["god"]);
  const { ok, err } = await searchParams;

  const root = (
    await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.domain, "r0cketship.com"))
      .limit(1)
  )[0];

  // Reasonable defaults — both auto-approve are ON when there's no settings row.
  let autoApproveAdvertisers = true;
  let autoApproveCampaigns = true;
  let ccFounderEmail = "jeff.cline@me.com";
  let defaultLander = "https://r0cketship.com/trending";
  if (root) {
    const settings = (
      await db
        .select({
          godAutoApproveAdvertisers: tenantIntegrations.godAutoApproveAdvertisers,
          godAutoApproveCampaigns: tenantIntegrations.godAutoApproveCampaigns,
          marketplaceCcFounderEmail: tenantIntegrations.marketplaceCcFounderEmail,
          marketplaceDefaultLander: tenantIntegrations.marketplaceDefaultLander,
        })
        .from(tenantIntegrations)
        .where(eq(tenantIntegrations.tenantId, root.id))
        .limit(1)
    )[0];
    if (settings) {
      autoApproveAdvertisers = settings.godAutoApproveAdvertisers;
      autoApproveCampaigns = settings.godAutoApproveCampaigns;
      ccFounderEmail = settings.marketplaceCcFounderEmail ?? "";
      defaultLander = settings.marketplaceDefaultLander ?? defaultLander;
    }
  }

  // ---- Stats ----
  const sinceCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const activeAdvertisersRow = (
    await db
      .select({ c: sql<number>`count(*)::int` })
      .from(advertisers)
      .where(eq(advertisers.status, "approved"))
  )[0];

  const activeCampaignsRow = (
    await db
      .select({ c: sql<number>`count(*)::int` })
      .from(advertiserCampaigns)
      .where(eq(advertiserCampaigns.status, "active"))
  )[0];

  const tenantOutreachRow = (
    await db
      .select({ c: sql<number>`count(*)::int` })
      .from(outreachQueue)
      .where(and(eq(outreachQueue.status, "sent"), gte(outreachQueue.sentAt, sinceCutoff)))
  )[0];

  const advertiserSendsRow = (
    await db
      .select({ c: sql<number>`count(*)::int` })
      .from(advertiserSendEvents)
      .where(gte(advertiserSendEvents.sentAt, sinceCutoff))
  )[0];

  const tenantSends = Number(tenantOutreachRow?.c ?? 0);
  const adSends = Number(advertiserSendsRow?.c ?? 0);
  const totalSends = tenantSends + adSends;
  const adSharePct = totalSends > 0 ? Math.round((adSends / totalSends) * 100) : 0;

  // Top 5 advertisers by spend (last 30 days) — spend = abs sum of click_charge
  // ledger rows, which is the authoritative metric.
  const topSpenders = await db
    .select({
      advertiserId: advertiserLedger.advertiserId,
      email: advertisers.email,
      spendCents: sql<number>`coalesce(sum(case when ${advertiserLedger.deltaCents} < 0 then -${advertiserLedger.deltaCents} else 0 end), 0)::int`,
    })
    .from(advertiserLedger)
    .innerJoin(advertisers, eq(advertisers.id, advertiserLedger.advertiserId))
    .where(
      and(
        eq(advertiserLedger.type, "click_charge"),
        gte(advertiserLedger.createdAt, sinceCutoff),
      ),
    )
    .groupBy(advertiserLedger.advertiserId, advertisers.email)
    .orderBy(desc(sql`sum(case when ${advertiserLedger.deltaCents} < 0 then -${advertiserLedger.deltaCents} else 0 end)`))
    .limit(5);

  return (
    <>
      <PageHeader
        title="Marketplace settings"
        subtitle="Auto-approve toggles and platform-wide advertising stats."
      />

      {ok && (
        <div className="mb-4">
          <Card>
            <div className="flex items-center gap-3 text-sm">
              <Badge tone="pos">Saved</Badge>
              <span>Settings updated.</span>
            </div>
          </Card>
        </div>
      )}
      {err && (
        <div className="mb-4">
          <Card>
            <div className="flex items-center gap-3 text-sm" style={{ color: "var(--neg)" }}>
              <Badge tone="neg">Error</Badge>
              <span>{err}</span>
            </div>
          </Card>
        </div>
      )}

      {/* ---- Toggles ---- */}
      <Card className="mb-6">
        <SectionTitle hint="Both default ON — flip off to require manual review.">
          Auto-approve
        </SectionTitle>
        <form action={saveMarketplaceSettingsAction} className="flex flex-col gap-4">
          <ToggleRow
            name="autoApproveAdvertisers"
            label="Auto-approve new advertisers"
            description="When ON, new advertisers move from pending → approved automatically after email verification."
            defaultChecked={autoApproveAdvertisers}
          />
          <ToggleRow
            name="autoApproveCampaigns"
            label="Auto-approve new campaigns"
            description="When ON, newly submitted campaigns activate immediately. Also cascades when an advertiser is approved."
            defaultChecked={autoApproveCampaigns}
          />
          <div className="flex flex-col gap-2 border-t pt-4" style={{ borderColor: "var(--line)" }}>
            <div className="text-sm font-medium">CC the founder on advertiser test sends</div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              When an advertiser clicks &ldquo;Send test email&rdquo; on their campaign, this address is BCC&apos;d for QA visibility.
              Leave blank to disable the CC entirely.
            </div>
            <input
              type="email"
              name="ccFounderEmail"
              defaultValue={ccFounderEmail}
              placeholder="jeff.cline@me.com (leave blank to disable)"
              className="input"
              style={{ maxWidth: 360 }}
            />
          </div>
          <div className="flex flex-col gap-2 border-t pt-4" style={{ borderColor: "var(--line)" }}>
            <div className="text-sm font-medium">Missed clicks default lander</div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              When a tracked click can&rsquo;t be routed cleanly (offer inactive, malformed CTA, tenant frozen),
              the click is logged as a missed opportunity and the visitor is redirected here instead of a 500.
              We monetize those clicks on the lander. Default: <code>https://r0cketship.com/trending</code>.
            </div>
            <input
              type="url"
              name="defaultLander"
              defaultValue={defaultLander}
              placeholder="https://r0cketship.com/trending"
              required
              className="input"
              style={{ maxWidth: 480 }}
            />
          </div>
          <div>
            <button className="btn btn-primary">Save</button>
          </div>
        </form>
      </Card>

      {/* ---- Stats ---- */}
      <SectionTitle>Marketplace stats</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active advertisers"
          value={String(activeAdvertisersRow?.c ?? 0)}
          sub="status = approved"
          accent
        />
        <StatCard
          label="Active campaigns"
          value={String(activeCampaignsRow?.c ?? 0)}
          sub="status = active"
        />
        <StatCard
          label="Tenant sends (30d)"
          value={tenantSends.toLocaleString()}
          sub="outreach_queue"
        />
        <StatCard
          label="Advertiser sends (30d)"
          value={adSends.toLocaleString()}
          sub={`${adSharePct}% of pool`}
        />
      </div>

      <Card className="mt-6">
        <SectionTitle>Top 5 advertisers by spend (last 30 days)</SectionTitle>
        {topSpenders.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>No advertiser spend in the last 30 days.</p>
        ) : (
          <Table head={["#", "Advertiser", "Spend"]}>
            {topSpenders.map((s, i) => (
              <Tr key={s.advertiserId}>
                <Td className="tabular-nums">{i + 1}</Td>
                <Td>
                  <a
                    href={`/admin/advertisers/${s.advertiserId}`}
                    className="font-medium"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {s.email}
                  </a>
                </Td>
                <Td className="font-semibold tabular-nums">{usd(Number(s.spendCents))}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}

function ToggleRow({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label
      className="flex items-start justify-between gap-4 rounded-[var(--radius-lg)] border p-4"
      style={{ borderColor: "var(--line)" }}
    >
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="mt-1 text-xs" style={{ color: "var(--muted)" }}>{description}</div>
      </div>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-5 w-5 shrink-0"
      />
    </label>
  );
}
