import "./globals.css";
import { getCurrentTenant } from "@/src/tenant/context";
import type { TenantTheme } from "@/src/tenant/types";

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
    <html lang="en" style={style}>
      <body>{children}</body>
    </html>
  );
}
