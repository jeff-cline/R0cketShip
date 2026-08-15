import "server-only";
import { cookies } from "next/headers";
import { randomBytes, createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { yellowUsers, yellowSessions } from "@/src/db/schema";

// Standalone auth for /yellow — fully separate from the platform's tenant/role
// accounts. Long-lived session so the user stays logged in ("leave it open").

export const YELLOW_COOKIE = "yellow_session";
const TTL_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

const genToken = () => randomBytes(32).toString("base64url");
const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export type YellowUser = typeof yellowUsers.$inferSelect;

export async function createYellowSession(userId: string, impersonatorUserId?: string | null): Promise<string> {
  const token = genToken();
  await db.insert(yellowSessions).values({
    userId,
    tokenHash: hashToken(token),
    impersonatorUserId: impersonatorUserId ?? null,
    expiresAt: new Date(Date.now() + TTL_MS),
  });
  return token;
}

export async function setYellowCookie(token: string): Promise<void> {
  (await cookies()).set(YELLOW_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/yellow",
    maxAge: Math.floor(TTL_MS / 1000),
  });
}

export async function clearYellowCookie(): Promise<void> {
  (await cookies()).delete({ name: YELLOW_COOKIE, path: "/yellow" });
}

export type YellowAuth = {
  user: YellowUser;
  token: string;
  impersonatorUserId: string | null;
};

export async function getYellowAuth(): Promise<YellowAuth | null> {
  const token = (await cookies()).get(YELLOW_COOKIE)?.value;
  if (!token) return null;
  const srows = await db.select().from(yellowSessions).where(eq(yellowSessions.tokenHash, hashToken(token))).limit(1);
  const s = srows[0];
  if (!s) return null;
  if (s.expiresAt.getTime() <= Date.now()) {
    await db.delete(yellowSessions).where(eq(yellowSessions.id, s.id));
    return null;
  }
  const urows = await db.select().from(yellowUsers).where(eq(yellowUsers.id, s.userId)).limit(1);
  const user = urows[0];
  if (!user || user.status !== "active") return null;
  return { user, token, impersonatorUserId: s.impersonatorUserId };
}

export async function destroyYellowSession(token: string): Promise<void> {
  await db.delete(yellowSessions).where(eq(yellowSessions.tokenHash, hashToken(token)));
}

export async function countYellowUsers(): Promise<number> {
  const rows = await db.select({ id: yellowUsers.id }).from(yellowUsers);
  return rows.length;
}
