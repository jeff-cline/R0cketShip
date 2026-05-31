import { requireUser } from "@/src/auth/guard";
import { ChangePasswordForm } from "./form";

export default async function PasswordPage() {
  const ctx = await requireUser();
  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl font-bold">{ctx.user.mustResetPassword ? "Set your password" : "Change password"}</h1>
      {ctx.user.mustResetPassword && (
        <p className="mt-2 text-sm opacity-70">You must set a new password before continuing.</p>
      )}
      <ChangePasswordForm />
    </main>
  );
}
