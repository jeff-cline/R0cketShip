/**
 * New campaign — server component wrapping the shared <CampaignForm/>.
 *
 * Auth-gates. Reads ?error= from query string to surface validation problems
 * after a server-action redirect (so the form can stay progressively-enhanced).
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdvertiserContext } from "@/src/auth/advertiser";
import { walletBalance } from "@/src/advertiser/wallet";
import { AdvertiserShell } from "@/app/advertise/_layout/AdvertiserShell";
import { CampaignForm } from "@/app/advertise/campaigns/_components/CampaignForm";
import { listNiches, US_STATES } from "@/src/advertiser/catalog";
import { createCampaignAction } from "@/app/advertise/campaigns/actions";

export const metadata: Metadata = {
  title: "New campaign — Advertise with r0cketship",
};

export const dynamic = "force-dynamic";

const COLORS = {
  ink: "#FFFFFF",
  ink3: "#A1A1AA",
  accent: "#FF6B35",
};

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const ctx = await getAdvertiserContext();
  if (!ctx) {
    redirect("/advertise/login");
  }
  const sp = await searchParams;

  const balance = await walletBalance(ctx.advertiser.id);

  return (
    <AdvertiserShell email={ctx.advertiser.email} walletBalanceCents={balance}>
      <div className="mb-8">
        <a
          href="/advertise/campaigns"
          className="text-xs font-bold uppercase tracking-[0.32em]"
          style={{ color: COLORS.accent }}
        >
          ← Campaigns
        </a>
        <h1
          className="mt-1 text-3xl font-black md:text-4xl"
          style={{ letterSpacing: "-0.025em" }}
        >
          New campaign
        </h1>
        <p className="mt-2 text-sm" style={{ color: COLORS.ink3 }}>
          Set the creative, the CPA, and the audience. Save to publish.
        </p>
      </div>

      <CampaignForm
        action={createCampaignAction}
        mode="create"
        submitLabel="Save campaign"
        error={sp?.error}
        availableNiches={await listNiches()}
        usStates={US_STATES}
        initial={{
          name: "",
          emailSubject: "",
          emailBodyHtml: "",
          ctaUrl: "",
          ctaLabel: "Learn more",
          maxCpaDollars: "5.00",
          dailyBudgetDollars: "",
          filters: {},
        }}
      />
    </AdvertiserShell>
  );
}
