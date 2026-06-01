import { requireAuth } from "@/src/auth/guard";
import { myDeliveries, deliveryStats } from "@/src/delivery/crm";
import { updateDeliveryAction, sendOfferEmailsAction } from "./actions";

export default async function CrmPage() {
  const ctx = await requireAuth(["customer"]);
  const rows = await myDeliveries(ctx.user.id);
  const stats = await deliveryStats(ctx.user.id);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-bold">My leads</h1>
      <p className="mt-1 text-sm opacity-70">
        {stats.delivered} delivered · {stats.conversions} conversions · ${stats.revenue} revenue · {stats.creditsSpent} credits spent
        {" · "}<a className="underline" href="/api/crm/export">Download CSV</a>
      </p>
      <form action={sendOfferEmailsAction} className="mt-3 inline-block">
        <button className="rounded border px-3 py-1 text-sm">Send offer emails to my leads</button>
      </form>
      <a href="/settings/email" className="ml-3 text-sm underline">Email &amp; booking settings</a>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.deliveryId} className="rounded border p-3 text-sm">
            <div className="font-medium">{r.firstName} {r.lastName} — {r.zip} {r.city}, {r.state}</div>
            <div className="opacity-70">{(r.phones ?? []).join(", ")} · {(r.emails ?? []).join(", ")}</div>
            <form action={updateDeliveryAction} className="mt-2 flex flex-wrap items-center gap-2">
              <input type="hidden" name="deliveryId" value={r.deliveryId} />
              <select name="status" defaultValue={r.status} className="rounded border p-1">
                {["new", "contacted", "booked", "sold", "dead"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input name="saleValue" defaultValue={r.saleValue ?? ""} placeholder="sale $" className="w-24 rounded border p-1" />
              <input name="notes" defaultValue={r.notes ?? ""} placeholder="notes" className="flex-1 rounded border p-1" />
              <button className="rounded border px-2 py-1">Save</button>
            </form>
          </li>
        ))}
        {rows.length === 0 && <li className="opacity-60">No leads yet — buy some on the Leads page.</li>}
      </ul>
    </main>
  );
}
