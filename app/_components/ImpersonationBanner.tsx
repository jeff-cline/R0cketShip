import { getAuthContext } from "@/src/auth/context";
import { exitImpersonationAction } from "@/app/admin/impersonate-actions";

export async function ImpersonationBanner() {
  const ctx = await getAuthContext();
  if (!ctx?.impersonator) return null;
  return (
    <div className="flex items-center justify-between bg-amber-500 px-4 py-2 text-sm text-black">
      <span>Impersonating <strong>{ctx.user.email}</strong> (as {ctx.impersonator.email})</span>
      <form action={exitImpersonationAction}>
        <button type="submit" className="rounded bg-black px-3 py-1 text-white">Exit</button>
      </form>
    </div>
  );
}
