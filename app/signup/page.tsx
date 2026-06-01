"use client";
import { useActionState } from "react";
import { signupAction } from "./actions";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signupAction, {});
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm opacity-70">Get $50 in leads free — no card required.</p>
      <form action={action} className="mt-6 flex flex-col gap-3">
        <input name="name" placeholder="Your name" className="rounded border p-2" />
        <input name="businessName" placeholder="Business name" className="rounded border p-2" />
        <input name="email" type="email" placeholder="Email" required className="rounded border p-2" />
        <input name="password" type="password" placeholder="Password (8+ chars)" required className="rounded border p-2" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="tos" defaultChecked /> I agree to the <a href="/terms" className="underline">terms of service</a></label>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button disabled={pending} className="rounded bg-black px-4 py-2 text-white">{pending ? "Creating…" : "Create account & claim $50"}</button>
      </form>
      <p className="mt-4 text-sm opacity-70">Already have an account? <a href="/login" className="underline">Sign in</a></p>
    </main>
  );
}
