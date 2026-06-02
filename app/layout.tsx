import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, Fraunces } from "next/font/google";
import { getCurrentTenant } from "@/src/tenant/context";
import type { TenantTheme } from "@/src/tenant/types";

const display = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const serif = Fraunces({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-serif" });

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Compute SEO fields once, host-aware, so metadata and JSON-LD stay in sync. */
function seoFor(t: Awaited<ReturnType<typeof getCurrentTenant>>) {
  const domain = (t?.domain ?? "r0cketship.com").replace(/^www\./, "");
  const base = `https://${domain}`;
  const isHub = domain === "r0cketship.com";
  const ld = (s: string) => s.replace(/\bleads\b/gi, "Predictive Data");
  const brand = ld(t?.moneyWord ? titleCase(t.moneyWord) : "R0cketShip");
  const niche = t?.niche ? titleCase(t.niche) : "Business";
  // "Roofing Predictive Data" — avoid doubling when the money word already has "leads".
  const phrase = ld(t?.moneyWord && /lead/i.test(t.moneyWord) ? titleCase(t.moneyWord) : `${niche} Leads`);
  const title = isHub
    ? "R0cketShip — White-Label Predictive Data Networks by Niche"
    : `${phrase} in Your ZIP — ${domain}`;
  const description = isHub
    ? "R0cketShip powers white-label lead networks — predictive, ZIP-exclusive leads delivered to your CRM. Browse niches or launch your own."
    : t
      ? `High-intent ${t.niche} leads delivered to your CRM — exclusive by ZIP, predictive intent data, $50 free to start.`
      : "White-label business-lead platform — predictive, ZIP-exclusive leads delivered to your CRM.";
  const ogImg = t?.heroImage ? (t.heroImage.startsWith("http") ? t.heroImage : base + t.heroImage) : undefined;
  return { domain, base, isHub, brand, niche, phrase, title, description, ogImg };
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getCurrentTenant();
  const { base, brand, title, description, ogImg } = seoFor(t);
  return {
    metadataBase: new URL(base),
    title: { default: title, template: `%s · ${brand}` },
    description,
    applicationName: brand,
    alternates: { canonical: base },
    openGraph: {
      type: "website",
      siteName: brand,
      title,
      description,
      url: base,
      images: ogImg ? [{ url: ogImg }] : undefined,
    },
    twitter: {
      card: ogImg ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImg ? [ogImg] : undefined,
    },
    robots: { index: true, follow: true },
    icons: { icon: "/icon.png" },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0e17",
};

function themeToCssVars(theme: TenantTheme): Record<string, string> {
  return {
    "--color-primary": theme.primary,
    "--color-secondary": theme.secondary,
    "--color-accent": theme.accent,
    "--color-background": theme.background,
    "--color-foreground": theme.foreground,
    "--font-family": theme.fontFamily,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getCurrentTenant();
  const style = tenant
    ? (themeToCssVars(tenant.theme) as React.CSSProperties)
    : undefined;

  const { base, brand, description, ogImg, phrase } = seoFor(tenant);
  const slogan = tenant?.heroHeadline ?? `${phrase} in Your ZIP`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        name: brand,
        url: base,
        description,
        areaServed: "US",
        ...(ogImg ? { image: ogImg } : {}),
        slogan,
      },
      {
        "@type": "WebSite",
        name: brand,
        url: base,
      },
    ],
  };

  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${serif.variable}`} style={style}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
