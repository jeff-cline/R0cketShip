import type { AgeTier } from "../leads/age-tier";

/** Price of a single lead in credits (1 credit = $1), by recency tier. */
export function leadPrice(tier: AgeTier): number {
  switch (tier) {
    case "real_time": return 11;
    case "one_week": return 4;
    case "thirty_day": return 1.44;
    case "older": return 1.44;
  }
}
