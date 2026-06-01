import { requireUser } from "@/src/auth/guard";
import { ChangePasswordForm } from "./form";
import { Card } from "@/app/_ui/primitives";
import { Rocket } from "@/app/_ui/Rocket";

export default async function PasswordPage() {
  const ctx = await requireUser();
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16" style={{ background: "var(--bg-app)" }}>
      <Card pad className="w-full max-w-sm">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--color-accent)" }}>
            <Rocket size={16} color="#fff" />
          </span>
          <h1 className="text-xl font-extrabold">{ctx.user.mustResetPassword ? "Set your password" : "Change password"}</h1>
        </div>
        {ctx.user.mustResetPassword && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>You must set a new password before continuing.</p>
        )}
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
