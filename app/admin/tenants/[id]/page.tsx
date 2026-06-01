import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { NAMED_PRESETS } from "@/src/tenant/manage";
import { tenantEconomics } from "@/src/reporting/economics";
import { PageHeader, Card, SectionTitle, StatCard, Badge, Field } from "@/app/_ui/primitives";
import { DnsInstructions } from "@/app/admin/_shell/DnsInstructions";
import { ThemeEditor } from "@/app/admin/ThemeEditor";
import type { Offer, TenantTheme } from "@/src/tenant/types";
import { updateAction } from "./actions";

const usd = (n: number) => (n >= 1000 ? "$" + (n / 1000).toFixed(1) + "k" : "$" + n.toFixed(0));

export default async function TenantManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  await requireAuth(["god"]);
  const { id } = await params;
  const { created } = await searchParams;
  const t = (await db.select().from(tenants).where(eq(tenants.id, id)).limit(1))[0];
  if (!t) notFound();

  const offers = (t.offers as Offer[]) ?? [];
  const e = await tenantEconomics({ id: t.id, platformFeeRate: t.platformFeeRate, dataCostRate: t.dataCostRate });
  const feePct = (Number(t.platformFeeRate) * 100).toString();
  const dataPct = (Number(t.dataCostRate) * 100).toString();

  return (
    <>
      <PageHeader
        title={t.domain}
        subtitle={t.niche}
        actions={<a className="btn btn-ghost" href="/admin/tenants">← All white-labels</a>}
      />

      {created && (
        <div className="mb-6">
          <Card>
            <div className="flex items-center gap-3 text-sm">
              <Badge tone="pos">Created</Badge>
              <span>White-label created — point the domain to go live.</span>
            </div>
          </Card>
        </div>
      )}

      {/* P&L */}
      <div className="mb-6">
        <Card>
          <SectionTitle>P&amp;L</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Sales" value={usd(e.sales)} />
            <StatCard label="Your 60%" value={usd(e.platformRevenue)} accent />
            <StatCard label="Gross profit" value={usd(e.grossProfit)} sub={`${(e.grossMargin * 100).toFixed(0)}% margin`} />
          </div>
        </Card>
      </div>

      {/* Edit form */}
      <form action={updateAction} className="space-y-6">
        <input type="hidden" name="id" value={t.id} />

        <Card>
          <SectionTitle>Site</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Niche">
              <input name="niche" defaultValue={t.niche} className="input" />
            </Field>
            <Field label="Money word">
              <input name="moneyWord" defaultValue={t.moneyWord} className="input" />
            </Field>
            <Field label="Hero image URL">
              <input name="heroImage" defaultValue={t.heroImage ?? ""} className="input" />
            </Field>
            <Field label="Status">
              <select name="status" defaultValue={t.status} className="input">
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Hero headline (H1)">
                <input name="heroHeadline" defaultValue={t.heroHeadline ?? ""} className="input" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Hero description">
                <textarea name="heroSubhead" rows={2} defaultValue={t.heroSubhead ?? ""} className="input" />
              </Field>
            </div>
          </div>
        </Card>

        <Card>
          <SectionTitle hint="up to 3">Offers</SectionTitle>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => {
              const o = offers[i - 1];
              return (
                <div key={i} className="rounded-[var(--radius-lg)] border p-4" style={{ borderColor: "var(--line)" }}>
                  <div className="mb-3 text-sm font-bold" style={{ color: "var(--muted)" }}>Offer {i}</div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Title (H2)">
                      <input name={`o${i}t`} defaultValue={o?.title ?? ""} className="input" />
                    </Field>
                    <Field label="Price">
                      <input name={`o${i}p`} defaultValue={o?.price ?? ""} className="input" />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Description">
                        <input name={`o${i}d`} defaultValue={o?.description ?? ""} className="input" />
                      </Field>
                    </div>
                    <div className="sm:col-span-2">
                      <Field label="What you get" hint="one bullet per line">
                        <textarea name={`o${i}f`} rows={3} defaultValue={(o?.features ?? []).join("\n")} className="input" />
                      </Field>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <SectionTitle>Branding</SectionTitle>
          <div className="grid grid-cols-2">
            <ThemeEditor theme={t.theme as TenantTheme} style={t.style} presets={NAMED_PRESETS} />
          </div>
        </Card>

        <Card>
          <SectionTitle>Pricing &amp; economics</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Monthly price per ZIP">
              <input name="monthlyPriceDefault" defaultValue={t.monthlyPriceDefault} className="input" />
            </Field>
            <Field label="Signup bonus credits">
              <input name="signupBonusCredits" defaultValue={t.signupBonusCredits} className="input" />
            </Field>
            <Field label="Platform fee %" hint="r0cketship's cut of each sale — covers data">
              <input name="platformFeePct" type="number" defaultValue={feePct} className="input" />
            </Field>
            <Field label="Data cost %" hint="for your gross-profit reporting">
              <input name="dataCostPct" type="number" defaultValue={dataPct} className="input" />
            </Field>
          </div>
        </Card>

        <button className="btn btn-primary">Save changes</button>
      </form>

      <div className="mt-6">
        <DnsInstructions domain={t.domain} />
      </div>
    </>
  );
}
