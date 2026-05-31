import { getTenantByHost, normalizeHost } from "./repo";
import type { Tenant } from "./types";

const TTL_MS = 60_000;
type Entry = { tenant: Tenant | null; expires: number };
const cache = new Map<string, Entry>();

export function clearTenantCache(): void {
  cache.clear();
}

export async function resolveTenant(host: string): Promise<Tenant | null> {
  const key = normalizeHost(host);
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) return hit.tenant;

  const tenant = await getTenantByHost(key);
  cache.set(key, { tenant, expires: now + TTL_MS });
  return tenant;
}
