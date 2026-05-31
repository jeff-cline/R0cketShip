import { randomBytes, timingSafeEqual } from "node:crypto";

export function generateIngestKey(): string {
  return randomBytes(24).toString("base64url");
}

export function ingestKeyMatches(
  provided: string | null | undefined,
  stored: string | null | undefined,
): boolean {
  if (!provided || !stored) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(stored);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
