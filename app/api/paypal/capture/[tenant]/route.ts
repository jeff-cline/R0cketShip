import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { getIntegrations } from "@/src/integrations/store";
import { capturePaypalOrder } from "@/src/billing/providers/paypal";
import { confirmPayment } from "@/src/billing/topup";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const t = (await db.select().from(tenants).where(eq(tenants.id, tenant)).limit(1))[0];
  if (!t) return new Response("unknown tenant", { status: 404 });
  const i = await getIntegrations(tenant);
  const orderId = new URL(req.url).searchParams.get("token");
  if (i.paypalClientId && i.paypalSecret && orderId) {
    const r = await capturePaypalOrder({ clientId: i.paypalClientId, secret: i.paypalSecret }, orderId);
    if (r.ok && r.paymentId) await confirmPayment(r.paymentId);
  }
  redirect("/billing?paid=1");
}
