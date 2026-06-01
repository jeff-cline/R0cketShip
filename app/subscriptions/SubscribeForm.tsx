"use client";
import { useActionState } from "react";
import { subscribeAction } from "./actions";

export function SubscribeForm() {
  const [state, action, pending] = useActionState(subscribeAction, {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input name="zip" placeholder="ZIP code" required className="input" style={{ maxWidth: 160 }} />
      <select name="offer" className="input" style={{ maxWidth: 280 }}>
        <option value="data">Data / Leads ($1,500/mo)</option>
        <option value="booking">Booking ($4,500/mo)</option>
        <option value="epartner">E-Partnership (negotiated)</option>
      </select>
      <input name="coupon" placeholder="Coupon code (optional)" className="input" style={{ maxWidth: 200 }} />
      <button disabled={pending} className="btn btn-primary">{pending ? "Subscribing…" : "Subscribe ZIP"}</button>
      <span className="w-full text-xs" style={{ color: "var(--muted-2)" }}>Have a code? Enter it to get your discount.</span>
      {state?.error && <span className="text-sm" style={{ color: "var(--neg)" }}>{state.error}</span>}
      {state?.ok && <span className="text-sm" style={{ color: "var(--pos)" }}>{state.ok}</span>}
    </form>
  );
}
