import { ALL_PORTS, portSlug } from "./ports";

// Shared footer for cruise.plus — every port linked for SEO, in an accordion
// that's collapsed by default (click to expand).
export function PortFooter() {
  return (
    <footer className="border-t bg-[#f8fafc] px-5 py-10 sm:px-8" style={{ borderColor: "#e2e8f0" }}>
      <div className="mx-auto max-w-6xl">
        <details>
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold [&::-webkit-details-marker]:hidden" style={{ color: "#0a0e17" }}>
            All cruise ports <span style={{ color: "#94a3b8" }}>({ALL_PORTS.length})</span> <span className="text-xs font-semibold" style={{ color: "#0284c7" }}>▾ tap to expand</span>
          </summary>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
            {ALL_PORTS.map((p) => (
              <a key={p} href={`/${portSlug(p)}`} className="text-xs transition hover:underline" style={{ color: "#64748b" }}>{p}</a>
            ))}
          </div>
        </details>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-5 text-xs" style={{ borderColor: "#e2e8f0", color: "#94a3b8" }}>
          <span>© Cruise.Plus · A R0cketShip Holdings company · One platform, every port.</span>
          <span className="flex gap-4"><a href="/" className="hover:underline">Home</a><a href="https://crewperk.com" className="hover:underline">Crew</a></span>
        </div>
      </div>
    </footer>
  );
}
