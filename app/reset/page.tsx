import { Card, Field } from "@/app/_ui/primitives";
import { Rocket } from "@/app/_ui/Rocket";
import { doResetAction } from "./actions";

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; err?: string }>;
}) {
  const { token, err } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16" style={{ background: "var(--bg-app)" }}>
      <Card pad className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--color-accent)" }}>
            <Rocket size={16} color="#fff" />
          </span>
          <h1 className="text-xl font-extrabold">Set a new password</h1>
        </div>

        {!token ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm" style={{ color: "var(--neg)" }}>
              This reset link is invalid or incomplete. Request a new one.
            </p>
            <a href="/forgot" className="btn btn-ghost w-full">Request a reset link</a>
          </div>
        ) : (
          <form action={doResetAction} className="flex flex-col gap-4">
            <input type="hidden" name="token" value={token} />
            {err === "expired" && (
              <p className="text-sm" style={{ color: "var(--neg)" }}>
                This link has expired or was already used. Request a new one.
              </p>
            )}
            {err === "1" && (
              <p className="text-sm" style={{ color: "var(--neg)" }}>
                Passwords must match and be at least 8 characters.
              </p>
            )}
            <Field label="New password">
              <input name="password" type="password" placeholder="••••••••" required minLength={8} className="input" />
            </Field>
            <Field label="Confirm password">
              <input name="confirm" type="password" placeholder="••••••••" required minLength={8} className="input" />
            </Field>
            <button type="submit" className="btn btn-primary w-full">Update password</button>
            <a href="/login" className="text-center text-sm" style={{ color: "var(--muted)" }}>
              Back to sign in
            </a>
          </form>
        )}
      </Card>
    </div>
  );
}
