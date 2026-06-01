export function MarketingNav({ brand, dark = false }: { brand: string; dark?: boolean }) {
  const fg = dark ? "#fff" : "var(--color-foreground)";
  return (
    <nav className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 backdrop-blur" style={{ background: dark ? "rgba(10,13,18,.7)" : "rgba(255,255,255,.8)", borderBottom: "1px solid rgba(125,125,125,.15)" }}>
      <a href="/" className="text-lg font-extrabold capitalize" style={{ color: fg }}>{brand}</a>
      <div className="hidden items-center gap-6 text-sm md:flex" style={{ color: fg }}>
        <a href="/how-it-works">How it works</a>
        <a href="/pricing">Pricing</a>
        <a href="/login">Sign in</a>
        <a href="/signup" className="rounded-full px-4 py-2 font-semibold text-white" style={{ background: "var(--color-accent)" }}>Get $50 free</a>
      </div>
      <a href="/signup" className="rounded-full px-4 py-2 text-sm font-semibold text-white md:hidden" style={{ background: "var(--color-accent)" }}>Get $50</a>
    </nav>
  );
}
