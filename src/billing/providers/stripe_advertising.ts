/**
 * Phase 2: dedicated Stripe provider for the advertising marketplace.
 *
 * Uses a SEPARATE key set from the customer/tenant Stripe so advertiser
 * revenue is cleanly segregated in Stripe reporting:
 *   - advertising_stripe_secret_enc       (server-side secret)
 *   - advertising_stripe_publishable      (browser-side publishable)
 *   - advertising_stripe_webhook_secret_enc (webhook signature secret)
 *
 * All three live on the r0cketship.com tenant row in `tenant_integrations`.
 *
 * Ships with a graceful fallback to manual mode: if keys aren't configured
 * yet, `loadAdvertisingStripeKeys()` returns null and the deposit UI surfaces
 * a "we'll invoice you" path that god handles via `depositManual`.
 */
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { tenantIntegrations, tenants } from "../../db/schema";
import { decryptSecret } from "../../crypto/secrets";
import { depositStripe } from "../../advertiser/wallet";

export interface AdvertisingStripeKeys {
  secret: string;
  publishable: string | null;
  webhookSecret: string;
}

/** Look up advertising Stripe keys from the r0cketship.com tenant row. */
export async function loadAdvertisingStripeKeys(): Promise<AdvertisingStripeKeys | null> {
  const row = (
    await db
      .select({
        secretEnc: tenantIntegrations.advertisingStripeSecretEnc,
        publishable: tenantIntegrations.advertisingStripePublishable,
        webhookSecretEnc: tenantIntegrations.advertisingStripeWebhookSecretEnc,
      })
      .from(tenantIntegrations)
      .innerJoin(tenants, eq(tenants.id, tenantIntegrations.tenantId))
      .where(eq(tenants.domain, "r0cketship.com"))
      .limit(1)
  )[0];
  if (!row) return null;
  const secret = decryptSecret(row.secretEnc ?? null);
  const webhookSecret = decryptSecret(row.webhookSecretEnc ?? null);
  if (!secret || !webhookSecret) return null;
  return { secret, publishable: row.publishable ?? null, webhookSecret };
}

export function isAdvertisingStripeReady(keys: AdvertisingStripeKeys | null): keys is AdvertisingStripeKeys {
  return keys !== null;
}

function stripeClient(secret: string): Stripe {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (Stripe as any)(secret) as Stripe;
}

/** Create a Checkout Session for an advertiser deposit. Returns the URL the
 *  browser should redirect to. Throws if Stripe rejects the request. */
export async function startAdvertiserDeposit(
  keys: AdvertisingStripeKeys,
  input: {
    advertiserId: string;
    amountCents: number;
    successUrl: string;
    cancelUrl: string;
  },
): Promise<{ url: string; sessionId: string }> {
  const stripe = stripeClient(keys.secret);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "r0cketship advertising credit" },
          unit_amount: input.amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      advertiserId: input.advertiserId,
      kind: "advertiser_deposit",
      amountCents: String(input.amountCents),
    },
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
  });
  if (!session.url) throw new Error("stripe-advertising: checkout session has no url");
  return { url: session.url, sessionId: session.id };
}

/**
 * Verify a webhook event against the advertising webhook secret and, if it's
 * a successful checkout, credit the advertiser wallet idempotently.
 *
 * Returns the advertiserId + amount credited (or null if event isn't relevant).
 */
export async function handleAdvertiserStripeWebhook(
  keys: AdvertisingStripeKeys,
  rawBody: string,
  signature: string,
): Promise<
  | { kind: "credited"; advertiserId: string; amountCents: number; alreadyProcessed: boolean }
  | { kind: "ignored" }
> {
  const stripe = stripeClient(keys.secret);
  const event = stripe.webhooks.constructEvent(rawBody, signature, keys.webhookSecret);
  if (event.type !== "checkout.session.completed") {
    return { kind: "ignored" };
  }
  const obj = event.data.object as {
    id: string;
    metadata?: { advertiserId?: string; kind?: string; amountCents?: string };
    amount_total?: number | null;
    payment_status?: string | null;
  };
  if (obj.metadata?.kind !== "advertiser_deposit" || !obj.metadata.advertiserId) {
    return { kind: "ignored" };
  }
  if (obj.payment_status && obj.payment_status !== "paid") {
    return { kind: "ignored" };
  }
  const advertiserId = obj.metadata.advertiserId;
  const amountCents = obj.amount_total ?? Number(obj.metadata.amountCents ?? "0");
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return { kind: "ignored" };
  }
  const result = await depositStripe({
    advertiserId,
    amountCents,
    stripePaymentId: obj.id,
  });
  if (!result.ok) return { kind: "ignored" };
  return {
    kind: "credited",
    advertiserId,
    amountCents,
    alreadyProcessed: result.alreadyProcessed,
  };
}
