/**
 * Settings placeholder page. Shows email + member-since for now; the full
 * account-settings UI lands in a later phase.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdvertiserContext } from "@/src/auth/advertiser";
import { walletBalance } from "@/src/advertiser/wallet";
import { AdvertiserShell } from "@/app/advertise/_layout/AdvertiserShell";

export const metadata: Metadata = {
  title: "Settings — Advertise with r0cketship",
};

export const dynamic = "force-dynamic";

const COLORS = {
  bg: "#050608",
  surface: "rgba(255,255,255,0.025)",
  surface2: "rgba(255,255,255,0.04)",
  ink: "#FFFFFF",
  ink2: "#E5E7EB",
  ink3: "#A1A1AA",
  ink4: "#6B7280",
  accent: "#FF6B35",
  hairline: "rgba(255,255,255,0.08)",
  hairline2: "rgba(255,255,255,0.16)",
};

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default async function SettingsPage() {
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
          Settings
        </div>
        <h1
          className="mt-1 text-3xl font-black md:text-4xl"
          style={{ letterSpacing: "-0.025em" }}
        >
          Account settings
        </h1>
        <p className="mt-2 text-sm" style={{ color: COLORS.ink3 }}>
          Account settings coming soon.
        </p>
      </div>

      <div
        className="rounded-2xl border p-6"
        style={{ borderColor: COLORS.hairline, background: COLORS.surface }}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Row label="Email" value={ctx.advertiser.email} />
          <Row label="Member since" value={formatDate(ctx.advertiser.createdAt)} />
          {ctx.advertiser.displayName ? (
            <Row label="Display name" value={ctx.advertiser.displayName} />
          ) : null}
          <Row label="Status" value={ctx.advertiser.status} />
        </div>
      </div>
    </AdvertiserShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: COLORS.hairline, background: COLORS.surface2 }}
    >
      <div
        className="text-[11px] font-bold uppercase tracking-wider"
        style={{ color: COLORS.ink3 }}
      >
        {label}
      </div>
      <div className="mt-1 text-base font-semibold" style={{ color: COLORS.ink }}>
        {value}
      </div>
    </div>
  );
}
