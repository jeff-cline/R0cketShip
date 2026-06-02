export function MarketingNav({ brand, dark = false, hub = false }: { brand: string; dark?: boolean; hub?: boolean }) {
  const fg = dark ? "#fff" : "var(--color-foreground)";
  const brandText = brand.replace(/\bleads\b/gi, "Predictive Data");
  const links = [
    { href: "/how-it-works", label: "How it works" },
    { href: "/pricing", label: "Pricing" },
    { href: "/integrations", label: "Integrations" },
    // "Niches" is the directory of all white-labels — only the r0cketship.com hub shows it.
    ...(hub ? [{ href: "/niches", label: "Niches" }] : []),
    { href: "/login", label: "Sign in" },
  ];
  return (
    <nav
      className="sticky top-0 z-30 flex items-center justify-between px-5 py-4 backdrop-blur sm:px-6"
      style={{ background: dark ? "rgba(10,13,18,.7)" : "rgba(255,255,255,.82)", borderBottom: "1px solid rgba(125,125,125,.15)" }}
    >
      <a href="/" className="text-lg font-extrabold capitalize" style={{ color: fg }}>{brandText}</a>

      {/* desktop */}
      <div className="hidden items-center gap-6 text-sm md:flex" style={{ color: fg }}>
        {links.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
        <a href="/signup" className="rounded-full px-4 py-2 font-semibold text-white" style={{ background: "var(--color-accent)" }}>Get $50 free</a>
      </div>

      {/* mobile */}
      <div className="flex items-center gap-2 md:hidden">
        <a href="/signup" className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--color-accent)" }}>Get $50</a>
        <details className="group relative">
          <summary className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-lg [&::-webkit-details-marker]:hidden" style={{ border: "1px solid rgba(125,125,125,.25)", color: fg }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </summary>
          <div className="absolute right-0 z-40 mt-2 flex w-52 flex-col rounded-xl p-2 text-sm shadow-lg" style={{ background: dark ? "#10131a" : "#fff", border: "1px solid rgba(125,125,125,.2)", color: fg }}>
            {links.map((l) => <a key={l.href} href={l.href} className="rounded-lg px-3 py-2" style={{ color: fg }}>{l.label}</a>)}
          </div>
        </details>
      </div>
    </nav>
  );
}
