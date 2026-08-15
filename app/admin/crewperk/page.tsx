import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { crewMerchants } from "@/src/db/schema";
import { desc } from "drizzle-orm";
import { MerchantForm } from "./MerchantForm";
import { createMerchantAction, deleteMerchantAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function CrewPerkAdmin() {
  await requireAuth(["god"]);
  const rows = await db.select().from(crewMerchants).orderBy(desc(crewMerchants.featured), desc(crewMerchants.createdAt));
  const totalClicks = rows.reduce((s, r) => s + r.clicks, 0);
  const totalReviews = rows.reduce((s, r) => s + r.reviewCount, 0);

  return (
    <div>
      <div className="mb-1 text-2xl font-extrabold" style={{ color: "var(--ink)" }}>CrewPerk Merchants</div>
      <p className="mb-5 text-sm" style={{ color: "var(--muted)" }}>
        Manage crewperk.com partners by port. {rows.length} merchants · {totalClicks} clicks · {totalReviews} reviews. Live at <a href="https://crewperk.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-accent)" }}>crewperk.com</a>.
      </p>

      <div className="mb-5 flex gap-2 text-sm font-semibold">
        <a href="/admin/crewperk" className="rounded-full px-4 py-1.5 text-white" style={{ background: "var(--color-accent)" }}>Merchants</a>
        <a href="/admin/crewperk/ads" className="rounded-full px-4 py-1.5" style={{ background: "var(--surface-2)", color: "var(--ink)" }}>Ads (PPC)</a>
        <a href="/admin/crewperk/tickets" className="rounded-full px-4 py-1.5" style={{ background: "var(--surface-2)", color: "var(--ink)" }}>Tickets</a>
      </div>

      <details className="card mb-6 p-5">
        <summary className="cursor-pointer text-sm font-bold" style={{ color: "var(--ink)" }}>+ New merchant</summary>
        <div className="mt-4"><MerchantForm action={createMerchantAction} submitLabel="Create merchant" /></div>
      </details>

      <div className="flex flex-col gap-2">
        {rows.map((m) => (
          <div key={m.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold" style={{ color: "var(--ink)" }}>{m.name}</span>
                <span className="chip" style={{ textTransform: "capitalize" }}>{m.tier.replace("_", " ")}</span>
                {m.featured && <span className="chip" style={{ background: "color-mix(in srgb, var(--color-accent) 18%, transparent)", color: "var(--ink)" }}>featured</span>}
                {m.status !== "active" && <span className="chip" style={{ color: "var(--neg)" }}>{m.status}</span>}
              </div>
              <div className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>{m.category} · {m.port} · 🚀 {m.rating} ({m.reviewCount}) · {m.clicks} clicks · {m.perk ?? "—"}</div>
            </div>
            <div className="flex items-center gap-2">
              <a href={`https://crewperk.com/m/${m.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ padding: "7px 12px" }}>View</a>
              <a href={`/admin/crewperk/${m.id}`} className="btn btn-ghost" style={{ padding: "7px 12px" }}>Edit</a>
              <form action={deleteMerchantAction}>
                <input type="hidden" name="id" value={m.id} />
                <button className="btn btn-ghost" style={{ padding: "7px 12px", color: "var(--neg)" }}>Delete</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
