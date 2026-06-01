import { getCurrentTenant } from "@/src/tenant/context";
import { notFound } from "next/navigation";

const FEATURES = [
  { t: "Predictive intent targeting", d: "Reach consumers statistically acting like past buyers — before your competitors do." },
  { t: "Door-knocker optimization", d: "High-intent address lists so your reps maximize every street they walk." },
  { t: "Saturation marketing", d: "Blanket your ZIP with proprietary outreach that drives action and bookings." },
  { t: "Done-for-you booking", d: "We email and book appointments straight onto your calendar." },
  { t: "CRM webhooks", d: "Post leads directly into HubSpot, GoHighLevel, or any CRM you use." },
  { t: "ZIP exclusivity", d: "Lock down your territory — exclusives and first right of refusal." },
  { t: "5-year retrospective data", d: "Look back up to five years, refreshed daily, weekly, and monthly." },
  { t: "Billions of signals", d: "Predictive, intent, and shopping signals across billions of data points." },
];

export default async function Page() {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();
  return (
    <main>
      <header className="px-6 py-20 text-center" style={{ background: "var(--color-primary)", color: "var(--color-background)" }}>
        <h1 className="text-4xl font-bold capitalize md:text-5xl">{tenant.moneyWord}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg opacity-90">Predictive, intent-driven {tenant.niche} leads by ZIP code — residential and commercial.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="/signup" className="rounded-lg px-6 py-3 font-semibold" style={{ background: "var(--color-accent)", color: "#fff" }}>Get started — $50 in leads free</a>
          <a href="/how-it-works" className="rounded-lg border px-6 py-3 font-semibold">How it works</a>
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-16 md:grid-cols-3">
        {tenant.offers.map((o) => (
          <div key={o.id} className="rounded-xl border p-6" style={{ borderColor: "var(--color-secondary)" }}>
            <h2 className="text-xl font-semibold" style={{ color: "var(--color-accent)" }}>{o.title}</h2>
            <p className="mt-2 text-sm opacity-80">{o.description}</p>
            <p className="mt-4 text-2xl font-bold">{o.price}</p>
            <a href="/signup" className="mt-4 inline-block text-sm underline">Get started →</a>
          </div>
        ))}
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold">Your competitive advantage</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.t}><h3 className="font-semibold" style={{ color: "var(--color-accent)" }}>{f.t}</h3><p className="mt-1 text-sm opacity-75">{f.d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16" style={{ background: "var(--color-secondary)", color: "var(--color-background)" }}>
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold">Trusted by contractors in our network</h2>
          <div className="mt-8 grid gap-6 text-sm md:grid-cols-3">
            <blockquote>&ldquo;Best leads we&rsquo;ve ever bought — our close rate doubled.&rdquo;<footer className="mt-2 opacity-70">— Apex Roofing</footer></blockquote>
            <blockquote>&ldquo;The door-knocker lists save my crew hours every day.&rdquo;<footer className="mt-2 opacity-70">— Summit Exteriors</footer></blockquote>
            <blockquote>&ldquo;Exclusive ZIPs mean no more bidding wars.&rdquo;<footer className="mt-2 opacity-70">— Peak Contractors</footer></blockquote>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold">E-Partnership program</h2>
          <p className="mt-3 opacity-80">Exclusives and first right of refusal in your territory. We split 50/50 above and below the red line. Application only — 1+ years in business, $1M+ EBITDA, and willing to exit in 3–5 years as part of our rollup.</p>
          <a href="/partner" className="mt-6 inline-block rounded-lg px-6 py-3 font-semibold" style={{ background: "var(--color-primary)", color: "var(--color-background)" }}>Apply now</a>
        </div>
      </section>

      <footer className="px-8 py-8 text-center text-sm" style={{ background: "var(--color-secondary)", color: "var(--color-background)" }} dangerouslySetInnerHTML={{ __html: tenant.footerHtml }} />
    </main>
  );
}
