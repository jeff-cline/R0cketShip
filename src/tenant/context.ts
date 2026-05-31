import { resolveTenant } from "./cache";
import type { Tenant } from "./types";

/**
 * Decide which host string to resolve. Real hosts win; localhost/empty fall
 * back to DEFAULT_TENANT_DOMAIN so a single dev box can render any tenant.
 */
export function pickHost(
  hostHeader: string | null,
  defaultDomain: string | undefined,
): string | null {
  const isLocal = !hostHeader || /^localhost(:\d+)?$/i.test(hostHeader);
  if (isLocal) return defaultDomain ?? null;
  return hostHeader;
}

export async function getCurrentTenant(): Promise<Tenant | null> {
  const { headers } = await import("next/headers");
  const h = await headers();
  const host = pickHost(h.get("host"), process.env.DEFAULT_TENANT_DOMAIN);
  if (!host) return null;
  return resolveTenant(host);
}
