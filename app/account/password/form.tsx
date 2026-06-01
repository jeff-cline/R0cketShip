"use client";
import { useActionState } from "react";
import { changePasswordAction } from "./actions";
import { Field } from "@/app/_ui/primitives";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, {});
  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <Field label="New password">
        <input name="password" type="password" placeholder="••••••••" required className="input" />
      </Field>
      <Field label="Confirm password">
        <input name="confirm" type="password" placeholder="••••••••" required className="input" />
      </Field>
      {state?.error && <p className="text-sm" style={{ color: "var(--neg)" }}>{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
