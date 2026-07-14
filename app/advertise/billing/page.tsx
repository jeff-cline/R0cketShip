/**
 * Billing page — wallet hero + deposit form + coupon + ledger.
 *
 * Auth-gated. Reads ?deposit=success|cancelled and ?coupon_* from the URL.
 * Renders inside <AdvertiserShell/>.
 */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getAdvertiserContext } from "@/src/auth/advertiser";
import { walletBalance } from "@/src/advertiser/wallet";
import { db } from "@/src/db/client";
import { advertiserLedger } from "@/src/db/schema";
import { AdvertiserShell } from "@/app/advertise/_layout/AdvertiserShell";
import { DepositForm } from "@/app/advertise/billing/_components/DepositForm";
import { applyCouponAction } from "@/app/advertise/billing/actions";

export const metadata: Metadata = {
  title: "Billing — Advertise with r0cketship",
};

export const dynamic = "force-dynamic";

const COLORS = {
  bg: "#050608",
  surface: "rgba(255,255,255,0.025)",
  surface2: "rgba(255,255,255,0.04)",
  surface3: "rgba(255,255,255,0.06)",
  ink: "#FFFFFF",
  ink2: "#E5E7EB",
  ink3: "#A1A1AA",
  ink4: "#6B7280",
  accent: "#FF6B35",
  sky: "#0EA5E9",
  success: "#10B981",
  rose: "#F43F5E",
  hairline: "rgba(255,255,255,0.08)",
  hairline2: "rgba(255,255,255,0.16)",
};

function formatUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatUsdSigned(cents: number): string {
  const sign = cents > 0 ? "+" : "";
  return sign + formatUsd(cents);
}

function formatDateTime(d: Date): string {
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Pretty label for an advertiser_ledger row type. */
function ledgerTypeLabel(type: string): string {
  switch (type) {
    case "deposit":
      return "Deposit";
    case "signup_bonus":
      return "Signup bonus";
    case "coupon_grant":
      return "Coupon credit";
    case "click_charge":
      return "Click charge";
    case "refund_admin":
      return "Refund (admin)";
    case "admin_grant":
      return "Admin grant";
    default:
      return type;
  }
}

function couponErrorMessage(code: string): string {
  switch (code) {
    case "missing":
      return "Coupon code is required.";
    case "coupon_not_found":
      return "That coupon code doesn't exist.";
    case "coupon_inactive":
      return "That coupon is no longer active.";
    case "coupon_expired":
      return "That coupon has expired.";
    case "coupon_exhausted":
      return "That coupon has already been fully redeemed.";
    case "unsupported_coupon_kind":
      return "That coupon type can't be applied to advertiser wallets.";
    default:
      return code;
  }
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{
    deposit?: string;
    coupon_error?: string;
    coupon_success?: string;
  }>;
}) {
  const ctx = await getAdvertiserContext();
  if (!ctx) {
    redirect("/advertise/login");
  }
  const sp = await searchParams;

  const balance = await walletBalance(ctx.advertiser.id);
  const entries = await db
    .select()
    .from(advertiserLedger)
    .where(eq(advertiserLedger.advertiserId, ctx.advertiser.id))
    .orderBy(desc(advertiserLedger.createdAt))
    .limit(50);

  // Compute running balance backward from current balance so the most recent
  // row reflects the current balance and earlier rows show the historical state.
  // entries are sorted DESC by createdAt; we walk forward and subtract delta
  // to step back in time.
  let runningAfter = balance;
  const withRunning = entries.map((e) => {
    const after = runningAfter;
    runningAfter = runningAfter - e.deltaCents;
    return { ...e, runningBalanceAfter: after };
  });

  return (
    <AdvertiserShell email={ctx.advertiser.email} walletBalanceCents={balance}>
      <div className="mb-8">
        <div
          className="text-xs font-bold uppercase tracking-[0.32em]"
          style={{ color: COLORS.accent }}
        >
          Billing
        </div>
        <h1
          className="mt-1 text-3xl font-black md:text-4xl"
          style={{ letterSpacing: "-0.025em" }}
        >
          Wallet, deposits, and ledger.
        </h1>
        <p className="mt-2 text-sm" style={{ color: COLORS.ink3 }}>
          Add funds. Apply coupons. Audit every cent.
        </p>
      </div>

      {/* Deposit success/cancel banners */}
      {sp?.deposit === "success" && (
        <Banner color={COLORS.success}>
          Deposit received. Funds will land on your wallet within a minute.
        </Banner>
      )}
      {sp?.deposit === "cancelled" && (
        <Banner color={COLORS.ink3}>
          Deposit cancelled. No charge to your card.
        </Banner>
      )}
      {sp?.coupon_success && (
        <Banner color={COLORS.success}>
          Coupon applied — {formatUsd(Number(sp.coupon_success))} credited to your wallet.
        </Banner>
      )}
      {sp?.coupon_error && (
        <Banner color={COLORS.rose}>{couponErrorMessage(sp.coupon_error)}</Banner>
      )}

      {/* Wallet hero */}
      <div
        className="mb-8 rounded-2xl border p-8"
        style={{
          borderColor: COLORS.hairline2,
          background: `linear-gradient(135deg, ${COLORS.accent}1f, transparent)`,
        }}
      >
        <div
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ color: COLORS.ink3 }}
        >
          Wallet balance
        </div>
        <div
          className="mt-2 text-6xl font-black md:text-7xl tabular-nums"
          style={{ color: COLORS.accent, letterSpacing: "-0.03em" }}
        >
          {formatUsd(balance)}
        </div>
        <div className="mt-2 text-sm" style={{ color: COLORS.ink3 }}>
          Available to spend across all campaigns.
        </div>
      </div>

      {/* Deposit + Coupon side by side */}
      <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section
          className="rounded-2xl border p-6"
          style={{ borderColor: COLORS.hairline, background: COLORS.surface }}
        >
          <h2
            className="text-lg font-black"
            style={{ color: COLORS.ink, letterSpacing: "-0.01em" }}
          >
            Deposit
          </h2>
          <p className="mt-1 text-xs" style={{ color: COLORS.ink3 }}>
            Add funds via Stripe Checkout. No expiration; refundable on request.
          </p>
          <div className="mt-5">
            <DepositForm />
          </div>
        </section>

        <section
          className="rounded-2xl border p-6"
          style={{ borderColor: COLORS.hairline, background: COLORS.surface }}
        >
          <h2
            className="text-lg font-black"
            style={{ color: COLORS.ink, letterSpacing: "-0.01em" }}
          >
            Apply coupon
          </h2>
          <p className="mt-1 text-xs" style={{ color: COLORS.ink3 }}>
            Got a partner code? Credit lands instantly — bypasses the $1,000 minimum.
          </p>
          <form action={applyCouponAction} className="mt-5 flex flex-wrap items-center gap-3">
            <input
              type="text"
              name="couponCode"
              placeholder="ROCKETSHIP"
              required
              style={{
                background: COLORS.surface2,
                color: COLORS.ink,
                border: `1px solid ${COLORS.hairline2}`,
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 14,
                outline: "none",
                width: 220,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            />
            <button
              type="submit"
              className="rounded-full px-5 py-2.5 text-sm font-bold"
              style={{ background: COLORS.sky, color: COLORS.ink }}
            >
              Apply
            </button>
          </form>
        </section>
      </div>

      {/* Ledger */}
      <section className="mb-12">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2
              className="text-2xl font-black md:text-3xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              Ledger
            </h2>
            <p className="mt-1 text-sm" style={{ color: COLORS.ink3 }}>
              Last 50 wallet events. Auditable. Immutable.
            </p>
          </div>
        </div>

        {withRunning.length === 0 ? (
          <div
            className="rounded-2xl border p-10 text-center"
            style={{
              borderColor: COLORS.hairline2,
              background: `linear-gradient(180deg, ${COLORS.surface}, ${COLORS.bg})`,
              color: COLORS.ink3,
            }}
          >
            No wallet activity yet. Deposit funds above to get started.
          </div>
        ) : (
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: COLORS.hairline, background: COLORS.surface }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${COLORS.hairline}` }}>
                    {[
                      { label: "Date", align: "left" },
                      { label: "Type", align: "left" },
                      { label: "Description", align: "left" },
                      { label: "Amount", align: "right" },
                      { label: "Balance after", align: "right" },
                    ].map((h) => (
                      <th
                        key={h.label}
                        className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider ${
                          h.align === "left" ? "text-left" : "text-right"
                        }`}
                        style={{ color: COLORS.ink3 }}
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {withRunning.map((e, idx) => {
                    const last = idx === withRunning.length - 1;
                    const isCredit = e.deltaCents > 0;
                    return (
                      <tr
                        key={e.id}
                        style={{
                          borderBottom: last ? "none" : `1px solid ${COLORS.hairline}`,
                        }}
                      >
                        <td className="px-4 py-3 text-left" style={{ color: COLORS.ink3 }}>
                          {formatDateTime(e.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-left" style={{ color: COLORS.ink2 }}>
                          {ledgerTypeLabel(e.type)}
                        </td>
                        <td
                          className="px-4 py-3 text-left"
                          style={{ color: COLORS.ink4, fontSize: 12 }}
                        >
                          {e.refId || ledgerTypeLabel(e.type)}
                        </td>
                        <td
                          className="px-4 py-3 text-right tabular-nums font-semibold"
                          style={{ color: isCredit ? COLORS.success : COLORS.rose }}
                        >
                          {formatUsdSigned(e.deltaCents)}
                        </td>
                        <td
                          className="px-4 py-3 text-right tabular-nums"
                          style={{ color: COLORS.ink }}
                        >
                          {formatUsd(e.runningBalanceAfter)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </AdvertiserShell>
  );
}

function Banner({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div
      className="mb-6 rounded-lg px-4 py-3 text-sm font-semibold"
      style={{
        background: `${color}1c`,
        color: color,
        border: `1px solid ${color}55`,
      }}
    >
      {children}
    </div>
  );
}
