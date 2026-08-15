"use client";
import { Card, SectionTitle, Field } from "@/app/_ui/primitives";
import { saveOfferAction } from "./actions";
import type { OutreachOffer } from "@/src/outreach/offers";

export function OutreachForm({ offer }: { offer: OutreachOffer | null }) {
  return (
    <form action={saveOfferAction}>
      <Card>
        <SectionTitle hint="dripped to every new lead in your database">Outreach offer</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Title" hint="the headline of your email">
              <input name="title" required defaultValue={offer?.title ?? ""} className="input" placeholder="Get your free roof inspection" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description">
              <textarea name="description" rows={3} required defaultValue={offer?.description ?? ""} className="input" placeholder="We're booking inspections in your area this week — see if you qualify." />
            </Field>
          </div>
          <Field label="Call-to-action link" hint="booking / lander / checkout">
            <input name="ctaUrl" required defaultValue={offer?.ctaUrl ?? ""} className="input" placeholder="https://book.yoursite.com" />
          </Field>
          <Field label="Logo image URL" hint="optional">
            <input name="logoUrl" defaultValue={offer?.logoUrl ?? ""} className="input" placeholder="https://…/logo.png" />
          </Field>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input type="checkbox" id="active" name="active" defaultChecked={offer?.active ?? true} className="h-4 w-4" />
            <label htmlFor="active" className="text-sm font-medium">Active — send outreach for new leads</label>
          </div>
        </div>
        <div className="mt-4">
          <button className="btn btn-primary">Save offer</button>
        </div>
      </Card>
    </form>
  );
}
