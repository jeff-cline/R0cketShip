import { and, desc, eq, sql } from "drizzle-orm";
import { requireAuth } from "@/src/auth/guard";
import { getCurrentTenant } from "@/src/tenant/context";
import { db } from "@/src/db/client";
import { outreachQueue, emailSuppression, mailboxPurchases, tenantIntegrations } from "@/src/db/schema";
import { platformTenantId } from "@/src/email/mailbox";
import { getOutreachOffer } from "@/src/outreach/offers";
import { planCapacity } from "@/src/outreach/capacity";
import { PageHeader, Card, SectionTitle, StatCard, Field, Table, Tr, Td, Badge } from "@/app/_ui/primitives";
import { OutreachForm } from "./OutreachForm";
import { saveAutoscaleAction } from "./actions";

export const dynamic = "force-dynamic";

async function tenantStats(tenantId: string) {
  const rows = await db
    .select({ status: outreachQueue.status, c: sql<number>`count(*)::int`, clicks: sql<number>`coalesce(sum(${outreachQueue.clicks}),0)::int` })
    .from(outreachQueue)
    .where(eq(outreachQueue.tenantId, tenantId))
    .groupBy(outreachQueue.status);
  const by = (s: string) => rows.find((r) => r.status === s)?.c ?? 0;
  const clicks = rows.reduce((n, r) => n + r.clicks, 0);
  return { queued: by("queued"), sent: by("sent"), suppressed: by("suppressed") + by("skipped"), failed: by("failed"), clicks };
}

export default async function OutreachPage() {
  const ctx = await requireAuth(["god", "manager"]);
  const tenant = await getCurrentTenant();
  const isGod = ctx.user.role === "god";
  const offer = tenant ? await getOutreachOffer(tenant.id) : null;
  const stats = tenant ? await tenantStats(tenant.id) : { queued: 0, sent: 0, suppressed: 0, failed: 0, clicks: 0 };
  const ctr = stats.sent > 0 ? Math.round((stats.clicks / stats.sent) * 1000) / 10 : 0;

  let god: null | {
    plan: Awaited<ReturnType<typeof planCapacity>>;
    autoBuy: boolean;
    maxMailboxes: number;
    suppressed: number;
    purchases: (typeof mailboxPurchases.$inferSelect)[];
  } = null;
  if (isGod) {
    const platform = await platformTenantId();
    const plan = await planCapacity();
    const settings = platform ? (await db.select().from(tenantIntegrations).where(eq(tenantIntegrations.tenantId, platform)).limit(1))[0] : undefined;
    const supp = (await db.select({ c: sql<number>`count(*)::int` }).from(emailSuppression))[0]?.c ?? 0;
    const purchases = await db.select().from(mailboxPurchases).orderBy(desc(mailboxPurchases.createdAt)).limit(5);
    god = { plan, autoBuy: settings?.outreachAutoBuy ?? false, maxMailboxes: settings?.outreachMaxMailboxes ?? 0, suppressed: supp, purchases };
  }

  const daysToClear = stats.queued > 0 && stats.sent + stats.queued > 0
    ? Math.max(1, Math.ceil(stats.queued / Math.max(1, god?.plan.dailyCapacity ?? 50)))
    : 0;

  return (
    <>
      <PageHeader title="Outreach" subtitle="Automatically email your offer to every new lead — dripped over ~5–7 days." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Queued" value={String(stats.queued)} sub={daysToClear ? `~${daysToClear}d to clear` : "all clear"} />
        <StatCard label="Sent" value={String(stats.sent)} />
        <StatCard label="Clicks" value={String(stats.clicks)} accent />
        <StatCard label="Click rate" value={`${ctr}%`} />
        <StatCard label="Unsub / bounce" value={String(stats.suppressed)} />
      </div>

      <div className="mt-6">
        <OutreachForm offer={offer} />
      </div>

      {god && (
        <>
          <div className="mt-8">
            <SectionTitle hint="platform-wide">Capacity &amp; autoscaling</SectionTitle>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total queued" value={String(god.plan.queued)} />
            <StatCard label="Daily capacity" value={String(god.plan.dailyCapacity)} sub={`${god.plan.mailboxes} mailboxes`} />
            <StatCard label="Daily demand" value={String(god.plan.dailyDemand)} sub={`deadline in ${god.plan.daysLeft}d`} />
            <StatCard
              label="Mailbox deficit"
              value={String(god.plan.deficitMailboxes)}
              accent={god.plan.deficitMailboxes > 0}
              sub={god.plan.deficitMailboxes > 0 ? `add ${god.plan.deficitMailboxes} (~$${god.plan.deficitMailboxes * 50}/mo) to hit the deadline` : "keeping pace"}
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <SectionTitle hint="spend money only when you allow it">Auto-buy mailboxes</SectionTitle>
              <form action={saveAutoscaleAction} className="space-y-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="autoBuy" name="autoBuy" defaultChecked={god.autoBuy} className="h-4 w-4" />
                  <label htmlFor="autoBuy" className="text-sm font-medium">Automatically add mailboxes when behind the deadline</label>
                </div>
                <Field label="Max mailboxes (cap)" hint="the system never grows the pool past this">
                  <input name="maxMailboxes" type="number" min={0} defaultValue={god.maxMailboxes} className="input" />
                </Field>
                <button className="btn btn-primary">Save</button>
              </form>
            </Card>

            <Card>
              <SectionTitle hint={`${god.suppressed} addresses suppressed`}>Recent mailbox purchases</SectionTitle>
              {god.purchases.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--muted)" }}>No autoscaling activity yet.</p>
              ) : (
                <Table head={["When", "Provider", "Count", "Reason"]}>
                  {god.purchases.map((p) => (
                    <Tr key={p.id}>
                      <Td>{new Date(p.createdAt).toLocaleDateString()}</Td>
                      <Td>{p.provider}</Td>
                      <Td>{p.count}</Td>
                      <Td><span className="text-xs">{p.reason}</span></Td>
                    </Tr>
                  ))}
                </Table>
              )}
              {god.plan.deficitMailboxes > 0 && !god.autoBuy && (
                <div className="mt-3"><Badge tone="warn">Recommendation: add {god.plan.deficitMailboxes} mailbox(es) — auto-buy is off</Badge></div>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}
