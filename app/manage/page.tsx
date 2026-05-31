import { requireAuth } from "@/src/auth/guard";
import { listUsers } from "@/src/auth/users";
import { logoutAction } from "@/app/logout/actions";
import { ImpersonationBanner } from "@/app/_components/ImpersonationBanner";
import { createUserAction, resetUserAction, impersonateAction } from "@/app/admin/user-actions";

export default async function ManagePage() {
  const ctx = await requireAuth(["manager"]);
  const team = await listUsers({ role: ctx.user.role, tenantId: ctx.user.tenantId });
  return (
    <>
      <ImpersonationBanner />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-bold">Manager — {ctx.tenant.domain}</h1>
        <form action={createUserAction} className="mt-4 flex flex-wrap gap-2">
          <input name="email" type="email" placeholder="customer@email" required className="rounded border p-2" />
          <input name="tempPassword" placeholder="temp password" required className="rounded border p-2" />
          <input type="hidden" name="role" value="customer" />
          <button className="rounded bg-black px-3 py-2 text-white">Add customer</button>
        </form>
        <ul className="mt-4 space-y-2">
          {team.filter((u) => u.role === "customer").map((u) => (
            <li key={u.id} className="flex items-center gap-3">
              <span>{u.email}</span>
              <form action={impersonateAction}><input type="hidden" name="userId" value={u.id} /><button className="text-sm underline">Impersonate</button></form>
              <form action={resetUserAction} className="flex gap-1">
                <input type="hidden" name="userId" value={u.id} />
                <input name="tempPassword" placeholder="new temp" className="rounded border p-1 text-sm" />
                <button className="text-sm underline">Reset</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={logoutAction} className="mt-6"><button className="rounded border px-3 py-1">Log out</button></form>
      </main>
    </>
  );
}
