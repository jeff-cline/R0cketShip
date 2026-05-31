import { getAuthContext, canAccess } from "@/src/auth/context";
import { myDeliveries, deliveriesCsv } from "@/src/delivery/crm";

export const runtime = "nodejs";

export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx || !canAccess(ctx.user.role, ["customer"])) {
    return new Response("forbidden", { status: 403 });
  }
  const rows = await myDeliveries(ctx.user.id);
  const csv = deliveriesCsv(rows as unknown as Record<string, unknown>[]);
  return new Response(csv, {
    headers: { "content-type": "text/csv", "content-disposition": 'attachment; filename="leads.csv"' },
  });
}
