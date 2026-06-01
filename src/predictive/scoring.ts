import type { AgeTier } from "../leads/age-tier";

export function predictiveScore(input: {
  scoreCategory: string | null;
  convertedElsewhere: boolean;
  ageTier: AgeTier;
  hasCompany: boolean;
}): number {
  let s = 0;
  s += input.scoreCategory === "high" ? 40 : input.scoreCategory === "medium" ? 25 : 10;
  if (input.convertedElsewhere) s += 30;
  s += input.ageTier === "real_time" ? 20 : input.ageTier === "one_week" ? 12 : input.ageTier === "thirty_day" ? 6 : 2;
  if (input.hasCompany) s += 5;
  return Math.min(100, s);
}
