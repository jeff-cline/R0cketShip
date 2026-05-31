import { randomBytes, createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { sessions } from "../db/schema";

export const SESSION_COOKIE = "r0cket_session";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  userId: string,
  opts?: { impersonatorUserId?: string; returnToSessionId?: string },
): Promise<string> {
  const token = generateToken();
  await db.insert(sessions).values({
    userId,
    tokenHash: hashToken(token),
    impersonatorUserId: opts?.impersonatorUserId ?? null,
    returnToSessionId: opts?.returnToSessionId ?? null,
    expiresAt: new Date(Date.now() + TTL_MS),
  });
  return token;
}

export async function resolveSession(token: string) {
  const rows = await db
    .select()
    .from(sessions)
    .where(eq(sessions.tokenHash, hashToken(token)))
    .limit(1);
  const s = rows[0];
  if (!s) return null;
  if (s.expiresAt.getTime() <= Date.now()) {
    await destroySession(token);
    return null;
  }
  return s;
}

export async function destroySession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
}
