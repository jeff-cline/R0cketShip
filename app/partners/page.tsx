import { getCurrentTenant } from "@/src/tenant/context";
import { MarketingNav } from "@/app/_marketing/MarketingNav";
import { MarketingFooter } from "@/app/_marketing/MarketingFooter";
import { Card, Field, Badge } from "@/app/_ui/primitives";
import { Rocket } from "@/app/_ui/Rocket";
import { joinPartnerAction } from "./actions";

export default async function PartnersRecruitPage({
  searchParams,
}: {
  searchParams: Promise<{ joined?: string; err?: string }>;
}) {
  const t = await getCurrentTenant();
  const sp = await searchParams;
  const brand = t?.moneyWord ?? "r0cketship";

  if (!t || !t.partnerProgramEnabled) {
    return (
      <main>
        <MarketingNav brand={brand} />
        <section className="mx-auto max-w-2xl px-6 py-24 text-center">
          <Card pad>
            <Rocket size={28} color="var(--color-accent)" className="mx-auto" />
            <h1 className="mt-4 text-2xl font-extrabold">Partner program</h1>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              This partner program isn&rsquo;t open right now. Check back soon.
            </p>
          </Card>
        </section>
        <MarketingFooter footerHtml={t?.footerHtml ?? ""} />
      </main>
    );
  }

  const ratePct = Math.round(Number(t.partnerRate) * 100);
  const joined = sp.joined === "1";

  return (
    <main style={{ background: "var(--bg-app)" }}>
      <MarketingNav brand={brand} />
      <section className="mx-auto max-w-2xl px-6 py-20">
        <Card pad>
          <div className="text-center">
            <Rocket size={28} color="var(--color-accent)" className="mx-auto" />
            <div className="mt-3 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--color-accent)" }}>
              Become a Partner
            </div>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight capitalize">{brand} Partner Program</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              Refer customers and earn <strong>{ratePct}% commission</strong> on every collected payment
              for <strong>12 months</strong> after each referral upgrades. Get a personal link the moment you join.
            </p>
          </div>

          {joined ? (
            <div className="mt-8 text-center">
              <Badge tone="pos">You&rsquo;re in</Badge>
              <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
                Your partner account is ready. <a href="/login" className="font-semibold" style={{ color: "var(--color-accent)" }}>Sign in to get your link →</a>
              </p>
            </div>
          ) : (
            <form action={joinPartnerAction} className="mx-auto mt-8 grid max-w-md gap-4">
              {sp.err && <p className="text-sm" style={{ color: "var(--neg)" }}>{sp.err}</p>}
              <Field label="Your name">
                <input name="name" placeholder="Your name" className="input" />
              </Field>
              <Field label="Email *">
                <input name="email" type="email" placeholder="you@example.com" required className="input" />
              </Field>
              <Field label="Password *" hint="At least 8 characters.">
                <input name="password" type="password" placeholder="Create a password" required minLength={8} className="input" />
              </Field>
              <button className="btn btn-primary w-full">Become a partner</button>
              <p className="text-center text-xs" style={{ color: "var(--muted-2)" }}>
                Already a partner? <a href="/login" style={{ color: "var(--color-accent)" }}>Sign in</a>
              </p>
            </form>
          )}
        </Card>
      </section>
      <MarketingFooter footerHtml={t.footerHtml ?? ""} becomeAPartner={t.showBecomeAPartner} />
    </main>
  );
}
