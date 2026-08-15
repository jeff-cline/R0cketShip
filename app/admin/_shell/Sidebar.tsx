"use client";
import { usePathname } from "next/navigation";
import { Rocket } from "@/app/_ui/Rocket";

export interface NavItem {
  href: string;
  label: string;
}

export function Sidebar({ brand, role, items, email }: { brand: string; role: string; items: NavItem[]; email: string }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  // Phase 2 Task 16: surface advertiser marketplace nav entries (god only).
  // These are added here so the layout caller doesn't need to know about them.
  const adsItems: NavItem[] =
    role === "god"
      ? [
          { href: "/admin/advertisers", label: "Advertisers" },
          { href: "/admin/settings/marketplace", label: "Marketplace" },
        ]
      : [];
  const hrefs = new Set(items.map((i) => i.href));
  const merged: NavItem[] = [...items, ...adsItems.filter((a) => !hrefs.has(a.href))];

  // God-only: surface two outreach observability sub-entries right after the
  // existing "/admin/outreach" link, so the platform team can drill into the
  // queue and mailbox health from the same Outreach grouping.
  const outreachSubItems: NavItem[] =
    role === "god"
      ? [
          { href: "/admin/outreach/queue", label: "Outreach queue" },
          { href: "/admin/outreach/mailboxes", label: "Mailbox health" },
        ]
      : [];
  // God-only: surface custom-columns sub-entry directly after the Data nav so
  // operators can register new lead column keys without leaving the data area.
  // Offer Box also belongs in this neighborhood — it's a data/monetization
  // primitive god configures and copy-pastes into other sites.
  const dataSubItems: NavItem[] =
    role === "god"
      ? [
          { href: "/admin/data/columns", label: "Lead columns" },
          { href: "/admin/offer-box", label: "Offer Box" },
        ]
      : [];

  const navItems: NavItem[] = [];
  for (const it of merged) {
    navItems.push(it);
    if (it.href === "/admin/outreach") {
      for (const sub of outreachSubItems) {
        if (!hrefs.has(sub.href)) navItems.push(sub);
      }
    }
    if (it.href === "/admin/data") {
      for (const sub of dataSubItems) {
        if (!hrefs.has(sub.href)) navItems.push(sub);
      }
    }
  }

  return (
    <aside
      className="grid-bg-dark sticky top-0 hidden h-screen w-60 shrink-0 flex-col justify-between md:flex"
      style={{ background: "var(--side-bg)", borderRight: "1px solid var(--side-line)" }}
    >
      <div>
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "var(--color-accent)" }}>
            <Rocket size={16} color="#fff" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-extrabold" style={{ color: "#fff" }}>{brand}</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--side-muted)" }}>
              {role === "god" ? "Platform" : "Business"} console
            </div>
          </div>
        </div>

        <nav className="mt-2 flex flex-col gap-0.5 px-3">
          {navItems.map((it) => {
            const active = isActive(it.href);
            return (
              <a
                key={it.href}
                href={it.href}
                className="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition"
                style={{
                  color: active ? "#fff" : "var(--side-ink)",
                  background: active ? "var(--side-bg-2)" : "transparent",
                }}
              >
                <Rocket size={11} color={active ? "var(--color-accent)" : "var(--side-muted)"} />
                {it.label}
              </a>
            );
          })}
        </nav>
      </div>

      <div className="px-3 pb-4">
        <div className="rounded-lg px-3 py-2.5" style={{ background: "var(--side-bg-2)" }}>
          <div className="truncate text-xs font-semibold" style={{ color: "var(--side-ink)" }}>{email}</div>
          <div className="text-[10px] uppercase tracking-wide" style={{ color: "var(--side-muted)" }}>{role}</div>
        </div>
      </div>
    </aside>
  );
}
