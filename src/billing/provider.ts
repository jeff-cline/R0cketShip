export interface TopupStart {
  kind: "manual" | "redirect";
  url?: string;
}

export interface PaymentProvider {
  startTopup(payment: { id: string; amountUsd: number }): Promise<TopupStart>;
}

export const manualProvider: PaymentProvider = {
  async startTopup() {
    return { kind: "manual" };
  },
};

/**
 * Returns the provider implementation. Stripe/PayPal are not wired yet (no keys),
 * so they fall back to the manual provider. When wired, return their adapters here.
 */
export function getProvider(_name: "manual" | "stripe" | "paypal"): PaymentProvider {
  return manualProvider;
}
