import type { ReactNode } from "react";
import { ImpersonationBanner } from "@/app/_components/ImpersonationBanner";
import { AppNav, type AppNavItem } from "./AppNav";

const CUSTOMER_NAV: AppNavItem[] = [
  { href: "/leads", label: "Leads" },
  { href: "/crm", label: "CRM" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/billing", label: "Billing" },
  { href: "/affiliate", label: "Affiliate" },
  { href: "/settings/integrations", label: "Settings" },
];

const AGENT_NAV: AppNavItem[] = [
  { href: "/agent", label: "Call console" },
  { href: "/crm", label: "CRM" },
];

/**
 * Shared chrome for authenticated customer/agent pages: a top nav with the
 * tenant brand, role-aware links, wallet balance, and logout. Wrap a page's
 * content in <AppShell brand role balance>…</AppShell>.
 */
export function AppShell({
  brand,
  role,
  balance,
  children,
}: {
  brand: string;
  role: "customer" | "agent";
  balance?: number;
  children: ReactNode;
}) {
  const items = role === "agent" ? AGENT_NAV : CUSTOMER_NAV;
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-app)" }}>
      <ImpersonationBanner />
      <AppNav brand={brand} items={items} balance={balance} />
      <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
