import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const h = await headers();
  const host = (h.get("host") || "r0cketship.com").replace(/:\d+$/, "");
  const base = `https://${host}`;
  const routes = [
    "",
    "/how-it-works",
    "/pricing",
    "/about",
    "/contact",
    "/partner",
    "/terms",
    "/integrations",
    "/signup",
    "/login",
  ];
  if (host.replace(/^www\./, "") === "r0cketship.com") routes.push("/niches");
  return routes.map((r) => ({
    url: base + r,
    changeFrequency: "weekly",
    priority: r === "" ? 1 : 0.7,
  }));
}
