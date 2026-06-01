import "./globals.css";
import { Plus_Jakarta_Sans, Inter, Fraunces } from "next/font/google";
import { getCurrentTenant } from "@/src/tenant/context";
import type { TenantTheme } from "@/src/tenant/types";
import { RocketBadge } from "@/app/_marketing/RocketBadge";

const display = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["600", "700", "800"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const serif = Fraunces({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-serif" });

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

  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${serif.variable}`} style={style}>
      <body>{children}<RocketBadge /></body>
    </html>
  );
}
