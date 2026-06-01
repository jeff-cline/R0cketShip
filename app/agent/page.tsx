import { requireAuth } from "@/src/auth/guard";
import { nextLeadToCall, agentKpis } from "@/src/dialer/queue";
import { getIntegrations } from "@/src/integrations/store";
import { logoutAction } from "@/app/logout/actions";
import { CallButton } from "./CallButton";
import { dispositionAction } from "./actions";

export default async function AgentPage() {
  const ctx = await requireAuth(["agent"]);
  const lead = await nextLeadToCall(ctx.user.tenantId);
  const kpis = await agentKpis(ctx.user.id);
  const integ = await getIntegrations(ctx.user.tenantId);
  const phones = lead ? [...((lead.personalPhones as string[]) ?? []), ...((lead.mobilePhones as string[]) ?? [])] : [];

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Agent console</h1>
        <form action={logoutAction}><button className="rounded border px-3 py-1 text-sm">Log out</button></form>
      </div>
      <p className="mt-1 text-sm opacity-70">Calls {kpis.calls} · Contacts {kpis.contacts} · Bookings {kpis.bookings} · Sales {kpis.sales} · ${kpis.revenue}</p>
      {integ.hotTransferNumber && <p className="mt-1 text-sm">Hot-transfer number: <strong>{integ.hotTransferNumber}</strong></p>}

      {!lead ? (
        <p className="mt-8 opacity-60">No leads to call right now.</p>
      ) : (
        <section className="mt-6 rounded-xl border p-5">
          <div className="font-medium">{lead.firstName} {lead.lastName} — {lead.city}, {lead.state} {lead.zip}</div>
          <div className="mt-1 text-sm opacity-75">Phones: {phones.join(", ") || "none"} · Score: {lead.scoreCategory ?? "—"}</div>
          {phones[0] && <CallButton leadNumber={phones[0]} />}
          <form action={dispositionAction} className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <input type="hidden" name="leadId" value={lead.id} />
            <select name="disposition" className="rounded border p-2">
              {["no_answer", "left_message", "callback", "hot_transfer", "booked", "sold", "dead"].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <input name="callbackAt" type="datetime-local" className="rounded border p-2" />
            <input name="saleValue" placeholder="sale $ (if sold)" className="rounded border p-2" />
            <input name="notes" placeholder="notes" className="rounded border p-2" />
            <button className="col-span-2 rounded bg-black px-3 py-2 text-white">Save disposition &amp; next lead</button>
          </form>
        </section>
      )}
    </main>
  );
}
