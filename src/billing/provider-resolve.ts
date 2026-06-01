import { getIntegrations } from "../integrations/store";
import { startStripeTopup } from "./providers/stripe";
import { createPaypalOrder } from "./providers/paypal";

export interface TopupStart { kind: "manual" | "redirect"; url?: string; ref?: string }

export interface ResolvedProvider {
  name: "manual" | "stripe" | "paypal";
  start(payment: { id: string; amountUsd: number }, urls: { success: string; cancel: string }): Promise<TopupStart>;
}

export async function resolveTopupProvider(tenantId: string): Promise<ResolvedProvider> {
  const i = await getIntegrations(tenantId);
  if (i.activePaymentProvider === "stripe" && i.stripeSecret) {
    return {
      name: "stripe",
      start: async (p, urls) => ({ kind: "redirect", url: await startStripeTopup(i.stripeSecret!, p, urls) }),
    };
  }
  if (i.activePaymentProvider === "paypal" && i.paypalClientId && i.paypalSecret) {
    return {
      name: "paypal",
      start: async (p, urls) => {
        const o = await createPaypalOrder({ clientId: i.paypalClientId!, secret: i.paypalSecret! }, p, urls);
        return { kind: "redirect", url: o.approveUrl, ref: o.orderId };
      },
    };
  }
  return { name: "manual", start: async () => ({ kind: "manual" }) };
}
