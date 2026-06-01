import { requireAuth } from "@/src/auth/guard";
import { getPlatformSettings } from "@/src/referral/core";
import { tenantPartners } from "@/src/referral/reports";
import { PageHeader, Card, SectionTitle, Field, Table, Tr, Td } from "@/app/_ui/primitives";
import { savePartnerSettingsAction } from "./actions";

function money(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function PartnerProgramAdminPage() {
  const ctx = await requireAuth(["god", "manager"]);
  const t = ctx.tenant;
  const ps = await getPlatformSettings();
  const capPct = Math.round(Number(ps.partnerRateCap) * 100);
  const ratePct = Math.round(Number(t.partnerRate) * 100);
  const partners = await tenantPartners(t.id);

  return (
    <>
      <PageHeader title="Partner program" subtitle="Recruit partners who refer customers to your site." />

      <Card className="mb-6">
        <SectionTitle hint={`Recruit link: https://${t.domain}/partners`}>Settings</SectionTitle>
        <form action={savePartnerSettingsAction} className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm sm:col-span-2" style={{ color: "var(--ink)" }}>
            <input type="checkbox" name="partnerProgramEnabled" defaultChecked={t.partnerProgramEnabled} /> Enable the partner program
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2" style={{ color: "var(--ink)" }}>
            <input type="checkbox" name="showBecomeAPartner" defaultChecked={t.showBecomeAPartner} /> Show &ldquo;Become a Partner&rdquo; in the footer
          </label>
          <Field label="Partner rate (%)" hint={`Max ${capPct}%`}>
            <input name="partnerRate" type="number" min={0} max={capPct} step={1} defaultValue={ratePct} className="input" />
          </Field>
          <div className="sm:col-span-2">
            <button className="btn btn-primary">Save settings</button>
          </div>
        </form>
      </Card>

      <Card>
        <SectionTitle>Your partners</SectionTitle>
        {partners.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No partners yet. Share <code>https://{t.domain}/partners</code> to recruit your first one.
          </p>
        ) : (
          <Table head={["Email", "Code", "Referred", "Activated", "Upgraded", "Earned", "Owed"]}>
            {partners.map((p) => (
              <Tr key={p.userId}>
                <Td>{p.email}</Td>
                <Td><span className="chip">{p.code}</span></Td>
                <Td>{p.funnel.referred}</Td>
                <Td>{p.funnel.activated}</Td>
                <Td>{p.funnel.upgraded}</Td>
                <Td>{money(p.earnings.earned)}</Td>
                <Td>{money(p.earnings.owed)}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
