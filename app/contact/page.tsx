import { getCurrentTenant } from "@/src/tenant/context";
export default async function ContactPage() {
  const t = await getCurrentTenant();
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold">Contact</h1>
      <p className="mt-4 opacity-80">Questions about {t?.domain}? Call 1-770-ROOFERS or apply to our <a href="/partner" className="underline">E-Partnership program</a>. Existing customers can <a href="/login" className="underline">sign in</a> to manage their account.</p>
    </main>
  );
}
