import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { globalLeadCounts, predictiveLeads } from "@/src/predictive/analytics";
import { PageHeader, Card, SectionTitle, Table, Tr, Td } from "@/app/_ui/primitives";

export default async function InsightsPage() {
  await requireAuth(["god"]);
  const g = await globalLeadCounts();
  const tenantList = await db.select().from(tenants).orderBy(tenants.domain);
  return (
    <>
      <PageHeader
        title="Predictive insights"
        subtitle="Predictive, cross-site lead intelligence."
      />

      <div className="flex flex-col gap-6">
        <Card>
          <SectionTitle hint={`${g.totalLeads} leads · ${g.distinctPersons} distinct people · ${g.crossSitePersons} cross-site`}>Global summary</SectionTitle>
          <div className="space-y-1 text-sm" style={{ color: "var(--muted)" }}>
            <div>Tiers: real_time {g.byTier.real_time}, one_week {g.byTier.one_week}, thirty_day {g.byTier.thirty_day}, older {g.byTier.older}</div>
            <div>Segments: residential {g.bySegment.residential}, commercial {g.bySegment.commercial}</div>
            <div>Top ZIPs: {g.topZips.map((z) => `${z.zip}(${z.count})`).join(", ") || "—"}</div>
          </div>
        </Card>

        {await Promise.all(tenantList.map(async (t) => {
          const top = await predictiveLeads(t.id, 10);
          return (
            <Card key={t.id}>
              <SectionTitle>{t.domain} — top predictive leads</SectionTitle>
              <Table head={["Score", "ZIP", "Tier", "Intent", "Cross-site"]}>
                {top.map((l) => (
                  <Tr key={l.leadId}>
                    <Td className="font-medium">{l.score}</Td>
                    <Td>{l.zip}</Td>
                    <Td>{l.tier}</Td>
                    <Td>{l.scoreCategory}</Td>
                    <Td>{l.convertedElsewhere ? "yes" : ""}</Td>
                  </Tr>
                ))}
                {top.length === 0 && (
                  <Tr>
                    <Td className="py-2 opacity-60">no leads</Td>
                  </Tr>
                )}
              </Table>
            </Card>
          );
        }))}
      </div>
    </>
  );
}
