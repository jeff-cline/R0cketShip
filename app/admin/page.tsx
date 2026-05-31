import { requireAuth } from "@/src/auth/guard";
import { listUsers } from "@/src/auth/users";
import { logoutAction } from "@/app/logout/actions";
import { ImpersonationBanner } from "@/app/_components/ImpersonationBanner";

export default async function AdminPage() {
  const ctx = await requireAuth(["god"]);
  const all = await listUsers({ role: "god", tenantId: ctx.user.tenantId });
  return (
    <>
      <ImpersonationBanner />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl font-bold">God admin</h1>
        <p className="mt-1 opacity-70">{all.length} users across all tenants.</p>
        <ul className="mt-4 list-disc pl-6">
          {all.map((u) => <li key={u.id}>{u.email} — {u.role} — {u.tenantId}</li>)}
        </ul>
        <form action={logoutAction} className="mt-6"><button className="rounded border px-3 py-1">Log out</button></form>
      </main>
    </>
  );
}
