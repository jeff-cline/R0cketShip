"use client";
import { useActionState } from "react";
import { signupAction } from "./actions";
import { Field } from "@/app/_ui/primitives";

export function SignupForm({ refCode }: { refCode: string }) {
  const [state, action, pending] = useActionState(signupAction, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="ref" value={refCode} />
      <Field label="Your name">
        <input name="name" placeholder="Your name" className="input" />
      </Field>
      <Field label="Business name">
        <input name="businessName" placeholder="Business name" className="input" />
      </Field>
      <Field label="Email">
        <input name="email" type="email" placeholder="you@company.com" required className="input" />
      </Field>
      <Field label="Password">
        <input name="password" type="password" placeholder="Password (8+ chars)" required className="input" />
      </Field>
      <label className="flex items-center gap-2 text-sm" style={{ color: "var(--ink)" }}>
        <input type="checkbox" name="tos" defaultChecked /> I agree to the{" "}
        <a href="/terms" className="font-semibold" style={{ color: "var(--color-accent)" }}>terms of service</a>
      </label>
      {state?.error && <p className="text-sm" style={{ color: "var(--neg)" }}>{state.error}</p>}
      {refCode && <p className="text-xs" style={{ color: "var(--muted-2)" }}>Referred by a partner — welcome!</p>}
      <button disabled={pending} className="btn btn-primary w-full">
        {pending ? "Creating…" : "Create account & claim $50"}
      </button>
    </form>
  );
}
