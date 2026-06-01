import { Card, Field } from "@/app/_ui/primitives";
import { Rocket } from "@/app/_ui/Rocket";
import { requestResetAction } from "./actions";

export default async function ForgotPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16" style={{ background: "var(--bg-app)" }}>
      <Card pad className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--color-accent)" }}>
            <Rocket size={16} color="#fff" />
          </span>
          <h1 className="text-xl font-extrabold">Reset your password</h1>
        </div>

        {sent ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              If an account exists for that email, we&apos;ve sent a link to reset your password. Check your inbox.
            </p>
            <a href="/login" className="btn btn-ghost w-full">Back to sign in</a>
          </div>
        ) : (
          <form action={requestResetAction} className="flex flex-col gap-4">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Enter your email and we&apos;ll send you a link to set a new password.
            </p>
            <Field label="Email">
              <input name="email" type="email" placeholder="you@company.com" required className="input" />
            </Field>
            <button type="submit" className="btn btn-primary w-full">Send reset link</button>
            <a href="/login" className="text-center text-sm" style={{ color: "var(--muted)" }}>
              Back to sign in
            </a>
          </form>
        )}
      </Card>
    </div>
  );
}
