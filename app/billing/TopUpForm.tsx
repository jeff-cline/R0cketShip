"use client";
import { useActionState } from "react";
import { topUpAction } from "./actions";

export function TopUpForm() {
  const [state, action, pending] = useActionState(topUpAction, {});
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input name="amount" type="number" min="1" step="1" placeholder="USD amount" required className="input w-36" />
      <input name="coupon" placeholder="coupon (optional)" className="input" />
      <button disabled={pending} className="btn btn-primary">{pending ? "Submitting…" : "Add credits"}</button>
      {state?.error && <span className="text-sm" style={{ color: "var(--neg)" }}>{state.error}</span>}
      {state?.ok && <span className="text-sm" style={{ color: "var(--pos)" }}>Top-up requested — pending confirmation.</span>}
    </form>
  );
}
