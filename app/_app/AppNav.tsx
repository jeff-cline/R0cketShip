"use client";
import { usePathname } from "next/navigation";
import { Rocket } from "@/app/_ui/Rocket";
import { logoutAction } from "@/app/logout/actions";

export interface AppNavItem {
  href: string;
  label: string;
}

export function AppNav({ brand, items, balance }: { brand: string; items: AppNavItem[]; balance?: number }) {
  const pathname = usePathname();
  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header
      className="sticky top-0 z-20 backdrop-blur"
      style={{ background: "color-mix(in srgb, var(--surface) 82%, transparent)", borderBottom: "1px solid var(--line)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
        <a href="/leads" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg" style={{ background: "var(--color-accent)" }}>
            <Rocket size={14} color="#fff" />
          </span>
          <span className="text-sm font-extrabold">{brand}</span>
        </a>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {items.map((it) => (
            <a
              key={it.href}
              href={it.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium transition"
              style={{
                color: active(it.href) ? "var(--ink)" : "var(--muted)",
                background: active(it.href) ? "var(--surface-3)" : "transparent",
              }}
            >
              {it.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {typeof balance === "number" && (
            <a href="/billing" className="chip" title="Wallet balance" style={{ background: "color-mix(in srgb, var(--color-accent) 13%, transparent)", color: "var(--color-accent)" }}>
              <span style={{ fontSize: 9 }}>●</span> {balance.toLocaleString()} credits
            </a>
          )}
          <form action={logoutAction} className="hidden md:block">
            <button className="btn btn-ghost" style={{ padding: "7px 13px" }}>Log out</button>
          </form>
          <details className="relative md:hidden">
            <summary className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-lg [&::-webkit-details-marker]:hidden" style={{ border: "1px solid var(--line)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </summary>
            <div className="absolute right-0 z-40 mt-2 flex w-52 flex-col rounded-xl p-2 text-sm shadow-lg" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              {items.map((it) => <a key={it.href} href={it.href} className="rounded-lg px-3 py-2" style={{ color: "var(--ink)" }}>{it.label}</a>)}
              <form action={logoutAction}><button className="w-full rounded-lg px-3 py-2 text-left" style={{ color: "var(--neg)" }}>Log out</button></form>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
