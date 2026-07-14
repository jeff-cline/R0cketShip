import { NextResponse } from "next/server";
import { getAdvertiserContext } from "@/src/auth/advertiser";
import {
  loadAdvertisingStripeKeys,
  startAdvertiserDeposit,
} from "@/src/billing/providers/stripe_advertising";
import { MIN_DEPOSIT_CENTS } from "@/src/advertiser/wallet";

export const runtime = "nodejs";

/**
 * Initiate an advertiser deposit. Returns a Stripe Checkout URL when keys are
 * configured; falls back to a manual-request flow otherwise.
 *
 * Request: POST { amountCents: number }
 * Response: { mode: "stripe", url } | { mode: "manual", message } | { error }
 */
export async function POST(req: Request) {
  const ctx = await getAdvertiserContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { amountCents?: number } | null;
  const amountCents = Math.floor(Number(body?.amountCents ?? 0));
  if (!Number.isFinite(amountCents) || amountCents < MIN_DEPOSIT_CENTS) {
    return NextResponse.json(
      { error: "below_minimum", minCents: MIN_DEPOSIT_CENTS },
      { status: 400 },
    );
  }

  const keys = await loadAdvertisingStripeKeys();
  // Build public-facing URL for redirects (works behind nginx — same trick as
  // app/admin/open-as/[tenantId]/route.ts).
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "r0cketship.com";
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const base = `${proto}://${host}`;

  if (!keys) {
    // Manual mode: write a placeholder pending payment that god confirms manually.
    // We don't insert a pending row here — that's `depositManual` territory and
    // it's god-driven from `/admin/advertisers/[id]`. Just signal the UI.
    return NextResponse.json({
      mode: "manual",
      message:
        "Stripe isn't configured for the advertising marketplace yet. We'll email you an invoice — once paid, the credit lands on your wallet.",
    });
  }

  try {
    const { url } = await startAdvertiserDeposit(keys, {
      advertiserId: ctx.advertiser.id,
      amountCents,
      successUrl: `${base}/advertise/billing?deposit=success`,
      cancelUrl: `${base}/advertise/billing?deposit=cancelled`,
    });
    return NextResponse.json({ mode: "stripe", url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "stripe_error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
