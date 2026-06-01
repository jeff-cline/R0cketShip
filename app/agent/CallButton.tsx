"use client";
import { useActionState } from "react";
import { callAction } from "./actions";

export function CallButton({ leadNumber }: { leadNumber: string }) {
  const [state, action, pending] = useActionState(callAction, {});
  return (
    <form action={action} className="mt-4 flex flex-wrap items-center gap-2">
      <input name="agentNumber" placeholder="your phone (+1...)" required className="input" style={{ maxWidth: 200 }} />
      <input type="hidden" name="leadNumber" value={leadNumber} />
      <button disabled={pending || !leadNumber} className="btn btn-primary">{pending ? "Dialing…" : "Call lead"}</button>
      {state?.status && <span className="text-sm" style={{ color: "var(--muted)" }}>{state.status}</span>}
    </form>
  );
}
