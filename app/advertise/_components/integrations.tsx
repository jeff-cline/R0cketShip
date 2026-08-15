import { COLORS } from "./shared";

type Platform = {
  name: string;
  color: string;
  glyph: string;
};

const platforms: Platform[] = [
  { name: "Stripe", color: "#635BFF", glyph: "S" },
  { name: "HubSpot", color: "#FF7A59", glyph: "H" },
  { name: "Salesforce", color: "#00A1E0", glyph: "SF" },
  { name: "GoHighLevel", color: "#10B981", glyph: "GHL" },
  { name: "Pipedrive", color: "#1A1A1A", glyph: "P" },
  { name: "Close", color: "#3B82F6", glyph: "C" },
  { name: "Zoho", color: "#E42527", glyph: "Z" },
  { name: "Twilio", color: "#F22F46", glyph: "T" },
];

export function IntegrationsBelt() {
  return (
    <div>
      <div className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: COLORS.ink3 }}>
        <span style={{ width: 28, height: 1, background: COLORS.hairline2 }} />
        Platform integrations · not customer logos
        <span style={{ width: 28, height: 1, background: COLORS.hairline2 }} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8">
        {platforms.map((p) => (
          <div
            key={p.name}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border px-3 py-4 transition-colors"
            style={{
              borderColor: COLORS.hairline,
              background: COLORS.surface2,
            }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-black"
              style={{
                background: `linear-gradient(135deg, ${p.color}, ${p.color}99)`,
                color: COLORS.ink,
                boxShadow: `0 4px 12px ${p.color}55`,
              }}
            >
              {p.glyph}
            </div>
            <div className="text-xs font-semibold" style={{ color: COLORS.ink2 }}>
              {p.name}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs" style={{ color: COLORS.ink4 }}>
        r0cketship pipes verified actions and wallet events into the CRMs and billing systems your operation already runs on. Listed integrations are roadmap-confirmed; some are in private beta.
      </p>
    </div>
  );
}
