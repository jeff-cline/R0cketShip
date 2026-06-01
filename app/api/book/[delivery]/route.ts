import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/src/db/client";
import { leadDeliveries, customerIntegrations } from "@/src/db/schema";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ delivery: string }> }) {
  const { delivery } = await params;
  const d = (await db.select().from(leadDeliveries).where(eq(leadDeliveries.id, delivery)).limit(1))[0];
  if (d && (d.status === "new" || d.status === "contacted")) {
    await db.update(leadDeliveries).set({ status: "booked", updatedAt: new Date() }).where(eq(leadDeliveries.id, delivery));
  }
  let url = "/";
  if (d) {
    const ci = (await db.select().from(customerIntegrations).where(eq(customerIntegrations.customerId, d.customerId)).limit(1))[0];
    url = ci?.bookingUrl || "/";
  }
  redirect(url);
}
