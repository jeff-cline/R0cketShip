import { topAdsForPort } from "./ads";

const ORANGE = "#ff5b2e";

// Server ad unit — renders the top live bidder for the port. Clicks route through
// /api/crew/ad-click which charges the advertiser's Rocket Fuel and redirects.
export async function AdSlot({ port, variant = "card", exclude }: { port: string; variant?: "card" | "banner"; exclude?: string }) {
  const ads = await topAdsForPort(port, 1, exclude);
  const ad = ads[0];
  if (!ad) return null;
  const href = `/api/crew/ad-click?id=${ad.id}`;

  if (variant === "banner") {
    return (
      <a href={href} rel="sponsored noopener" target="_blank" className="flex items-center gap-4 overflow-hidden rounded-2xl border bg-white p-3 transition hover:shadow-md" style={{ borderColor: "#e6eaf1" }}>
        {ad.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.imageUrl} alt="" className="h-16 w-24 shrink-0 rounded-lg object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><span className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ color: "#8b97ad" }}>Sponsored</span><span className="truncate text-sm font-bold" style={{ color: "#0a0e17" }}>{ad.headline}</span></div>
          {ad.body && <div className="mt-0.5 truncate text-xs" style={{ color: "#61708a" }}>{ad.body}</div>}
        </div>
        <span className="shrink-0 rounded-full px-4 py-2 text-xs font-bold text-white" style={{ background: ORANGE }}>Learn more</span>
      </a>
    );
  }

  return (
    <a href={href} rel="sponsored noopener" target="_blank" className="block overflow-hidden rounded-2xl border bg-white transition hover:shadow-md" style={{ borderColor: "#e6eaf1" }}>
      {ad.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ad.imageUrl} alt="" className="h-28 w-full object-cover" />
      )}
      <div className="p-4">
        <span className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ color: "#8b97ad" }}>Sponsored</span>
        <div className="mt-1.5 text-sm font-bold" style={{ color: "#0a0e17" }}>{ad.headline}</div>
        {ad.body && <div className="mt-1 text-xs leading-relaxed" style={{ color: "#61708a" }}>{ad.body}</div>}
        <div className="mt-3 text-xs font-bold" style={{ color: ORANGE }}>Learn more →</div>
      </div>
    </a>
  );
}
