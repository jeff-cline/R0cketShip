/**
 * Create a new Offer Box. The niche multi-select is populated from the
 * distinct `niche` values across active tenants — that way operators can
 * only target niches we can actually fill.
 */
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { PageHeader, Card, Field, SectionTitle } from "@/app/_ui/primitives";
import { createOfferBoxAction } from "../actions";

export default async function NewOfferBoxPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  await requireAuth(["god"]);
  const { err } = await searchParams;

  const nicheRows = await db
    .selectDistinct({ niche: tenants.niche })
    .from(tenants)
    .where(eq(tenants.status, "active"))
    .orderBy(sql`${tenants.niche} asc`);
  const niches = nicheRows.map((r) => r.niche).filter(Boolean);

  return (
    <>
      <PageHeader
        title="New offer box"
        subtitle="Configure once, get embed snippets for iframe, JS, HTML email, and popup."
        actions={
          <a className="btn btn-ghost" href="/admin/offer-box">
            ← All offer boxes
          </a>
        }
      />

      {err && (
        <div className="mb-6">
          <Card>
            <p className="text-sm" style={{ color: "var(--neg)" }}>{err}</p>
          </Card>
        </div>
      )}

      <form action={createOfferBoxAction}>
        <Card>
          <SectionTitle>Basics</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Name" hint="for your reference — never shown to embedders">
                <input name="name" required className="input" placeholder="Homepage hero · top 3" />
              </Field>
            </div>
            <Field label="Mode">
              <select name="mode" defaultValue="main_only" className="input">
                <option value="main_only">Main only — 1 top offer (any niche)</option>
                <option value="by_niche">By niche — fill from chosen niches</option>
                <option value="niche_plus_n">Niche + N — niche hero plus general filler</option>
                <option value="top_n_all">Top N (all niches) — best of the network</option>
              </select>
            </Field>
            <Field label="Max offers" hint="1–9. Cards shown in the embed.">
              <input name="maxOffers" type="number" min={1} max={9} defaultValue={3} className="input" />
            </Field>
            <Field label="Default format" hint="you can copy any snippet later — this just pre-selects a tab">
              <select name="format" defaultValue="iframe" className="input">
                <option value="iframe">Iframe</option>
                <option value="js">JS loader</option>
                <option value="html">HTML (email / Klaviyo)</option>
                <option value="popup">Popup</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Niches" hint="used for 'By niche' and 'Niche + N' modes — ignored otherwise">
                {niches.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--muted)" }}>
                    No active white-labels yet — add one in /admin/launch first.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {niches.map((n) => (
                      <label
                        key={n}
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs"
                        style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
                      >
                        <input type="checkbox" name="niches" value={n} className="h-3.5 w-3.5" />
                        <span style={{ color: "var(--ink-2)" }}>{n}</span>
                      </label>
                    ))}
                  </div>
                )}
              </Field>
            </div>
          </div>

          <div className="mt-4">
            <button className="btn btn-primary">Create offer box</button>
          </div>
        </Card>
      </form>
    </>
  );
}
