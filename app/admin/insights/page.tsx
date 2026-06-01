import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { globalLeadCounts, predictiveLeads } from "@/src/predictive/analytics";

export default async function InsightsPage() {
  await requireAuth(["god"]);
  const g = await globalLeadCounts();
  const tenantList = await db.select().from(tenants).orderBy(tenants.domain);
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-bold">Predictive insights</h1>
      <p className="mt-1 text-sm opacity-70">{g.totalLeads} leads · {g.distinctPersons} distinct people · {g.crossSitePersons} cross-site (in 2+ niches)</p>
      <div className="mt-2 text-sm opacity-80">
        <div>Tiers: real_time {g.byTier.real_time}, one_week {g.byTier.one_week}, thirty_day {g.byTier.thirty_day}, older {g.byTier.older}</div>
        <div>Segments: residential {g.bySegment.residential}, commercial {g.bySegment.commercial}</div>
        <div>Top ZIPs: {g.topZips.map((z) => `${z.zip}(${z.count})`).join(", ") || "—"}</div>
      </div>
      {await Promise.all(tenantList.map(async (t) => {
        const top = await predictiveLeads(t.id, 10);
        return (
          <section key={t.id} className="mt-6 rounded-xl border p-5">
            <h2 className="font-semibold">{t.domain} — top predictive leads</h2>
            <table className="mt-2 w-full text-sm">
              <thead><tr className="text-left opacity-60"><th>Score</th><th>ZIP</th><th>Tier</th><th>Intent</th><th>Cross-site</th></tr></thead>
              <tbody>
                {top.map((l) => (
                  <tr key={l.leadId} className="border-t"><td className="font-medium">{l.score}</td><td>{l.zip}</td><td>{l.tier}</td><td>{l.scoreCategory}</td><td>{l.convertedElsewhere ? "yes" : ""}</td></tr>
                ))}
                {top.length === 0 && <tr><td colSpan={5} className="py-2 opacity-60">no leads</td></tr>}
              </tbody>
            </table>
          </section>
        );
      }))}
    </main>
  );
}
