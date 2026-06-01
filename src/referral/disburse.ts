import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { commissionLedger, payoutBatches } from "../db/schema";
import { getIntegrations } from "../integrations/store";
import { platformTenantId } from "../email/mailbox";
import { getPayoutSettings } from "./payouts";

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function paypalAccessToken(clientId: string, secret: string): Promise<string | null> {
  try {
    const res = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from(`${clientId}:${secret}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { access_token?: string };
    return j.access_token ?? null;
  } catch {
    return null;
  }
}

async function paypalPayout(token: string, email: string, amount: number): Promise<boolean> {
  try {
    const res = await fetch("https://api-m.paypal.com/v1/payments/payouts", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender_batch_header: { email_subject: "Your R0cketShip commission payout", email_message: "Thanks for partnering with us." },
        items: [{ recipient_type: "EMAIL", amount: { value: amount.toFixed(2), currency: "USD" }, receiver: email, note: "Commission payout" }],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function stripeTransfer(secret: string, connectId: string, amount: number): Promise<boolean> {
  try {
    const res = await fetch("https://api.stripe.com/v1/transfers", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ amount: String(Math.round(amount * 100)), currency: "usd", destination: connectId }).toString(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface DisburseResult {
  paid: number; // owners paid
  failed: number;
  manual: number; // no payout method / keys → left for manual
  amountPaid: number;
}

/**
 * Disburse a queued payout batch via each partner's chosen rail, drawing from the
 * platform's PayPal/Stripe keys. Owners without a payout method or missing keys are
 * left as "owed" for manual handling. Marks the batch 'sent' when everything clears.
 */
export async function disburseBatch(batchId: string): Promise<DisburseResult> {
  const platformId = await platformTenantId();
  const integ = platformId ? await getIntegrations(platformId) : null;
  const ppToken = integ?.paypalClientId && integ?.paypalSecret ? await paypalAccessToken(integ.paypalClientId, integ.paypalSecret) : null;

  const rows = await db.select().from(commissionLedger).where(and(eq(commissionLedger.payoutBatchId, batchId), eq(commissionLedger.status, "owed")));
  const byOwner = new Map<string, number>();
  for (const r of rows) byOwner.set(r.ownerUserId, (byOwner.get(r.ownerUserId) ?? 0) + num(r.amount));

  const result: DisburseResult = { paid: 0, failed: 0, manual: 0, amountPaid: 0 };
  for (const [ownerUserId, amount] of byOwner) {
    if (amount <= 0) continue;
    const ps = await getPayoutSettings(ownerUserId);
    let ok = false;
    if (ps.method === "paypal" && ps.paypalEmail && ppToken) {
      ok = await paypalPayout(ppToken, ps.paypalEmail, amount);
    } else if (ps.method === "stripe_connect" && ps.stripeConnectId && integ?.stripeSecret) {
      ok = await stripeTransfer(integ.stripeSecret, ps.stripeConnectId, amount);
    } else {
      result.manual++;
      continue; // no method/keys → leave owed for manual
    }
    if (ok) {
      await db.update(commissionLedger).set({ status: "paid" }).where(and(eq(commissionLedger.payoutBatchId, batchId), eq(commissionLedger.ownerUserId, ownerUserId)));
      result.paid++;
      result.amountPaid += amount;
    } else {
      result.failed++;
    }
  }

  const remaining = await db.select({ id: commissionLedger.id }).from(commissionLedger).where(and(eq(commissionLedger.payoutBatchId, batchId), eq(commissionLedger.status, "owed")));
  if (remaining.length === 0) await db.update(payoutBatches).set({ status: "sent" }).where(eq(payoutBatches.id, batchId));
  return result;
}

/** Convenience: does the platform have PayPal Payouts / Stripe Connect keys configured? */
export async function payoutRailsConfigured(): Promise<{ paypal: boolean; stripe: boolean }> {
  const platformId = await platformTenantId();
  const integ = platformId ? await getIntegrations(platformId) : null;
  return { paypal: Boolean(integ?.paypalClientId && integ?.paypalSecret), stripe: Boolean(integ?.stripeSecret) };
}
