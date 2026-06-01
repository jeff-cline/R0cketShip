import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { getIntegrations } from "@/src/integrations/store";
import { confirmStripeEvent } from "@/src/billing/providers/stripe";
import { confirmPayment } from "@/src/billing/topup";

export const runtime = "nodejs";

export async function POST(req: Request, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const t = (await db.select().from(tenants).where(eq(tenants.id, tenant)).limit(1))[0];
  if (!t) return new Response("unknown tenant", { status: 404 });
  const i = await getIntegrations(tenant);
  if (!i.stripeSecret || !i.stripeWebhookSecret) return new Response("stripe not configured", { status: 400 });
  const sig = req.headers.get("stripe-signature") ?? "";
  const body = await req.text();
  try {
    const { paymentId } = confirmStripeEvent(i.stripeSecret, i.stripeWebhookSecret, body, sig);
    if (paymentId) await confirmPayment(paymentId);
    return new Response("ok");
  } catch (e) {
    return new Response(`bad signature: ${(e as Error).message}`, { status: 400 });
  }
}
