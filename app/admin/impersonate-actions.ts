"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { exitImpersonation } from "@/src/auth/impersonate";
import { SESSION_COOKIE } from "@/src/auth/session";
import { resolveAuthContext } from "@/src/auth/context";
import { roleHome } from "@/src/auth/login";

export async function exitImpersonationAction() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const back = await exitImpersonation(token);
    if (back) {
      store.set(SESSION_COOKIE, back, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
      const ctx = await resolveAuthContext(back);
      redirect(ctx ? roleHome(ctx.user.role) : "/login");
    }
  }
  redirect("/login");
}
