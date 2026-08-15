import { NextResponse } from "next/server";
import {
  handleAdvertiserStripeWebhook,
  loadAdvertisingStripeKeys,
} from "@/src/billing/providers/stripe_advertising";

export const runtime = "nodejs";

/**
 * Stripe webhook endpoint for the advertising marketplace.
 *
 * Configure this URL in your advertising Stripe account:
 *   https://r0cketship.com/api/webhooks/stripe-advertising
 *
 * The signing secret goes into `tenant_integrations.advertising_stripe_webhook_secret_enc`
 * on the r0cketship.com tenant row (via `/admin/integrations` once that UI ships).
 */
export async function POST(req: Request) {
  const keys = await loadAdvertisingStripeKeys();
  if (!keys) {
    // Keys not yet configured — return 200 so Stripe doesn't endlessly retry,
    // but log so god notices. In manual-mode operation, no webhook should
    // arrive yet; if one does, we accept-and-ignore.
    return NextResponse.json({ ok: true, mode: "manual_fallback" });
  }
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ ok: false, error: "missing signature" }, { status: 400 });
  }
  const rawBody = await req.text();
  try {
    const result = await handleAdvertiserStripeWebhook(keys, rawBody, signature);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
