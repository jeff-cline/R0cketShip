import { NextResponse } from "next/server";
import { getAdvertiserContext } from "@/src/auth/advertiser";
import { estimateReach, parseTargeting } from "@/src/advertiser/targeting";

export const runtime = "nodejs";

/**
 * POST { filters: TargetingFilters } → { count: number }
 *
 * Auth-gated. The targeting module owns its own 60s in-memory cache, so the UI
 * can spam this endpoint on every keystroke and we'll only hit the DB once a
 * minute per unique filter fingerprint.
 */
export async function POST(req: Request) {
  const ctx = await getAdvertiserContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { filters?: unknown } | null;
  const filters = parseTargeting(body?.filters);
  try {
    const count = await estimateReach(filters);
    return NextResponse.json({ count });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "reach_estimate_error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
