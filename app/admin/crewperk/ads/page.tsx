import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { crewAds } from "@/src/db/schema";
import { desc } from "drizzle-orm";
import { createAdAction, updateAdAction, topUpAdAction, deleteAdAction } from "./actions";

export const dynamic = "force-dynamic";
const usd = (c: number) => `$${(c / 100).toFixed(2)}`;

function Tabs() {
  return (
    <div className="mb-5 flex gap-2 text-sm font-semibold">
      <a href="/admin/crewperk" className="rounded-full px-4 py-1.5" style={{ background: "var(--surface-2)", color: "var(--ink)" }}>Merchants</a>
      <a href="/admin/crewperk/ads" className="rounded-full px-4 py-1.5 text-white" style={{ background: "var(--color-accent)" }}>Ads (PPC)</a>
      <a href="/admin/crewperk/tickets" className="rounded-full px-4 py-1.5" style={{ background: "var(--surface-2)", color: "var(--ink)" }}>Tickets</a>
    </div>
  );
}

export default async function AdsAdmin() {
  await requireAuth(["god"]);
  const ads = await db.select().from(crewAds).orderBy(desc(crewAds.bidCents));

  return (
    <div>
      <div className="mb-1 text-2xl font-extrabold" style={{ color: "var(--ink)" }}>CrewPerk Ads · Pay-per-click</div>
      <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>The highest live bidder with Rocket Fuel balance wins each port slot. Every click decrements their balance by the bid.</p>
      <Tabs />

      <details className="card mb-6 p-5">
        <summary className="cursor-pointer text-sm font-bold" style={{ color: "var(--ink)" }}>+ New ad</summary>
        <form action={createAdAction} className="mt-4 grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col"><span className="label">Advertiser *</span><input name="advertiser" required className="input" /></label>
            <label className="flex flex-col"><span className="label">Target port (or "all")</span><input name="port" defaultValue="all" className="input" /></label>
            <label className="flex flex-col"><span className="label">Headline *</span><input name="headline" required className="input" /></label>
            <label className="flex flex-col"><span className="label">Link URL *</span><input name="linkUrl" required className="input" placeholder="https://…" /></label>
            <label className="flex flex-col"><span className="label">Bid per click ($)</span><input name="bid" type="number" step="0.01" defaultValue="0.50" className="input" /></label>
            <label className="flex flex-col"><span className="label">Starting balance ($)</span><input name="balance" type="number" step="1" defaultValue="100" className="input" /></label>
          </div>
          <label className="flex flex-col"><span className="label">Body</span><input name="body" className="input" /></label>
          <label className="flex flex-col"><span className="label">Image URL</span><input name="imageUrl" className="input" placeholder="https://…" /></label>
          <input type="hidden" name="status" value="active" />
          <div><button className="btn btn-primary" style={{ padding: "10px 18px" }}>Create ad</button></div>
        </form>
      </details>

      <div className="flex flex-col gap-2">
        {ads.map((a) => (
          <div key={a.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2"><span className="font-bold" style={{ color: "var(--ink)" }}>{a.advertiser}</span><span className="chip">{a.port}</span>{a.status !== "active" && <span className="chip" style={{ color: "var(--neg)" }}>{a.status}</span>}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>{a.headline} · bid {usd(a.bidCents)} · {a.clicks} clicks · spent {usd(a.spentCents)}</div>
                <div className="mt-0.5 text-sm font-bold" style={{ color: a.balanceCents >= a.bidCents ? "var(--pos)" : "var(--neg)" }}>Balance {usd(a.balanceCents)}</div>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <form action={updateAdAction} className="flex items-end gap-1.5">
                  <input type="hidden" name="id" value={a.id} />
                  <label className="flex flex-col"><span className="label">Bid $</span><input name="bid" type="number" step="0.01" defaultValue={(a.bidCents / 100).toFixed(2)} className="input" style={{ width: 80 }} /></label>
                  <select name="status" defaultValue={a.status} className="input" style={{ width: 90 }}><option value="active">active</option><option value="paused">paused</option></select>
                  <button className="btn btn-ghost" style={{ padding: "9px 12px" }}>Save</button>
                </form>
                <form action={topUpAdAction} className="flex items-end gap-1.5">
                  <input type="hidden" name="id" value={a.id} />
                  <label className="flex flex-col"><span className="label">Top up $</span><input name="amount" type="number" step="1" defaultValue="100" className="input" style={{ width: 80 }} /></label>
                  <button className="btn btn-primary" style={{ padding: "9px 12px" }}>Add fuel</button>
                </form>
                <form action={deleteAdAction}><input type="hidden" name="id" value={a.id} /><button className="btn btn-ghost" style={{ padding: "9px 12px", color: "var(--neg)" }}>Delete</button></form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
