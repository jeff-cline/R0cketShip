"use client";
import { useActionState } from "react";
import { buyAction } from "./actions";

export function FilterBuy() {
  const [state, action, pending] = useActionState(buyAction, {});
  return (
    <form action={action} className="mt-4 flex flex-wrap items-end gap-2">
      <input name="zip" placeholder="ZIP(s) comma-sep" className="rounded border p-2" />
      <select name="segment" className="rounded border p-2"><option value="">any segment</option><option value="residential">residential</option><option value="commercial">commercial</option></select>
      <select name="tier" className="rounded border p-2"><option value="">any age</option><option value="real_time">real_time</option><option value="one_week">one_week</option><option value="thirty_day">thirty_day</option><option value="older">older</option></select>
      <select name="score" className="rounded border p-2"><option value="">any score</option><option value="low">low</option><option value="medium">medium</option><option value="high">high</option></select>
      <input name="qty" type="number" min="1" max="100" defaultValue="5" className="w-20 rounded border p-2" />
      <button disabled={pending} className="rounded bg-black px-3 py-2 text-white">{pending ? "Buying…" : "Buy freshest"}</button>
      {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      {state?.ok && <span className="text-sm text-green-700">{state.ok}</span>}
    </form>
  );
}
