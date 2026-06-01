"use client";
import { useActionState } from "react";
import { loginAction } from "./actions";
import { Card, Field } from "@/app/_ui/primitives";
import { Rocket } from "@/app/_ui/Rocket";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, {});
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16" style={{ background: "var(--bg-app)" }}>
      <Card pad className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--color-accent)" }}>
            <Rocket size={16} color="#fff" />
          </span>
          <h1 className="text-xl font-extrabold">Sign in</h1>
        </div>
        <form action={action} className="flex flex-col gap-4">
          <Field label="Email">
            <input name="email" type="email" placeholder="you@company.com" required className="input" />
          </Field>
          <Field label="Password">
            <input name="password" type="password" placeholder="••••••••" required className="input" />
          </Field>
          {state?.error && <p className="text-sm" style={{ color: "var(--neg)" }}>{state.error}</p>}
          <button type="submit" disabled={pending} className="btn btn-primary w-full">
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </Card>
    </div>
  );
}
