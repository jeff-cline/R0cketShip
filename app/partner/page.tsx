"use client";
import { useActionState } from "react";
import { applyAction } from "./actions";

export default function PartnerPage() {
  const [state, action, pending] = useActionState(applyAction, {});
  if (state?.ok) return <main className="mx-auto max-w-md px-6 py-16"><h1 className="text-2xl font-bold">Application received</h1><p className="mt-2 opacity-70">Thank you — we&rsquo;ll be in touch about your territory.</p></main>;
  return (
    <main className="mx-auto max-w-lg px-6 py-12">
      <h1 className="text-2xl font-bold">E-Partnership application</h1>
      <p className="mt-1 text-sm opacity-70">Application only — 1+ years, $1M+ EBITDA, willing to exit in 3–5 years.</p>
      <form action={action} className="mt-6 grid grid-cols-2 gap-2 text-sm">
        <input name="name" placeholder="Your name *" required className="col-span-2 rounded border p-2" />
        <input name="phone" placeholder="Phone" className="rounded border p-2" />
        <input name="businessName" placeholder="Business name" className="rounded border p-2" />
        <input name="location" placeholder="Location" className="col-span-2 rounded border p-2" />
        <input name="roofsLast12mo" placeholder="Roofs in last 12 months" className="rounded border p-2" />
        <input name="seasonsInBusiness" placeholder="Seasons in business" className="rounded border p-2" />
        <input name="territories" placeholder="Territories / areas" className="col-span-2 rounded border p-2" />
        <input name="teamW2" placeholder="# W-2" className="rounded border p-2" />
        <input name="team1099" placeholder="# 1099" className="rounded border p-2" />
        <input name="canvassers" placeholder="# canvassers / door knockers" className="col-span-2 rounded border p-2" />
        <input name="techUsed" placeholder="Technology you use today" className="col-span-2 rounded border p-2" />
        <input name="annualRevenue" placeholder="Annual revenue" className="rounded border p-2" />
        <input name="annualEbitda" placeholder="Annual EBITDA" className="rounded border p-2" />
        <label className="col-span-2 flex items-center gap-2"><input type="checkbox" name="approachedBefore" /> Approached to sell before</label>
        <label className="col-span-2 flex items-center gap-2"><input type="checkbox" name="agreeExit" /> Agree to exit in 3–5 years if acquired</label>
        {state?.error && <p className="col-span-2 text-sm text-red-600">{state.error}</p>}
        <button disabled={pending} className="col-span-2 mt-2 rounded bg-black px-4 py-2 text-white">{pending ? "Submitting…" : "Apply now"}</button>
      </form>
    </main>
  );
}
