import { requireAuth } from "@/src/auth/guard";
import { getCurrentTenant } from "@/src/tenant/context";
import { getOrCreateCode } from "@/src/affiliate/code";
import { affiliateStats } from "@/src/affiliate/referral";

export default async function AffiliatePage() {
  const ctx = await requireAuth(["customer"]);
  const code = await getOrCreateCode(ctx.user.id);
  const stats = await affiliateStats(ctx.user.id);
  const tenant = await getCurrentTenant();
  const link = `https://${tenant?.domain ?? "r0cketship.com"}/signup?ref=${code}`;
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold">Affiliate program</h1>
      <p className="mt-1 text-sm opacity-70">Share your link. Earn <strong>10% of the credits</strong> every member you refer buys — as credits in your wallet.</p>
      <div className="mt-4 rounded border p-3">
        <div className="text-sm font-medium">Your referral link</div>
        <code className="mt-1 block break-all text-sm">{link}</code>
      </div>
      <p className="mt-4 text-sm">Referrals: <strong>{stats.referrals}</strong> · Credits earned: <strong>{stats.earnedCredits}</strong></p>
    </main>
  );
}
