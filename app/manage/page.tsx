import { requireAuth } from "@/src/auth/guard";
import { listUsers } from "@/src/auth/users";
import { logoutAction } from "@/app/logout/actions";
import { ImpersonationBanner } from "@/app/_components/ImpersonationBanner";

export default async function ManagePage() {
  const ctx = await requireAuth(["manager"]);
  const team = await listUsers({ role: ctx.user.role, tenantId: ctx.user.tenantId });
  return (
    <>
      <ImpersonationBanner />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-bold">Manager — {ctx.tenant.domain}</h1>
        <ul className="mt-4 list-disc pl-6">
          {team.map((u) => <li key={u.id}>{u.email} — {u.role}</li>)}
        </ul>
        <form action={logoutAction} className="mt-6"><button className="rounded border px-3 py-1">Log out</button></form>
      </main>
    </>
  );
}
