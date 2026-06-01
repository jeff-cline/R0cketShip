import { requireAuth } from "@/src/auth/guard";
import { myDeliveries, deliveryStats } from "@/src/delivery/crm";
import { AppShell } from "@/app/_app/AppShell";
import { PageHeader, Card, StatCard, Table, Tr, Td } from "@/app/_ui/primitives";
import { updateDeliveryAction, sendOfferEmailsAction } from "./actions";

export default async function CrmPage() {
  const ctx = await requireAuth(["customer"]);
  const rows = await myDeliveries(ctx.user.id);
  const stats = await deliveryStats(ctx.user.id);
  const brand = ctx.tenant.moneyWord.replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <AppShell brand={brand} role="customer">
      <PageHeader
        title="Your CRM"
        subtitle="Delivered leads, statuses, and conversions."
        actions={
          <div className="flex items-center gap-2">
            <a href="/api/crm/export" className="btn btn-ghost">Download CSV</a>
            <form action={sendOfferEmailsAction}>
              <button className="btn btn-ghost">Send offer emails</button>
            </form>
            <a href="/settings/email" className="btn btn-ghost">Email &amp; booking</a>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Delivered" value={`${stats.delivered}`} sub="leads" />
        <StatCard label="Conversions" value={`${stats.conversions}`} sub="sold" />
        <StatCard label="Revenue" value={`$${stats.revenue}`} sub="from sales" accent />
        <StatCard label="Credits spent" value={`${stats.creditsSpent}`} sub="on leads" />
      </div>

      <Card className="mt-6" pad={false}>
        <Table head={["Lead", "Contact", "Status", "Sale $", "Notes", ""]}>
          {rows.map((r) => (
            <Tr key={r.deliveryId}>
              <Td>
                <a href={`/crm/${r.deliveryId}`} className="font-medium hover:underline" style={{ color: "var(--color-accent)" }}>{r.firstName} {r.lastName}</a>
                <div className="text-xs" style={{ color: "var(--muted)" }}>{r.zip} {r.city}, {r.state}</div>
              </Td>
              <Td>
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  {(r.phones ?? []).join(", ")}
                  {(r.phones ?? []).length > 0 && (r.emails ?? []).length > 0 ? " · " : ""}
                  {(r.emails ?? []).join(", ")}
                </div>
              </Td>
              <Td>
                <form action={updateDeliveryAction} id={`crm-${r.deliveryId}`} className="contents">
                  <input type="hidden" name="deliveryId" value={r.deliveryId} />
                  <select name="status" defaultValue={r.status} className="input">
                    {["new", "contacted", "booked", "sold", "dead"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </form>
              </Td>
              <Td>
                <input form={`crm-${r.deliveryId}`} name="saleValue" defaultValue={r.saleValue ?? ""} placeholder="sale $" className="input w-24" />
              </Td>
              <Td>
                <input form={`crm-${r.deliveryId}`} name="notes" defaultValue={r.notes ?? ""} placeholder="notes" className="input w-full" />
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <button form={`crm-${r.deliveryId}`} className="btn btn-ghost">Save</button>
                  <a href={`/crm/${r.deliveryId}`} className="btn btn-ghost" style={{ padding: "6px 10px" }}>Open →</a>
                </div>
              </Td>
            </Tr>
          ))}
          {rows.length === 0 && (
            <tr className="border-t" style={{ borderColor: "var(--line)" }}>
              <td colSpan={6} className="px-4 py-3" style={{ color: "var(--muted)" }}>
                No leads yet — buy some on the Leads page.
              </td>
            </tr>
          )}
        </Table>
      </Card>
    </AppShell>
  );
}
