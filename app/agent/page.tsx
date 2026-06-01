import { requireAuth } from "@/src/auth/guard";
import { nextLeadToCall, agentKpis } from "@/src/dialer/queue";
import { getIntegrations } from "@/src/integrations/store";
import { AppShell } from "@/app/_app/AppShell";
import { PageHeader, Card, SectionTitle, StatCard, Field } from "@/app/_ui/primitives";
import { CallButton } from "./CallButton";
import { dispositionAction } from "./actions";

export default async function AgentPage() {
  const ctx = await requireAuth(["agent"]);
  const lead = await nextLeadToCall(ctx.user.tenantId);
  const kpis = await agentKpis(ctx.user.id);
  const integ = await getIntegrations(ctx.user.tenantId);
  const phones = lead ? [...((lead.personalPhones as string[]) ?? []), ...((lead.mobilePhones as string[]) ?? [])] : [];
  const brand = ctx.tenant.moneyWord.replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <AppShell brand={brand} role="agent">
      <PageHeader title="Call console" subtitle="Your next lead, click-to-call, and disposition." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Calls" value={String(kpis.calls)} />
        <StatCard label="Contacts" value={String(kpis.contacts)} />
        <StatCard label="Bookings" value={String(kpis.bookings)} />
        <StatCard label="Sales" value={String(kpis.sales)} />
        <StatCard label="Revenue" value={`$${kpis.revenue}`} accent />
      </div>

      {integ.hotTransferNumber && (
        <div className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
          Hot-transfer number: <span className="chip">{integ.hotTransferNumber}</span>
        </div>
      )}

      {!lead ? (
        <Card className="mt-6">
          <p className="text-sm" style={{ color: "var(--muted)" }}>No leads to call right now.</p>
        </Card>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <SectionTitle>Current lead</SectionTitle>
            <div className="text-lg font-bold">
              {lead.firstName} {lead.lastName}
            </div>
            <div className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {lead.city}, {lead.state} {lead.zip}
            </div>
            <div className="mt-2 text-sm">
              <span style={{ color: "var(--muted)" }}>Phones:</span> {phones.join(", ") || "none"}
            </div>
            <div className="text-sm">
              <span style={{ color: "var(--muted)" }}>Score:</span> {lead.scoreCategory ?? "—"}
            </div>
            {phones[0] && <CallButton leadNumber={phones[0]} />}
          </Card>

          <Card>
            <SectionTitle>Disposition</SectionTitle>
            <form action={dispositionAction} className="flex flex-col gap-4">
              <input type="hidden" name="leadId" value={lead.id} />
              <Field label="Outcome">
                <select name="disposition" className="input">
                  {["no_answer", "left_message", "callback", "hot_transfer", "booked", "sold", "dead"].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </Field>
              <Field label="Callback at">
                <input name="callbackAt" type="datetime-local" className="input" />
              </Field>
              <Field label="Sale value">
                <input name="saleValue" placeholder="sale $ (if sold)" className="input" />
              </Field>
              <Field label="Notes">
                <input name="notes" placeholder="notes" className="input" />
              </Field>
              <button className="btn btn-primary">Save disposition &amp; next lead</button>
            </form>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
