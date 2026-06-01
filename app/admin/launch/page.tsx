import { requireAuth } from "@/src/auth/guard";
import { NAMED_PRESETS } from "@/src/tenant/manage";
import { LaunchForm } from "./LaunchForm";

export default async function LaunchPage() {
  await requireAuth(["god"]);
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold">Launch a white-label</h1>
      <p className="mt-1 text-sm opacity-70">Creates a new niche site on the shared engine. To go live on a new domain: point its DNS to 137.220.56.129, then add the domain to nginx + run certbot on the box.</p>
      <LaunchForm presets={NAMED_PRESETS} />
    </main>
  );
}
