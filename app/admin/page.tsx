import { requireAuth } from "@/src/auth/guard";
import { platformEconomics, tenantEconomics, salesTimeSeries } from "@/src/reporting/economics";
import { AreaChart, BarChart } from "@/app/_ui/charts";
import { PageHeader, Card, SectionTitle, StatCard, Table, Tr, Td } from "@/app/_ui/primitives";
import { db } from "@/src/db/client";
import { users, leadDeliveries, leads } from "@/src/db/schema";
import { sql } from "drizzle-orm";
import { openAsWhiteLabelAction } from "./user-actions";

const usd = (n: number) => (n >= 1000 ? "$" + (n / 1000).toFixed(1) + "k" : "$" + n.toFixed(0));
const pct = (n: number) => (n * 100).toFixed(0) + "%";

export default async function AdminPage() {
  const ctx = await requireAuth(["god", "manager"]);
  const isGod = ctx.user.role === "god";

  if (isGod) {
    const { totals, byTenant } = await platformEconomics();
    const series = await salesTimeSeries(6);
    const usersCount = Number((await db.select({ c: sql<number>`count(*)` }).from(users))[0]?.c ?? 0);
    const leadsCount = Number((await db.select({ c: sql<number>`count(*)` }).from(leadDeliveries))[0]?.c ?? 0);
    // Current leads in each tenant's database (the ingested pool).
    const leadRows = await db.select({ t: leads.tenantId, c: sql<number>`count(*)` }).from(leads).groupBy(leads.tenantId);
    const leadMap = new Map(leadRows.map((r) => [r.t, Number(r.c)]));

    return (
      <>
        <PageHeader
          title="Platform overview"
          subtitle="Revenue, gross profit, and white-label performance across r0cketship."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Platform revenue" value={usd(totals.platformRevenue)} accent />
          <StatCard label="Gross profit" value={usd(totals.grossProfit)} sub={pct(totals.grossMargin) + " margin"} />
          <StatCard label="White-label sales" value={usd(totals.sales)} />
          <StatCard label="White-labels" value={String(byTenant.length)} sub={`${usersCount} users · ${leadsCount} leads delivered`} />
        </div>

        <Card className="mt-6">
          <SectionTitle hint="monthly $">Revenue — last 6 months</SectionTitle>
          <AreaChart data={series.values} labels={series.labels} />
        </Card>

        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-2">
            <SectionTitle>Your 60% by white-label</SectionTitle>
            <BarChart data={byTenant.slice(0, 8).map((t) => ({ label: t.domain, value: t.platformRevenue }))} />
          </Card>
          <Card className="lg:col-span-3">
            <SectionTitle>White-labels</SectionTitle>
            {byTenant.length === 0 ? (
              <div className="flex flex-col items-start gap-3">
                <span className="text-sm" style={{ color: "var(--muted)" }}>No white-labels yet.</span>
                <a className="btn btn-primary" href="/admin/launch">+ Add white-label</a>
              </div>
            ) : (
              <Table head={["White-label", "Leads", "Sales", "Your 60%", ""]}>
                {byTenant.map((t) => (
                  <Tr key={t.tenantId}>
                    <Td>
                      <div className="font-medium">{t.domain}</div>
                      <div className="text-xs" style={{ color: "var(--muted-2)" }}>{t.niche}</div>
                    </Td>
                    <Td>
                      <a href={`/admin/leads?tenant=${t.tenantId}`} className="font-semibold tabular-nums" style={{ color: "var(--color-accent)" }}>
                        {(leadMap.get(t.tenantId) ?? 0).toLocaleString()}
                      </a>
                    </Td>
                    <Td>{usd(t.sales)}</Td>
                    <Td>{usd(t.platformRevenue)}</Td>
                    <Td>
                      <div className="flex justify-end gap-2">
                        <a className="btn btn-ghost" href={`/admin/tenants/${t.tenantId}`} style={{ padding: "6px 10px" }}>Manage</a>
                        <form action={openAsWhiteLabelAction}>
                          <input type="hidden" name="tenantId" value={t.tenantId} />
                          <button className="btn btn-primary" style={{ padding: "6px 10px" }}>Open as ↗</button>
                        </form>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Table>
            )}
          </Card>
        </div>
      </>
    );
  }

  // Manager: white-label business-manager P&L. The 60% is shown as a COST.
  const t = ctx.tenant;
  const e = await tenantEconomics({ id: t.id, platformFeeRate: t.platformFeeRate, dataCostRate: t.dataCostRate });
  const series = await salesTimeSeries(6, t.id);

  return (
    <>
      <PageHeader title="Business overview" subtitle={`Your lead sales and margin on ${t.domain}.`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Gross sales" value={usd(e.sales)} />
        <StatCard label="Platform & data fee" value={usd(e.platformRevenue)} sub={pct(e.feeRate) + " of sales · cost"} />
        <StatCard label="Your net" value={usd(e.whitelabelNet)} accent />
      </div>

      <Card className="mt-6">
        <SectionTitle hint="monthly $">Sales — last 6 months</SectionTitle>
        <AreaChart data={series.values} labels={series.labels} />
      </Card>

      <Card className="mt-6">
        <SectionTitle>How your pricing works</SectionTitle>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          You sell leads/subscriptions to your customers. r0cketship&apos;s platform &amp; data fee is{" "}
          {pct(e.feeRate)} of every sale ({usd(e.platformRevenue)} so far). You keep the rest —{" "}
          <span className="font-semibold" style={{ color: "var(--ink)" }}>{usd(e.whitelabelNet)}</span>.
        </p>
      </Card>
    </>
  );
}
