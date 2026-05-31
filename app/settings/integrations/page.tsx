import { requireAuth } from "@/src/auth/guard";
import { getIntegration } from "@/src/delivery/webhook";
import { saveIntegrationAction, testIntegrationAction } from "./actions";

export default async function IntegrationsPage() {
  const ctx = await requireAuth(["customer"]);
  const integ = await getIntegration(ctx.user.id);

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-bold">CRM integration</h1>
      <p className="mt-1 text-sm opacity-70">Each lead you buy is POSTed to this URL as JSON.</p>
      <form action={saveIntegrationAction} className="mt-4 flex flex-col gap-2">
        <input name="webhookUrl" defaultValue={integ?.webhookUrl ?? ""} placeholder="https://your-crm/webhook" className="rounded border p-2" />
        <input type="password" name="webhookSecret" defaultValue={integ?.webhookSecret ?? ""} placeholder="secret (optional)" className="rounded border p-2" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={integ?.active ?? true} /> active</label>
        <button className="self-start rounded bg-black px-3 py-2 text-white">Save</button>
      </form>
      {integ?.lastStatus && <p className="mt-3 text-sm opacity-70">Last delivery: {integ.lastStatus}</p>}
      <form action={testIntegrationAction} className="mt-3"><button className="rounded border px-3 py-1 text-sm">Send test</button></form>
    </main>
  );
}
