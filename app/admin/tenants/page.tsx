import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { tenantEconomics } from "@/src/reporting/economics";
import { PageHeader, Card, Badge } from "@/app/_ui/primitives";

const usd = (n: number) => (n >= 1000 ? "$" + (n / 1000).toFixed(1) + "k" : "$" + n.toFixed(0));

export default async function TenantsPage() {
  await requireAuth(["god"]);
  const rows = await db.select().from(tenants).orderBy(tenants.domain);

  const withEcon = [];
  for (const t of rows) {
    const e = await tenantEconomics({ id: t.id, platformFeeRate: t.platformFeeRate, dataCostRate: t.dataCostRate });
    withEcon.push({ t, e });
  }

  return (
    <>
      <PageHeader
        title="White-labels"
        subtitle={`${rows.length} niche sites on the platform.`}
        actions={<a className="btn btn-primary" href="/admin/launch">+ Add white-label</a>}
      />

      {withEcon.length === 0 ? (
        <Card>
          <div className="py-8 text-center text-sm" style={{ color: "var(--muted)" }}>
            No white-labels yet.{" "}
            <a className="underline" href="/admin/launch">Add your first one</a>.
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {withEcon.map(({ t, e }) => (
            <Card key={t.id}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">{t.domain}</span>
                <Badge tone={t.status === "active" ? "pos" : "neutral"}>{t.status}</Badge>
              </div>
              <div className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{t.niche}</div>

              <div className="my-4 border-t" style={{ borderColor: "var(--line)" }} />

              <div className="flex items-center justify-between text-sm">
                <div>
                  <div className="label">Sales</div>
                  <div className="font-bold">{usd(e.sales)}</div>
                </div>
                <div className="text-right">
                  <div className="label">Your 60%</div>
                  <div className="font-bold" style={{ color: "var(--color-accent)" }}>{usd(e.platformRevenue)}</div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <a className="btn btn-ghost" href={`/admin/tenants/${t.id}`}>Manage</a>
                <a className="btn btn-ghost" href={`https://${t.domain}`} target="_blank">Visit ↗</a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
