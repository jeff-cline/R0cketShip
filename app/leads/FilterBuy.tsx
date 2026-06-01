"use client";
import { useActionState } from "react";
import { buyAction } from "./actions";

export function FilterBuy() {
  const [state, action, pending] = useActionState(buyAction, {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input name="zip" placeholder="ZIP(s) comma-sep" className="input" />
      <select name="segment" className="input"><option value="">any segment</option><option value="residential">residential</option><option value="commercial">commercial</option></select>
      <select name="tier" className="input"><option value="">any age</option><option value="real_time">real_time</option><option value="one_week">one_week</option><option value="thirty_day">thirty_day</option><option value="older">older</option></select>
      <select name="score" className="input"><option value="">any score</option><option value="low">low</option><option value="medium">medium</option><option value="high">high</option></select>
      <input name="qty" type="number" min="1" max="100" defaultValue="5" className="input w-24" />
      <button disabled={pending} className="btn btn-primary">{pending ? "Buying…" : "Buy freshest"}</button>
      {state?.error && <span className="text-sm" style={{ color: "var(--neg)" }}>{state.error}</span>}
      {state?.ok && <span className="text-sm" style={{ color: "var(--pos)" }}>{state.ok}</span>}
    </form>
  );
}
