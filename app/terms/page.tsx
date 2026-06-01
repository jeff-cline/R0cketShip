import { getCurrentTenant } from "@/src/tenant/context";

export default async function TermsPage() {
  const tenant = await getCurrentTenant();
  const brand = tenant?.domain ?? "this platform";
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 text-sm leading-6">
      <h1 className="text-2xl font-bold">Terms of Service &amp; Acceptable Use</h1>
      <p className="mt-4">By creating an account with {brand}, you agree to the following terms.</p>
      <h2 className="mt-6 font-semibold">Data use</h2>
      <p>Lead data provided by {brand} is licensed to you solely to grow your business through lawful outreach — including door-knocking, canvassing, and direct contact. You agree to use the data only for these purposes.</p>
      <h2 className="mt-6 font-semibold">Compliance</h2>
      <p>You are solely responsible for complying with all applicable federal and state laws and regulations, including the Telephone Consumer Protection Act (TCPA), Do-Not-Call (DNC) registries, CAN-SPAM, and all data-privacy laws. You will scrub against the DNC registry and honor all opt-out requests. {brand} makes no warranty that any contact is permissible for your specific use; that determination is your responsibility.</p>
      <h2 className="mt-6 font-semibold">Prepayment &amp; credits</h2>
      <p>The platform is prepay. Credits are required before leads are delivered. The $50 signup credit is promotional and non-refundable for cash. Purchased credits and leads are non-refundable except at {brand}&rsquo;s discretion.</p>
      <h2 className="mt-6 font-semibold">No resale</h2>
      <p>You may not resell, sublicense, or redistribute lead data to third parties.</p>
      <h2 className="mt-6 font-semibold">Termination</h2>
      <p>{brand} may suspend or terminate accounts that violate these terms or applicable law.</p>
      <p className="mt-6 opacity-70">This summary is provided for convenience and does not constitute legal advice.</p>
    </main>
  );
}
