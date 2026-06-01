import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, Fraunces } from "next/font/google";
import { getCurrentTenant } from "@/src/tenant/context";
import type { TenantTheme } from "@/src/tenant/types";
import { RocketBadge } from "@/app/_marketing/RocketBadge";

const display = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const serif = Fraunces({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-serif" });

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getCurrentTenant();
  const brand = t?.moneyWord ? titleCase(t.moneyWord) : "R0cketShip";
  const niche = t?.niche ? titleCase(t.niche) : "Business";
  const domain = t?.domain ?? "r0cketship.com";
  const base = `https://${domain}`;
  const title = `${brand} — ${niche} Leads in Your ZIP`;
  const description = t
    ? `High-intent ${t.niche} leads delivered to your CRM — exclusive by ZIP, predictive intent data, $50 free to start.`
    : "White-label business-lead platform — predictive, ZIP-exclusive leads delivered to your CRM.";
  const ogImg = t?.heroImage
    ? t.heroImage.startsWith("http")
      ? t.heroImage
      : base + t.heroImage
    : undefined;
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

  const brand = tenant?.moneyWord ? titleCase(tenant.moneyWord) : "R0cketShip";
  const niche = tenant?.niche ? titleCase(tenant.niche) : "Business";
  const domain = tenant?.domain ?? "r0cketship.com";
  const base = `https://${domain}`;
  const description = tenant
    ? `High-intent ${tenant.niche} leads delivered to your CRM — exclusive by ZIP, predictive intent data, $50 free to start.`
    : "White-label business-lead platform — predictive, ZIP-exclusive leads delivered to your CRM.";
  const ogImg = tenant?.heroImage
    ? tenant.heroImage.startsWith("http")
      ? tenant.heroImage
      : base + tenant.heroImage
    : undefined;
  const slogan = tenant?.heroHeadline ?? `${niche} Leads in Your ZIP`;

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
        <RocketBadge />
      </body>
    </html>
  );
}
