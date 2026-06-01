import { requireAuth } from "@/src/auth/guard";
import { getCurrentTenant } from "@/src/tenant/context";
import { logoutAction } from "@/app/logout/actions";
import { ImpersonationBanner } from "@/app/_components/ImpersonationBanner";
import { Sidebar, type NavItem } from "./_shell/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireAuth(["god", "manager"]);
  const tenant = await getCurrentTenant();
  const isGod = ctx.user.role === "god";
  const brand = isGod ? "R0cketShip" : (tenant?.moneyWord ? cap(tenant.moneyWord) : "Console");

  const items: NavItem[] = [
    { href: "/admin", label: "Dashboard" },
    ...(isGod ? [{ href: "/admin/tenants", label: "White-labels" }] : []),
    { href: "/admin/branding", label: "Site" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/billing", label: "Billing" },
    ...(isGod ? [{ href: "/admin/data", label: "Data" }] : []),
    { href: "/admin/leads", label: "Leads" },
    { href: "/admin/integrations", label: "Integrations" },
    { href: "/admin/email", label: "Email" },
    ...(isGod ? [{ href: "/admin/partners", label: "E-Partners" }] : []),
    ...(isGod ? [{ href: "/admin/insights", label: "Insights" }] : []),
  ];

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-app)" }}>
      <Sidebar brand={brand} role={ctx.user.role} items={items} email={ctx.user.email} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 backdrop-blur"
          style={{ background: "color-mix(in srgb, var(--bg-app) 80%, transparent)", borderBottom: "1px solid var(--line)" }}
        >
          <div className="flex items-center gap-2 md:hidden">
            <details className="relative">
              <summary className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-lg [&::-webkit-details-marker]:hidden" style={{ border: "1px solid var(--line)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </summary>
              <div className="absolute left-0 z-40 mt-2 flex w-56 flex-col rounded-xl p-2 text-sm shadow-lg" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
                {items.map((it) => <a key={it.href} href={it.href} className="rounded-lg px-3 py-2" style={{ color: "var(--ink)" }}>{it.label}</a>)}
              </div>
            </details>
            <span className="text-sm font-semibold">{brand}</span>
          </div>
          <div className="hidden md:block text-xs" style={{ color: "var(--muted)" }}>
            {isGod ? "Platform administration" : `Managing ${tenant?.domain ?? "your white-label"}`}
          </div>
          <form action={logoutAction}>
            <button className="btn btn-ghost" style={{ padding: "7px 13px" }}>Log out</button>
          </form>
        </header>
        <ImpersonationBanner />
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
