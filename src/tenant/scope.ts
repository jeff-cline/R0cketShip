import type { userRole } from "../db/schema";

type Role = (typeof userRole.enumValues)[number];

/**
 * The tenant_id a query should be filtered by for this actor.
 * `god` returns null, meaning "no tenant filter — cross-tenant access".
 */
export function tenantFilter(actor: { role: Role; tenantId: string }): string | null {
  return actor.role === "god" ? null : actor.tenantId;
}
