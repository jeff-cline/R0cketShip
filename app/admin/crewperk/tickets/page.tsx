import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { crewTickets, crewTicketOrders } from "@/src/db/schema";
import { desc, sql } from "drizzle-orm";
import { createTicketAction, updateTicketAction, deleteTicketAction } from "./actions";

export const dynamic = "force-dynamic";
const usd = (c: number) => `$${(c / 100).toFixed(0)}`;

function Tabs() {
  return (
    <div className="mb-5 flex gap-2 text-sm font-semibold">
      <a href="/admin/crewperk" className="rounded-full px-4 py-1.5" style={{ background: "var(--surface-2)", color: "var(--ink)" }}>Merchants</a>
      <a href="/admin/crewperk/ads" className="rounded-full px-4 py-1.5" style={{ background: "var(--surface-2)", color: "var(--ink)" }}>Ads (PPC)</a>
      <a href="/admin/crewperk/tickets" className="rounded-full px-4 py-1.5 text-white" style={{ background: "var(--color-accent)" }}>Tickets</a>
    </div>
  );
}

export default async function TicketsAdmin() {
  await requireAuth(["god"]);
  const tickets = await db.select().from(crewTickets).orderBy(desc(crewTickets.createdAt));
  const rev = (await db.select({ total: sql<number>`coalesce(sum(${crewTicketOrders.revShareCents}),0)`, gross: sql<number>`coalesce(sum(${crewTicketOrders.amountCents}),0)` }).from(crewTicketOrders))[0];

  return (
    <div>
      <div className="mb-1 text-2xl font-extrabold" style={{ color: "var(--ink)" }}>CrewPerk Tickets</div>
      <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>Ticketed events & excursions with an adjustable rev share per venue. Reserved orders: gross {usd(Number(rev?.gross ?? 0))} · our share {usd(Number(rev?.total ?? 0))}.</p>
      <Tabs />

      <details className="card mb-6 p-5">
        <summary className="cursor-pointer text-sm font-bold" style={{ color: "var(--ink)" }}>+ New ticket</summary>
        <form action={createTicketAction} className="mt-4 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col"><span className="label">Name *</span><input name="name" required className="input" /></label>
            <label className="flex flex-col"><span className="label">Port</span><input name="port" defaultValue="San Juan, Puerto Rico" className="input" /></label>
            <label className="flex flex-col"><span className="label">Price ($)</span><input name="price" type="number" step="1" defaultValue="45" className="input" /></label>
            <label className="flex flex-col"><span className="label">Rev share % (our cut)</span><input name="revShare" type="number" step="1" defaultValue="20" className="input" /></label>
            <label className="flex flex-col"><span className="label">Capacity</span><input name="capacity" type="number" step="1" className="input" /></label>
            <label className="flex flex-col"><span className="label">Merchant slug (optional)</span><input name="merchantSlug" className="input" placeholder="sunset-catamaran" /></label>
          </div>
          <label className="flex flex-col"><span className="label">Description</span><input name="description" className="input" /></label>
          <label className="flex flex-col"><span className="label">Image URL</span><input name="imageUrl" className="input" placeholder="https://…" /></label>
          <input type="hidden" name="status" value="active" />
          <div><button className="btn btn-primary" style={{ padding: "10px 18px" }}>Create ticket</button></div>
        </form>
      </details>

      <div className="flex flex-col gap-2">
        {tickets.map((t) => (
          <div key={t.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <div className="flex items-center gap-2"><span className="font-bold" style={{ color: "var(--ink)" }}>{t.name}</span><span className="chip">{t.port.split(",")[0]}</span>{t.status !== "active" && <span className="chip" style={{ color: "var(--neg)" }}>{t.status}</span>}</div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>{usd(t.priceCents)} · {t.revSharePct}% rev share · sold {t.sold}{t.capacity ? `/${t.capacity}` : ""}</div>
            </div>
            <div className="flex items-end gap-2">
              <form action={updateTicketAction} className="flex items-end gap-1.5">
                <input type="hidden" name="id" value={t.id} />
                <label className="flex flex-col"><span className="label">$</span><input name="price" type="number" step="1" defaultValue={(t.priceCents / 100).toFixed(0)} className="input" style={{ width: 70 }} /></label>
                <label className="flex flex-col"><span className="label">Rev %</span><input name="revShare" type="number" step="1" defaultValue={t.revSharePct} className="input" style={{ width: 64 }} /></label>
                <select name="status" defaultValue={t.status} className="input" style={{ width: 90 }}><option value="active">active</option><option value="paused">paused</option></select>
                <button className="btn btn-ghost" style={{ padding: "9px 12px" }}>Save</button>
              </form>
              <form action={deleteTicketAction}><input type="hidden" name="id" value={t.id} /><button className="btn btn-ghost" style={{ padding: "9px 12px", color: "var(--neg)" }}>Delete</button></form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
