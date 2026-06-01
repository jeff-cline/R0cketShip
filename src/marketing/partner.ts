import { desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { epartnerApplications } from "../db/schema";

export type ApplicationInput = {
  name: string;
  phone?: string | null;
  businessName?: string | null;
  location?: string | null;
  roofsLast12mo?: string | null;
  seasonsInBusiness?: string | null;
  territories?: string | null;
  teamW2?: string | null;
  team1099?: string | null;
  canvassers?: string | null;
  techUsed?: string | null;
  annualRevenue?: string | null;
  annualEbitda?: string | null;
  approachedBefore?: boolean | null;
  agreeExit?: boolean | null;
};

export async function submitApplication(tenantId: string, input: ApplicationInput) {
  const [row] = await db.insert(epartnerApplications).values({ tenantId, ...input }).returning();
  return row;
}

export async function listApplications(tenantId?: string) {
  const rows = await db.select().from(epartnerApplications).orderBy(desc(epartnerApplications.createdAt));
  return tenantId ? rows.filter((r) => r.tenantId === tenantId) : rows;
}
