import { NextResponse } from "next/server";
import { tick } from "@/src/outreach/scheduler";
import { marketplaceTick } from "@/src/advertiser/cron";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Driven by the box crontab every minute: top up mailbox capacity, then drain due outreach sends. */
export async function POST(req: Request) {
  const key = process.env.CRON_KEY;
  if (!key || req.headers.get("x-cron-key") !== key) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const limit = Number(new URL(req.url).searchParams.get("limit") ?? 200);
  const phase1 = await tick(Number.isFinite(limit) ? limit : 200);
  // Phase 2 marketplace maintenance — daily reset + out-of-budget reactivation.
  const marketplace = await marketplaceTick().catch((err) => ({
    dailyReset: false,
    reactivated: 0,
    error: err instanceof Error ? err.message : "unknown",
  }));
  return NextResponse.json({ ...phase1, marketplace });
}
