"use client";
import { useActionState } from "react";
import { callAction } from "./actions";

export function CallButton({ leadNumber }: { leadNumber: string }) {
  const [state, action, pending] = useActionState(callAction, {});
  return (
    <form action={action} className="mt-2 flex items-center gap-2">
      <input name="agentNumber" placeholder="your phone (+1...)" required className="rounded border p-2 text-sm" />
      <input type="hidden" name="leadNumber" value={leadNumber} />
      <button disabled={pending || !leadNumber} className="rounded bg-green-600 px-3 py-2 text-sm text-white">{pending ? "Dialing…" : "Call lead"}</button>
      {state?.status && <span className="text-sm opacity-80">{state.status}</span>}
    </form>
  );
}
