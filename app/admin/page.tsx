import { requireAuth } from "@/src/auth/guard";
import { listUsers } from "@/src/auth/users";
import { logoutAction } from "@/app/logout/actions";
import { ImpersonationBanner } from "@/app/_components/ImpersonationBanner";
import { createUserAction } from "@/app/admin/user-actions";

export default async function AdminPage() {
  const ctx = await requireAuth(["god"]);
  const all = await listUsers({ role: "god", tenantId: ctx.user.tenantId });
  return (
    <>
      <ImpersonationBanner />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl font-bold">God admin</h1>
        <a href="/admin/data" className="mt-2 inline-block text-sm underline">→ Data ingestion</a>
        <p className="mt-1 opacity-70">{all.length} users across all tenants.</p>
        <form action={createUserAction} className="mt-4 flex flex-wrap gap-2">
          <input name="email" type="email" placeholder="user@email" required className="rounded border p-2" />
          <input name="tenantId" placeholder="tenant uuid" required className="rounded border p-2" />
          <input name="tempPassword" placeholder="temp password" required className="rounded border p-2" />
          <select name="role" className="rounded border p-2"><option value="manager">manager</option><option value="customer">customer</option></select>
          <button className="rounded bg-black px-3 py-2 text-white">Create user</button>
        </form>
        <ul className="mt-4 list-disc pl-6">
          {all.map((u) => <li key={u.id}>{u.email} — {u.role} — {u.tenantId}</li>)}
        </ul>
        <form action={logoutAction} className="mt-6"><button className="rounded border px-3 py-1">Log out</button></form>
      </main>
    </>
  );
}
