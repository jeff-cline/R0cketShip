/**
 * Advertiser logout route — clears the `adv_session` cookie, destroys the
 * server-side session row, and redirects back to /advertise.
 *
 * Implemented as GET so a plain anchor link can trigger logout. Server actions
 * would be preferable, but a GET handler keeps the link semantics simple in
 * the AdvertiserShell top bar.
 */
import { NextResponse } from "next/server";
import { ADVERTISER_COOKIE, logoutAdvertiser } from "@/src/auth/advertiser";

export async function GET(request: Request): Promise<NextResponse> {
  // Best-effort: destroy the server-side session if the cookie is present.
  await logoutAdvertiser();

  const url = new URL("/advertise", request.url);
  const response = NextResponse.redirect(url);
  response.cookies.set(ADVERTISER_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
