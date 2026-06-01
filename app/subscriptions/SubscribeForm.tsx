"use client";
import { useActionState } from "react";
import { subscribeAction } from "./actions";

export function SubscribeForm() {
  const [state, action, pending] = useActionState(subscribeAction, {});
  return (
    <form action={action} className="mt-3 flex flex-wrap items-end gap-2">
      <input name="zip" placeholder="ZIP code" required className="rounded border p-2" />
      <select name="offer" className="rounded border p-2">
        <option value="data">Data / Leads ($1,500/mo)</option>
        <option value="booking">Booking ($4,500/mo)</option>
        <option value="epartner">E-Partnership (negotiated)</option>
      </select>
      <button disabled={pending} className="rounded bg-black px-3 py-2 text-white">{pending ? "Subscribing…" : "Subscribe ZIP"}</button>
      {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      {state?.ok && <span className="text-sm text-green-700">{state.ok}</span>}
    </form>
  );
}
