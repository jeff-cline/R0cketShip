import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers();
  const host = (h.get("host") || "r0cketship.com").replace(/:\d+$/, "");
  const base = `https://${host}`;
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/agent", "/account", "/manage", "/settings"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
