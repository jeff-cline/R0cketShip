export type AgeTier = "real_time" | "one_week" | "thirty_day" | "older";

const DAY = 86400000;

export function ageTier(lastUpdated: Date, now: Date): AgeTier {
  const ms = now.getTime() - lastUpdated.getTime();
  if (ms <= DAY) return "real_time";
  if (ms <= 7 * DAY) return "one_week";
  if (ms <= 30 * DAY) return "thirty_day";
  return "older";
}
