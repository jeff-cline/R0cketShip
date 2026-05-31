"use client";
import { useActionState } from "react";
import { topUpAction } from "./actions";

export function TopUpForm() {
  const [state, action, pending] = useActionState(topUpAction, {});
  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-2">
      <input name="amount" type="number" min="1" step="1" placeholder="USD amount" required className="rounded border p-2" />
      <input name="coupon" placeholder="coupon (optional)" className="rounded border p-2" />
      <button disabled={pending} className="rounded bg-black px-3 py-2 text-white">{pending ? "Submitting…" : "Add credits"}</button>
      {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
      {state?.ok && <span className="text-sm text-green-700">Top-up requested — pending confirmation.</span>}
    </form>
  );
}
