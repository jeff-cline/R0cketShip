import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { THEME_PRESETS } from "@/src/tenant/manage";
import { notFound } from "next/navigation";
import { saveConfigAction, regenerateThemeAction } from "./actions";

export default async function TenantEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth(["god"]);
  const { id } = await params;
  const t = (await db.select().from(tenants).where(eq(tenants.id, id)).limit(1))[0];
  if (!t) notFound();
  const offers = (t.offers as { id: number; title: string; description: string; price: string }[]) ?? [];
  const themeIdx = Math.max(0, THEME_PRESETS.findIndex((p) => p.accent === (t.theme as { accent: string }).accent));

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold">{t.domain}</h1>
      <form action={saveConfigAction} className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <input type="hidden" name="id" value={t.id} />
        <input name="moneyWord" defaultValue={t.moneyWord} placeholder="money word" className="col-span-2 rounded border p-2" />
        <input name="niche" defaultValue={t.niche} placeholder="niche" className="rounded border p-2" />
        <input name="monthlyPriceDefault" defaultValue={t.monthlyPriceDefault} placeholder="monthly price" className="rounded border p-2" />
        <input name="signupBonusCredits" defaultValue={t.signupBonusCredits} placeholder="signup bonus credits" className="rounded border p-2" />
        <input name="logoUrl" defaultValue={t.logoUrl ?? ""} placeholder="logo URL" className="rounded border p-2" />
        {[1, 2, 3].map((i) => {
          const o = offers[i - 1];
          return (
            <div key={i} className="col-span-2 grid grid-cols-3 gap-2">
              <input name={`o${i}t`} defaultValue={o?.title ?? ""} placeholder={`offer ${i} title`} className="rounded border p-2" />
              <input name={`o${i}d`} defaultValue={o?.description ?? ""} placeholder="description" className="rounded border p-2" />
              <input name={`o${i}p`} defaultValue={o?.price ?? ""} placeholder="price" className="rounded border p-2" />
            </div>
          );
        })}
        <textarea name="footerHtml" defaultValue={t.footerHtml} placeholder="footer HTML" className="col-span-2 rounded border p-2" rows={3} />
        <button className="col-span-2 mt-2 rounded bg-black px-4 py-2 text-white">Save config</button>
      </form>
      <form action={regenerateThemeAction} className="mt-3">
        <input type="hidden" name="id" value={t.id} />
        <input type="hidden" name="themeIdx" value={themeIdx} />
        <button className="rounded border px-3 py-2 text-sm">Regenerate look (current preset {themeIdx + 1})</button>
      </form>
      <a href={`https://${t.domain}/`} target="_blank" className="mt-4 inline-block text-sm underline">View site →</a>
    </main>
  );
}
