import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/src/db/client";
import { users } from "@/src/db/schema";
import { getAuthContext } from "@/src/auth/context";
import { startImpersonation } from "@/src/auth/impersonate";
import { SESSION_COOKIE } from "@/src/auth/session";
import { roleHome } from "@/src/auth/login";

export const runtime = "nodejs";

/** Impersonate a specific member/user. GET route → sets the cookie on the response (reliable). */
export async function GET(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const ctx = await getAuthContext();
  if (!ctx || (ctx.user.role !== "god" && ctx.user.role !== "manager")) return NextResponse.redirect(new URL("/login", req.url));
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.redirect(new URL("/login", req.url));

  const target = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!target) return NextResponse.redirect(new URL("/admin/users", req.url));

  try {
    const impToken = await startImpersonation({ role: ctx.user.role, tenantId: ctx.user.tenantId }, target, token);
    const res = NextResponse.redirect(new URL(roleHome(target.role), req.url));
    res.cookies.set(SESSION_COOKIE, impToken, {
      httpOnly: true,
      secure: new URL(req.url).protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch {
    return NextResponse.redirect(new URL("/admin/users", req.url));
  }
}
