import type { MFeature, MStat, MTestimonial } from "@/src/marketing/content";
import { Rocket } from "@/app/_ui/Rocket";

export function StatBar({ stats }: { stats: MStat[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 px-6 py-6" style={{ background: "var(--color-primary)", color: "var(--color-background)" }}>
      {stats.map((s) => (
        <div key={s.label} className="text-center">
          <div className="text-2xl font-extrabold" style={{ color: "var(--color-accent)" }}>{s.value}</div>
          <div className="text-xs opacity-80">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export function FeatureGrid({ features, dark }: { features: MFeature[]; dark?: boolean }) {
  return (
    <section className="px-6 py-16" style={dark ? { background: "#0a0d12", color: "#fff" } : undefined}>
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-extrabold">Your unfair advantage</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border p-6" style={{ borderColor: dark ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.08)", background: dark ? "rgba(255,255,255,.03)" : "#fff", boxShadow: dark ? "none" : "var(--shadow-sm)" }}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl text-lg" style={{ background: "color-mix(in srgb, var(--color-accent) 16%, transparent)", color: "var(--color-accent)" }}>{f.icon}</div>
              <div className="mt-3 font-bold">{f.title}</div>
              <div className="mt-1 text-sm opacity-70">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks({ steps, dark }: { steps: { title: string; desc: string }[]; dark?: boolean }) {
  return (
    <section className="px-6 py-16" style={dark ? { background: "#0d1016", color: "#fff" } : { background: "#fafbfc" }}>
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-3xl font-extrabold">How it works</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-white" style={{ background: "var(--color-accent)" }}>{i + 1}</div>
              <div className="mt-3 font-semibold">{s.title}</div>
              <div className="mt-1 text-sm opacity-70">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingBlock({ offers, dark }: { offers: { id: number; title: string; description: string; price: string; features?: string[] }[]; dark?: boolean }) {
  return (
    <section className="px-6 py-20" style={dark ? { background: "#0a0d12", color: "#fff" } : undefined}>
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-extrabold sm:text-4xl">Simple, exclusive pricing</h2>
        <div className="mt-12 grid items-stretch gap-6 md:grid-cols-3">
          {offers.map((o, i) => {
            const featured = i === 1;
            const feats = (o.features ?? []).filter((f) => f && f.trim());
            return (
              <div
                key={o.id}
                className="flex flex-col rounded-3xl p-8"
                style={featured
                  ? { background: "var(--color-primary)", color: "var(--color-background)", boxShadow: "var(--shadow-lg)" }
                  : { background: dark ? "rgba(255,255,255,.03)" : "#fff", border: `1px solid ${dark ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.08)"}`, boxShadow: dark ? "none" : "var(--shadow-sm)" }}
              >
                {featured && <div className="mb-3 inline-block self-start rounded-full px-3 py-1 text-xs font-extrabold" style={{ background: "var(--color-accent)", color: "var(--color-primary)" }}>MOST POPULAR</div>}
                <div className="text-lg font-extrabold">{o.title}</div>
                <div className="mt-3 text-4xl font-extrabold tracking-tight">{o.price}</div>
                <div className="mt-3 text-sm opacity-80">{o.description}</div>

                {feats.length > 0 && (
                  <div className="mt-6">
                    <div className="text-xs font-bold uppercase tracking-wide" style={{ opacity: 0.55 }}>What you get</div>
                    <ul className="mt-3 flex flex-col gap-3">
                      {feats.map((f, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-sm leading-snug">
                          <span className="mt-0.5 shrink-0"><Rocket size={15} color="var(--color-accent)" /></span>
                          <span style={{ opacity: 0.92 }}>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <a href="/signup" className="mt-auto block rounded-full py-3.5 text-center font-bold" style={featured ? { background: "var(--color-accent)", color: "var(--color-primary)", marginTop: feats.length ? "1.75rem" : "auto" } : { border: "1.5px solid var(--color-accent)", color: dark ? "var(--color-accent)" : "var(--color-accent)", marginTop: feats.length ? "1.75rem" : "auto" }}>Get started</a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Testimonials({ testimonials, dark }: { testimonials: MTestimonial[]; dark?: boolean }) {
  return (
    <section className="px-6 py-16" style={dark ? { background: "#0d1016", color: "#fff" } : { background: "#fafbfc" }}>
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-extrabold">Trusted by operators in our network</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.author} className="rounded-2xl p-6" style={{ background: dark ? "rgba(255,255,255,.03)" : "#fff", border: `1px solid ${dark ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.08)"}`, boxShadow: dark ? "none" : "var(--shadow-sm)" }}>
              <div className="text-base leading-relaxed">&ldquo;{t.quote}&rdquo;</div>
              <div className="mt-4 text-sm opacity-60">— {t.author} · {t.meta}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function EPartnerBand({ dark }: { dark?: boolean }) {
  return (
    <section className="px-6 py-16 text-center" style={dark ? { background: "#0a0d12", color: "#fff" } : undefined}>
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-extrabold">E-Partnership program</h2>
        <p className="mt-3 opacity-80">Exclusives and first right of refusal in your territory. We split 50/50 above and below the red line. Application only — for serious operators.</p>
        <a href="/e-partnership" className="mt-6 inline-block rounded-full px-6 py-3 font-bold" style={{ background: dark ? "var(--color-accent)" : "var(--color-primary)", color: dark ? "#0a0d12" : "var(--color-background)" }}>Apply now</a>
      </div>
    </section>
  );
}
