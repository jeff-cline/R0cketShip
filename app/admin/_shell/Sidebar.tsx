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
          {items.map((it) => {
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
