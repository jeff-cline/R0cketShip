"use client";
/**
 * Edit form for an Offer Box. Server-action driven (the action lives in
 * `../actions.ts`). Niche options are passed in as a static prop because the
 * server already queried the distinct active-tenant niches.
 */
import { Card, Field, SectionTitle } from "@/app/_ui/primitives";
import { updateOfferBoxAction } from "../actions";

interface BoxValues {
  id: string;
  name: string;
  mode: "main_only" | "by_niche" | "niche_plus_n" | "top_n_all";
  niches: string[];
  maxOffers: number;
  format: "html" | "iframe" | "js" | "popup";
  active: boolean;
}

export function EditForm({ box, niches }: { box: BoxValues; niches: string[] }) {
  const selected = new Set(box.niches ?? []);
  return (
    <form action={updateOfferBoxAction}>
      <input type="hidden" name="id" value={box.id} />
      <Card>
        <SectionTitle>Configuration</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Name">
              <input name="name" required defaultValue={box.name} className="input" />
            </Field>
          </div>
          <Field label="Mode">
            <select name="mode" defaultValue={box.mode} className="input">
              <option value="main_only">Main only — 1 top offer (any niche)</option>
              <option value="by_niche">By niche — fill from chosen niches</option>
              <option value="niche_plus_n">Niche + N — niche hero plus general filler</option>
              <option value="top_n_all">Top N (all niches) — best of the network</option>
            </select>
          </Field>
          <Field label="Max offers" hint="1–9">
            <input
              name="maxOffers"
              type="number"
              min={1}
              max={9}
              defaultValue={box.maxOffers}
              className="input"
            />
          </Field>
          <Field label="Default format">
            <select name="format" defaultValue={box.format} className="input">
              <option value="iframe">Iframe</option>
              <option value="js">JS loader</option>
              <option value="html">HTML (email / Klaviyo)</option>
              <option value="popup">Popup</option>
            </select>
          </Field>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              name="active"
              defaultChecked={box.active}
              className="h-4 w-4"
            />
            <label htmlFor="active" className="text-sm font-medium">
              Active — embeds render real offers
            </label>
          </div>
          <div className="sm:col-span-2">
            <Field label="Niches" hint="used for 'By niche' and 'Niche + N' modes">
              {niches.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  No active white-labels.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {niches.map((n) => (
                    <label
                      key={n}
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
                    >
                      <input
                        type="checkbox"
                        name="niches"
                        value={n}
                        defaultChecked={selected.has(n)}
                        className="h-3.5 w-3.5"
                      />
                      <span style={{ color: "var(--ink-2)" }}>{n}</span>
                    </label>
                  ))}
                </div>
              )}
            </Field>
          </div>
        </div>
        <div className="mt-4">
          <button className="btn btn-primary">Save changes</button>
        </div>
      </Card>
    </form>
  );
}
