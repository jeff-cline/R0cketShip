import Stripe from "stripe";

export function stripeClient(secret: string): Stripe {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (Stripe as any)(secret) as Stripe;
}

export async function startStripeTopup(
  secret: string,
  payment: { id: string; amountUsd: number },
  urls: { success: string; cancel: string },
): Promise<string> {
  const stripe = stripeClient(secret);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: { currency: "usd", product_data: { name: "R0cketShip credits" }, unit_amount: Math.round(payment.amountUsd * 100) },
      quantity: 1,
    }],
    metadata: { paymentId: payment.id },
    success_url: urls.success,
    cancel_url: urls.cancel,
  });
  if (!session.url) throw new Error("stripe session has no url");
  return session.url;
}

export function confirmStripeEvent(
  secret: string,
  webhookSecret: string,
  rawBody: string,
  signature: string,
): { paymentId: string | null } {
  const stripe = stripeClient(secret);
  const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  if (event.type === "checkout.session.completed") {
    const obj = event.data.object as { metadata?: { paymentId?: string } };
    return { paymentId: obj.metadata?.paymentId ?? null };
  }
  return { paymentId: null };
}
