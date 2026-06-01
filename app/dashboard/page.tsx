import { requireAuth } from "@/src/auth/guard";
import { logoutAction } from "@/app/logout/actions";
import { ImpersonationBanner } from "@/app/_components/ImpersonationBanner";

export default async function DashboardPage() {
  const ctx = await requireAuth(["customer"]);
  return (
    <>
      <ImpersonationBanner />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold">Customer dashboard</h1>
        <p className="mt-2">Logged in as {ctx.user.email} — customer at {ctx.tenant.domain}.</p>
        <a href="/billing" className="mt-3 inline-block text-sm underline">→ Credits & billing</a>
        <a href="/leads" className="mt-3 ml-3 inline-block text-sm underline">→ Buy leads</a>
        <a href="/subscriptions" className="mt-3 ml-3 inline-block text-sm underline">→ ZIP subscriptions</a>
        <a href="/affiliate" className="mt-3 ml-3 inline-block text-sm underline">→ Affiliate</a>
        <a href="/crm" className="mt-3 ml-3 inline-block text-sm underline">→ My leads (CRM)</a>
        <a href="/settings/integrations" className="mt-3 ml-3 inline-block text-sm underline">→ Integration</a>
        <form action={logoutAction} className="mt-6"><button className="rounded border px-3 py-1">Log out</button></form>
      </main>
    </>
  );
}
