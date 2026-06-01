"use client";
import { useActionState } from "react";
import { applyAction } from "./actions";
import { Card, Field, Badge } from "@/app/_ui/primitives";

export default function PartnerPage() {
  const [state, action, pending] = useActionState(applyAction, {});
  if (state?.ok)
    return (
      <div className="min-h-screen" style={{ background: "var(--bg-app)" }}>
        <div className="mx-auto max-w-2xl px-6 py-16">
          <Card pad className="text-center">
            <Badge tone="pos">Received</Badge>
            <h1 className="mt-4 text-2xl font-extrabold">Application received</h1>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              Thank you — we&rsquo;ll be in touch about your territory.
            </p>
          </Card>
        </div>
      </div>
    );
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-app)" }}>
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Card pad>
          <div className="mb-6">
            <div className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-accent)" }}>
              Become an E-Partner
            </div>
            <h1 className="mt-2 text-2xl font-extrabold leading-tight">E-Partnership application</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Application only — 1+ years, $1M+ EBITDA, willing to exit in 3–5 years.
            </p>
          </div>
          <form action={action} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Your name *">
                <input name="name" placeholder="Your name" required className="input" />
              </Field>
            </div>
            <Field label="Phone">
              <input name="phone" placeholder="Phone" className="input" />
            </Field>
            <Field label="Business name">
              <input name="businessName" placeholder="Business name" className="input" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Location">
                <input name="location" placeholder="Location" className="input" />
              </Field>
            </div>
            <Field label="Roofs in last 12 months">
              <input name="roofsLast12mo" placeholder="Roofs in last 12 months" className="input" />
            </Field>
            <Field label="Seasons in business">
              <input name="seasonsInBusiness" placeholder="Seasons in business" className="input" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Territories / areas">
                <input name="territories" placeholder="Territories / areas" className="input" />
              </Field>
            </div>
            <Field label="# W-2">
              <input name="teamW2" placeholder="# W-2" className="input" />
            </Field>
            <Field label="# 1099">
              <input name="team1099" placeholder="# 1099" className="input" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="# canvassers / door knockers">
                <input name="canvassers" placeholder="# canvassers / door knockers" className="input" />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Technology you use today">
                <input name="techUsed" placeholder="Technology you use today" className="input" />
              </Field>
            </div>
            <Field label="Annual revenue">
              <input name="annualRevenue" placeholder="Annual revenue" className="input" />
            </Field>
            <Field label="Annual EBITDA">
              <input name="annualEbitda" placeholder="Annual EBITDA" className="input" />
            </Field>
            <label className="flex items-center gap-2 text-sm sm:col-span-2" style={{ color: "var(--ink)" }}>
              <input type="checkbox" name="approachedBefore" /> Approached to sell before
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2" style={{ color: "var(--ink)" }}>
              <input type="checkbox" name="agreeExit" /> Agree to exit in 3–5 years if acquired
            </label>
            {state?.error && <p className="text-sm sm:col-span-2" style={{ color: "var(--neg)" }}>{state.error}</p>}
            <div className="sm:col-span-2">
              <button disabled={pending} className="btn btn-primary w-full">
                {pending ? "Submitting…" : "Apply now"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
