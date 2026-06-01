import { requireAuth } from "@/src/auth/guard";
import { platformEconomics, tenantEconomics, salesTimeSeries } from "@/src/reporting/economics";
import { AreaChart, BarChart } from "@/app/_ui/charts";
import { PageHeader, Card, SectionTitle, StatCard, Table, Tr, Td } from "@/app/_ui/primitives";
import { platformCreditMetrics } from "@/src/reporting/credits";
import { db } from "@/src/db/client";
import { users, leadDeliveries, leads } from "@/src/db/schema";
import { sql } from "drizzle-orm";

const usd = (n: number) => (n >= 1000 ? "$" + (n / 1000).toFixed(1) + "k" : "$" + n.toFixed(0));
const pct = (n: number) => (n * 100).toFixed(0) + "%";

export default async function AdminPage() {
  const ctx = await requireAuth(["god", "manager"]);
  const isGod = ctx.user.role === "god";

  if (isGod) {
    const { totals, byTenant } = await platformEconomics();
    const series = await salesTimeSeries(6);
    const credit = await platformCreditMetrics();
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

        <SectionTitle hint="real money only — excludes free signup credit">Revenue</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Platform revenue" value={usd(totals.platformRevenue)} accent />
          <StatCard label="Gross profit" value={usd(totals.grossProfit)} sub={pct(totals.grossMargin) + " margin"} />
          <StatCard label="White-label sales" value={usd(totals.sales)} sub="paid top-ups + subs" />
          <StatCard label="White-labels" value={String(byTenant.length)} sub={`${usersCount} users · ${leadsCount} leads delivered`} />
        </div>

        <SectionTitle hint="free signup credit vs paid">Credits &amp; users</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Paid users" value={String(credit.paidUsers)} sub="made a real payment" />
          <StatCard label="Free-mode users" value={String(credit.freeUsers)} sub="on signup credit only" />
          <StatCard label="Paid revenue" value={usd(credit.paidRevenue)} sub="actual money in" accent />
          <StatCard label="Outstanding credits" value={credit.outstandingCredits.toLocaleString()} sub="unspent (liability)" />
          <StatCard label="Free credits used" value={credit.freeCreditsUsed.toLocaleString()} sub={`of ${credit.freeCreditsIssued.toLocaleString()} issued`} />
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
                        <a className="btn btn-primary" href={`/admin/open-as/${t.tenantId}`} style={{ padding: "6px 10px" }}>Open as ↗</a>
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

  // Manager: white-label business-owner console, scoped to their tenant.
  const t = ctx.tenant;
  const e = await tenantEconomics({ id: t.id, platformFeeRate: t.platformFeeRate, dataCostRate: t.dataCostRate });
  const series = await salesTimeSeries(6, t.id);
  const credit = await platformCreditMetrics(t.id);
  const myLeads = Number((await db.select({ c: sql<number>`count(*)` }).from(leads).where(sql`${leads.tenantId} = ${t.id}`))[0]?.c ?? 0);

  return (
    <>
      <PageHeader title="Business overview" subtitle={`Your members, collections, leads and margin on ${t.domain}.`} />

      <SectionTitle>Your business</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <a href="/admin/users"><StatCard label="Members" value={String(credit.totalCustomers)} sub={`${credit.paidUsers} paid · ${credit.freeUsers} free`} /></a>
        <StatCard label="Collected" value={usd(credit.paidRevenue)} sub="real money in" accent />
        <StatCard label="Outstanding credits" value={credit.outstandingCredits.toLocaleString()} sub="unspent by members" />
        <a href="/admin/leads"><StatCard label="Leads in your database" value={myLeads.toLocaleString()} sub="searchable" /></a>
      </div>

      <SectionTitle>Your margin</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Gross sales" value={usd(e.sales)} sub="paid by members" />
        <StatCard label="Platform & data fee" value={usd(e.platformRevenue)} sub={pct(e.feeRate) + " of sales · cost"} />
        <StatCard label="Your net" value={usd(e.whitelabelNet)} accent />
      </div>

      <Card className="mt-6">
        <SectionTitle hint="monthly $">Collections — last 6 months</SectionTitle>
        <AreaChart data={series.values} labels={series.labels} />
      </Card>

      <Card className="mt-6">
        <SectionTitle>How your pricing works</SectionTitle>
        <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
          Your members pay for leads/subscriptions. r0cketship&apos;s platform &amp; data fee is{" "}
          {pct(e.feeRate)} of every sale ({usd(e.platformRevenue)} so far). You keep the rest —{" "}
          <span className="font-semibold" style={{ color: "var(--ink)" }}>{usd(e.whitelabelNet)}</span>.
          The $50 signup credit is a free hook — it isn&apos;t revenue.
        </p>
      </Card>
    </>
  );
}
