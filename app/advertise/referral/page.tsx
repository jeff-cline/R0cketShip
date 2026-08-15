/**
 * Referral placeholder page. Real implementation lands in a later phase.
 * Wrapped in AdvertiserShell so the chrome stays consistent.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdvertiserContext } from "@/src/auth/advertiser";
import { walletBalance } from "@/src/advertiser/wallet";
import { AdvertiserShell } from "@/app/advertise/_layout/AdvertiserShell";

export const metadata: Metadata = {
  title: "Referral — Advertise with r0cketship",
};

export const dynamic = "force-dynamic";

const COLORS = {
  bg: "#050608",
  surface: "rgba(255,255,255,0.025)",
  ink: "#FFFFFF",
  ink3: "#A1A1AA",
  ink4: "#6B7280",
  accent: "#FF6B35",
  hairline2: "rgba(255,255,255,0.16)",
};

export default async function ReferralPage() {
  const ctx = await getAdvertiserContext();
  if (!ctx) {
    redirect("/advertise/login");
  }
  const balance = await walletBalance(ctx.advertiser.id);

  return (
    <AdvertiserShell email={ctx.advertiser.email} walletBalanceCents={balance}>
      <div className="mb-8">
        <div
          className="text-xs font-bold uppercase tracking-[0.32em]"
          style={{ color: COLORS.accent }}
        >
          Referral
        </div>
        <h1
          className="mt-1 text-3xl font-black md:text-4xl"
          style={{ letterSpacing: "-0.025em" }}
        >
          Referral program
        </h1>
      </div>

      <div
        className="rounded-2xl border p-10 text-center"
        style={{
          borderColor: COLORS.hairline2,
          background: `linear-gradient(180deg, ${COLORS.surface}, ${COLORS.bg})`,
        }}
      >
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: `${COLORS.accent}26`, color: COLORS.accent, fontSize: 22 }}
        >
          ↗
        </div>
        <h3 className="text-2xl font-black" style={{ letterSpacing: "-0.02em" }}>
          Referral program coming soon.
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: COLORS.ink3 }}>
          Your unique referral link will appear here.
        </p>
      </div>
    </AdvertiserShell>
  );
}
