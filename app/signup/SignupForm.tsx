"use client";
import { useActionState } from "react";
import { signupAction } from "./actions";

export function SignupForm({ refCode }: { refCode: string }) {
  const [state, action, pending] = useActionState(signupAction, {});
  return (
    <form action={action} className="mt-6 flex flex-col gap-3">
      <input type="hidden" name="ref" value={refCode} />
      <input name="name" placeholder="Your name" className="rounded border p-2" />
      <input name="businessName" placeholder="Business name" className="rounded border p-2" />
      <input name="email" type="email" placeholder="Email" required className="rounded border p-2" />
      <input name="password" type="password" placeholder="Password (8+ chars)" required className="rounded border p-2" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="tos" defaultChecked /> I agree to the <a href="/terms" className="underline">terms of service</a></label>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {refCode && <p className="text-xs opacity-60">Referred by a partner — welcome!</p>}
      <button disabled={pending} className="rounded bg-black px-4 py-2 text-white">{pending ? "Creating…" : "Create account & claim $50"}</button>
    </form>
  );
}
