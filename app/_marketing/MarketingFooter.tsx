export function MarketingFooter({ footerHtml }: { footerHtml: string }) {
  return (
    <footer style={{ background: "var(--color-primary)", color: "var(--color-background)" }}>
      <div className="mx-auto max-w-5xl px-6 py-14 text-center">
        <h2 className="text-2xl font-bold" style={{ color: "var(--color-background)" }}>Claim your ZIP before a competitor does.</h2>
        <a href="/signup" className="mt-6 inline-block rounded-full px-6 py-3 font-bold" style={{ background: "var(--color-accent)", color: "#fff" }}>Start free — $50 in leads</a>
        <div className="mt-8 flex flex-wrap justify-center gap-5 text-sm opacity-80">
          <a href="/about">About</a><a href="/how-it-works">How it works</a><a href="/pricing">Pricing</a><a href="/integrations">Integrations</a><a href="/partner">E-Partnership</a><a href="/contact">Contact</a><a href="/terms">Terms</a>
        </div>
        <a href="https://r0cketship.com" target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 text-xs opacity-75">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/rocket.png" alt="" width={16} height={16} /> Powered by R0cketShip
        </a>
        <div className="mt-6 text-xs opacity-60" dangerouslySetInnerHTML={{ __html: footerHtml }} />
      </div>
    </footer>
  );
}
