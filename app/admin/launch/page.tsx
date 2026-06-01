import { requireAuth } from "@/src/auth/guard";
import { NAMED_PRESETS } from "@/src/tenant/manage";
import { PageHeader } from "@/app/_ui/primitives";
import { DnsInstructions } from "@/app/admin/_shell/DnsInstructions";
import { LaunchForm } from "./LaunchForm";

export default async function LaunchPage() {
  await requireAuth(["god"]);
  return (
    <>
      <PageHeader title="Add white-label" subtitle="Spin up a new niche site on the r0cketship backend." />
      <LaunchForm presets={NAMED_PRESETS} />
      <div className="mt-6">
        <DnsInstructions domain="yourdomain.co" />
      </div>
    </>
  );
}
