import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, asc, eq, ne } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "@/src/db/client";
import { users, tenants } from "@/src/db/schema";
import { getAuthContext } from "@/src/auth/context";
import { createUser } from "@/src/auth/users";
import { startImpersonation } from "@/src/auth/impersonate";
import { SESSION_COOKIE } from "@/src/auth/session";

export const runtime = "nodejs";

/**
 * God "Open as" a white-label. A GET route handler (not a server action) so the
 * new session cookie is set directly on the redirect response — reliable, no
 * re-login. Impersonates the tenant's manager (creating an owner if none).
 */
export async function GET(req: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const ctx = await getAuthContext();
  if (!ctx || ctx.user.role !== "god") return NextResponse.redirect(new URL("/login", req.url));
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  let target =
    (await db.select().from(users).where(and(eq(users.tenantId, tenantId), eq(users.role, "manager"))).orderBy(asc(users.createdAt)).limit(1))[0] ??
    (await db.select().from(users).where(and(eq(users.tenantId, tenantId), ne(users.role, "god"))).orderBy(asc(users.createdAt)).limit(1))[0];

  if (!target) {
    const tenant = (await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1))[0];
    if (!tenant) return NextResponse.redirect(new URL("/admin/tenants", req.url));
    target = await createUser(
      { role: "god", tenantId: ctx.user.tenantId },
      { tenantId, email: `owner@${tenant.domain}`, role: "manager", tempPassword: randomBytes(18).toString("base64url") },
    );
    await db.update(users).set({ mustResetPassword: false }).where(eq(users.id, target.id));
  }

  const impToken = await startImpersonation({ role: ctx.user.role, tenantId: ctx.user.tenantId }, target, token);

  // Behind nginx, req.url resolves to the internal http://localhost:3000 origin.
  // Use the forwarded host/proto headers to build a public-facing redirect URL
  // so the cookie gets set on the right domain and the user lands on the public host.
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || (req.url.startsWith("https://") ? "https" : "http");
  const redirectUrl = host ? `${proto}://${host}/admin` : new URL("/admin", req.url).toString();

  const res = NextResponse.redirect(redirectUrl);
  res.cookies.set(SESSION_COOKIE, impToken, {
    httpOnly: true,
    secure: proto === "https",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
