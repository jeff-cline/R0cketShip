"use client";
import { useActionState } from "react";
import { changePasswordAction } from "./actions";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, {});
  return (
    <form action={action} className="mt-6 flex flex-col gap-3">
      <input name="password" type="password" placeholder="New password" required className="rounded border p-2" />
      <input name="confirm" type="password" placeholder="Confirm password" required className="rounded border p-2" />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button type="submit" disabled={pending} className="rounded bg-black px-4 py-2 text-white">
        {pending ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
