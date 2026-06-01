export type SubscriptionOffer = "data" | "booking" | "epartner";

export function baseMonthlyPrice(monthlyPriceDefault: string, offer: SubscriptionOffer): number {
  if (offer === "booking") return 4500;
  if (offer === "epartner") return 0;
  return parseFloat(monthlyPriceDefault);
}

/** Volume discount: 0 existing -> base; 1 -> -10%; 2 -> -20%; 3+ -> -30%. */
export function volumeDiscountedPrice(base: number, existingActiveCount: number): number {
  const pct = existingActiveCount <= 0 ? 0 : existingActiveCount === 1 ? 0.10 : existingActiveCount === 2 ? 0.20 : 0.30;
  return Math.round(base * (1 - pct) * 100) / 100;
}
