"use client";
import { useActionState } from "react";
import { launchAction } from "./actions";
import { ThemeEditor } from "@/app/admin/ThemeEditor";
import { Card, SectionTitle, Field } from "@/app/_ui/primitives";
import type { TenantTheme, Offer } from "@/src/tenant/types";

export function LaunchForm({ presets, defaultOffers = [] }: { presets: { name: string; theme: TenantTheme }[]; defaultOffers?: Offer[] }) {
  const [state, action, pending] = useActionState(launchAction, {});

  return (
    <form action={action} className="space-y-6">
      {/* Site */}
      <Card>
        <SectionTitle>Site</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Domain / URL">
            <input name="domain" required placeholder="solarpros.co" className="input" />
          </Field>
          <Field label="Niche">
            <input name="niche" required placeholder="solar" className="input" />
          </Field>
          <Field label="Money word" hint="e.g. solar leads">
            <input name="moneyWord" required placeholder="solar leads" className="input" />
          </Field>
          <Field label="Hero image URL">
            <input name="heroImage" placeholder="https://…/hero.jpg" className="input" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Hero headline (H1)" hint='e.g. "Close more solar. Chase fewer leads."'>
              <input name="heroHeadline" placeholder="Close more solar. Chase fewer leads." className="input" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Hero description">
              <textarea name="heroSubhead" rows={2} className="input" placeholder="High-intent buyers, delivered daily to your CRM." />
            </Field>
          </div>
        </div>
      </Card>

      {/* Offers */}
      <Card>
        <SectionTitle hint="up to 3">Offers</SectionTitle>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => {
            const d = defaultOffers[i - 1];
            return (
              <div key={i} className="rounded-[var(--radius-lg)] border p-4" style={{ borderColor: "var(--line)" }}>
                <div className="mb-3 text-sm font-bold" style={{ color: "var(--muted)" }}>Offer {i}</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Title (H2)">
                    <input name={`o${i}t`} className="input" placeholder="Exclusive ZIP" defaultValue={d?.title ?? ""} />
                  </Field>
                  <Field label="Price">
                    <input name={`o${i}p`} className="input" placeholder="$1,500/mo" defaultValue={d?.price ?? ""} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Description">
                      <input name={`o${i}d`} className="input" placeholder="What this offer is about" defaultValue={d?.description ?? ""} />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="What you get" hint="one bullet per line">
                      <textarea name={`o${i}f`} rows={4} className="input" placeholder={"Exclusive ZIP territory\nDaily lead delivery\nCRM webhooks"} defaultValue={(d?.features ?? []).join("\n")} />
                    </Field>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Branding */}
      <Card>
        <SectionTitle>Branding</SectionTitle>
        <div className="grid grid-cols-2">
          <ThemeEditor theme={presets[0].theme} style="bold" presets={presets} />
        </div>
      </Card>

      {/* Pricing & economics */}
      <Card>
        <SectionTitle>Pricing &amp; economics</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Monthly price per ZIP">
            <input name="monthlyPriceDefault" defaultValue="1500" className="input" />
          </Field>
          <Field label="Signup bonus credits">
            <input name="signupBonusCredits" defaultValue="50" className="input" />
          </Field>
          <Field label="Platform fee %" hint="r0cketship's cut of each sale — covers data">
            <input name="platformFeePct" type="number" defaultValue="60" className="input" />
          </Field>
          <Field label="Data cost %" hint="for your gross-profit reporting">
            <input name="dataCostPct" type="number" defaultValue="0" className="input" />
          </Field>
        </div>
      </Card>

      {state?.error && <p className="text-sm" style={{ color: "var(--neg)" }}>{state.error}</p>}

      <button disabled={pending} className="btn btn-primary">
        {pending ? "Launching…" : "Launch white-label"}
      </button>
    </form>
  );
}
