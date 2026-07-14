import type { Metadata } from "next";
import { COLORS, Eyebrow, Cite, CheckIcon, Outlined } from "./_components/shared";
import { RoiBarChart, CpaLearningChart, WasteDonut, ConversionFunnel, CplComparison } from "./_components/charts";
import { StatStrip, ComparisonTable } from "./_components/stats";
import { Testimonials } from "./_components/testimonials";
import { SampleDashboard } from "./_components/dashboard";
import { IntegrationsBelt } from "./_components/integrations";
import { Faq } from "./_components/faq";
import { Roadmap } from "./_components/roadmap";
import { HowItWorks } from "./_components/howitworks";
import { SourcesList } from "./_components/sources";

export const metadata: Metadata = {
  title: "Advertise with r0cketship — Pay for Success",
  description:
    "Advertise across our proprietary high intent network. Pay only for verified actions. Or apply as a strategic partner — one per industry — and disrupt with us. Powered by VRTCLS AI.",
};

export default function AdvertisePage() {
  return (
    <main style={{ background: COLORS.bg, color: COLORS.ink, minHeight: "100vh" }}>
      {/* Top nav */}
      <nav
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 backdrop-blur"
        style={{ background: "rgba(5,6,8,0.7)", borderBottom: `1px solid ${COLORS.hairline}` }}
      >
        <a href="https://r0cketship.com" className="flex items-center gap-2 font-extrabold text-lg" style={{ color: COLORS.ink, letterSpacing: "-0.02em" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/rocket.png" alt="" width={26} height={26} style={{ filter: `drop-shadow(0 2px 8px ${COLORS.accent}66)` }} />
          <span>r<span style={{ color: COLORS.accent }}>0</span>cketship</span>
        </a>
        <div className="flex items-center gap-3">
          <a href="#proof" className="hidden text-sm md:inline" style={{ color: COLORS.ink3 }}>Proof</a>
          <a href="#how" className="hidden text-sm md:inline" style={{ color: COLORS.ink3 }}>How it works</a>
          <a href="#offers" className="hidden text-sm md:inline" style={{ color: COLORS.ink3 }}>Offers</a>
          <a href="#faq" className="hidden text-sm md:inline" style={{ color: COLORS.ink3 }}>FAQ</a>
          <a href="/advertise/signup?offer=pay-for-success" className="rounded-full px-4 py-2 text-sm font-bold" style={{ background: COLORS.accent, color: COLORS.ink }}>
            Create an account
          </a>
        </div>
      </nav>

      {/* HERO */}
      <header
        className="relative px-6 pb-20 pt-24 text-center"
        style={{
          background: `
            radial-gradient(ellipse 70% 60% at 100% 0%, rgba(255,107,53,0.22) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 0% 100%, rgba(14,165,233,0.14) 0%, transparent 60%),
            ${COLORS.bg}
          `,
        }}
      >
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 text-xs font-bold uppercase tracking-[0.32em]" style={{ color: COLORS.accent }}>
            Advertise with r0cketship · #ARTLAB
          </div>
          <h1 className="text-5xl font-black leading-[1.02] tracking-tight md:text-7xl" style={{ letterSpacing: "-0.035em" }}>
            <span
              style={{
                color: "transparent",
                WebkitTextStroke: "1.5px #ffffff",
                textShadow: `0 0 24px ${COLORS.accent}99, 0 0 48px ${COLORS.accent}55`,
              }}
            >
              Up and forward
            </span>
            <br />
            <span style={{ color: COLORS.accent }}>only.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed md:text-xl" style={{ color: COLORS.ink2 }}>
            Everything has changed. You either feel like you&rsquo;re on a rocketship —{" "}
            <span style={{ color: COLORS.accent, fontWeight: 700 }}>or you&rsquo;re already being left behind.</span>
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a
              href="/advertise/signup?offer=pay-for-success"
              className="rounded-full px-6 py-3 text-base font-bold"
              style={{ background: COLORS.accent, color: COLORS.ink, boxShadow: `0 12px 32px ${COLORS.accent}40` }}
            >
              Create an account →
            </a>
            <a
              href="#partner"
              className="rounded-full border px-6 py-3 text-base font-semibold"
              style={{ borderColor: COLORS.hairline2, color: COLORS.ink2 }}
            >
              Become a strategic partner
            </a>
          </div>
          <div className="mt-10 flex justify-center gap-2">
            {[COLORS.accent, COLORS.sky, COLORS.success, COLORS.gold, COLORS.violet].map((c, i) => (
              <span key={i} style={{ width: 36, height: 4, background: c, borderRadius: 2 }} />
            ))}
          </div>

          {/* Hero stat band */}
          <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { v: "$36 / $1", l: "avg email ROI", note: <>Litmus<Cite n={1} /></> },
              { v: "$2.6–4.4T", l: "annual genAI value", note: <>McKinsey<Cite n={2} /></> },
              { v: "36.2M", l: "US small businesses", note: <>SBA 2025<Cite n={5} /></> },
              { v: "$72B+", l: "wasted ad spend / yr", note: <>Statista<Cite n={7} /></> },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border p-4 text-left" style={{ borderColor: COLORS.hairline, background: COLORS.surface2 }}>
                <div className="text-2xl font-black md:text-3xl" style={{ color: COLORS.accent, letterSpacing: "-0.02em" }}>{s.v}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.ink2 }}>{s.l}</div>
                <div className="mt-0.5 text-[11px]" style={{ color: COLORS.ink4 }}>{s.note}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* SECTION — The future is now */}
      <section className="px-6 py-20" style={{ background: COLORS.bg }}>
        <div className="mx-auto max-w-3xl">
          <Eyebrow>The future is now</Eyebrow>
          <h2 className="text-4xl font-black leading-tight md:text-5xl" style={{ letterSpacing: "-0.02em" }}>
            <Outlined>Do you have what it takes to be successful in the future?</Outlined>
          </h2>
          <div className="mt-6 space-y-5 text-lg leading-relaxed" style={{ color: COLORS.ink2 }}>
            <p>
              AI is changing things faster than ever before. Economies are reshaping in real time.{" "}
              <strong style={{ color: COLORS.ink }}>What used to take 400 hours now takes four.</strong>
              <Cite n={2} />
            </p>
            <p>
              McKinsey&rsquo;s analysis pegs generative AI&rsquo;s annual economic potential at <strong style={{ color: COLORS.ink }}>$2.6–$4.4 trillion</strong> — and{" "}
              <strong style={{ color: COLORS.ink }}>75% of that value lands in marketing &amp; sales, customer operations, software engineering, and R&amp;D</strong>.<Cite n={2} /> Marketing and sales — that&rsquo;s our home turf.
            </p>
            <p>
              If you&rsquo;re not excited about the future — and not part of it — the old playbook isn&rsquo;t going to save you. No one knows exactly what comes next. But it&rsquo;s definitely not what worked in the past.
            </p>
            <p style={{ color: COLORS.ink3 }}>Those days are gone.</p>
          </div>
        </div>
      </section>

      {/* SECTION — The proof in the data */}
      <section id="proof" className="px-6 py-20" style={{ background: COLORS.surface }}>
        <div className="mx-auto max-w-6xl">
          <Eyebrow>The proof in the data</Eyebrow>
          <h2 className="text-4xl font-black leading-tight md:text-5xl" style={{ letterSpacing: "-0.02em" }}>
            <Outlined>The math is settled. The channel is email.</Outlined> <span style={{ color: COLORS.accent }}>The edge is Rocket Powered success.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-lg" style={{ color: COLORS.ink2 }}>
            Decade of independent benchmarks: email is the highest-ROI marketing channel on earth. Layer predictive analytics, big data, and AI on top — <strong style={{ color: COLORS.ink }}>Rocket Powered success</strong> — and the numbers compound.
          </p>

          {/* Chart 1: ROI bar */}
          <div className="mt-12 grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 rounded-2xl border p-6" style={{ borderColor: COLORS.hairline, background: COLORS.surface2 }}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold" style={{ color: COLORS.ink }}>Average ROI per $1 spent, by channel</div>
                  <div className="text-xs" style={{ color: COLORS.ink3 }}>Composite B2B benchmark, 2024–2025<Cite n={1} /></div>
                </div>
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.accent }}>chart 01</div>
              </div>
              <RoiBarChart />
            </div>
            <div className="lg:col-span-2 flex flex-col justify-center gap-5">
              <div>
                <div className="text-5xl font-black" style={{ color: COLORS.accent, letterSpacing: "-0.03em" }}>$36</div>
                <div className="mt-1 text-sm font-bold uppercase tracking-wider" style={{ color: COLORS.ink2 }}>back for every $1 in</div>
                <p className="mt-2 text-sm" style={{ color: COLORS.ink3 }}>
                  Litmus puts the median at <strong style={{ color: COLORS.ink }}>$36 / $1</strong>; top-quartile programs and ad/marketing agencies hit <strong style={{ color: COLORS.ink }}>$42 / $1</strong>.<Cite n={1} />
                </p>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: COLORS.hairline, background: COLORS.surface3 }}>
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.ink3 }}>Top-quartile email programs</div>
                <ul className="mt-2 space-y-1 text-sm" style={{ color: COLORS.ink2 }}>
                  <li>· 50%+ open rates<Cite n={10} /></li>
                  <li>· 10%+ click-through rates<Cite n={10} /></li>
                  <li>· 25–35% higher conversion from intent data<Cite n={8} /></li>
                  <li>· 30–40% shorter sales cycles<Cite n={8} /></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Chart 2: CPL bar */}
          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2 flex flex-col justify-center">
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.accent }}>The CPL gap</div>
              <h3 className="mt-1 text-3xl font-black" style={{ letterSpacing: "-0.02em" }}>
                <Outlined>$110 on LinkedIn.</Outlined> <span style={{ color: COLORS.accent }}>$5 minimum on r0cketship.</span>
              </h3>
              <p className="mt-3 text-sm" style={{ color: COLORS.ink3 }}>
                Industry-average B2B CPL: <strong style={{ color: COLORS.ink2 }}>$84</strong> blended, <strong style={{ color: COLORS.ink2 }}>$70</strong> on Google, <strong style={{ color: COLORS.ink2 }}>$110</strong> on LinkedIn, <strong style={{ color: COLORS.ink2 }}>up to $250</strong> on enterprise C-suite campaigns.<Cite n={4} />
              </p>
              <p className="mt-2 text-sm" style={{ color: COLORS.ink3 }}>
                Our floor is <strong style={{ color: COLORS.accent }}>$5</strong>. Premium niches bid up — but you set the ceiling, not us.
              </p>
            </div>
            <div className="lg:col-span-3 rounded-2xl border p-6" style={{ borderColor: COLORS.hairline, background: COLORS.surface2 }}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold" style={{ color: COLORS.ink }}>Cost per lead by channel</div>
                  <div className="text-xs" style={{ color: COLORS.ink3 }}>B2B benchmark, 2025<Cite n={4} /></div>
                </div>
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.accent }}>chart 02</div>
              </div>
              <CplComparison />
            </div>
          </div>

          {/* Chart 3 + 4: Donut + funnel */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border p-6" style={{ borderColor: COLORS.hairline, background: COLORS.surface2 }}>
              <div className="mb-4">
                <div className="text-sm font-bold" style={{ color: COLORS.ink }}>Where legacy ad budgets actually go</div>
                <div className="text-xs" style={{ color: COLORS.ink3 }}>88% leakage estimate from invalid traffic, viewability, and attribution gaps<Cite n={7} /></div>
              </div>
              <WasteDonut />
              <p className="mt-4 text-xs" style={{ color: COLORS.ink4 }}>
                $72B+ annually is lost to invalid traffic alone. r0cketship pays only on verified actions — you never fund a phantom impression.
              </p>
            </div>
            <div className="rounded-2xl border p-6" style={{ borderColor: COLORS.hairline, background: COLORS.surface2 }}>
              <div className="mb-4">
                <div className="text-sm font-bold" style={{ color: COLORS.ink }}>A typical r0cketship funnel</div>
                <div className="text-xs" style={{ color: COLORS.ink3 }}>Modeled on top-quartile B2B email benchmarks<Cite n={10} /></div>
              </div>
              <ConversionFunnel />
              <p className="mt-4 text-xs" style={{ color: COLORS.ink3 }}>
                Emails modified by proprietary technology — predictive analytics and big data, leveraging AI and machine learning — for high-intent delivery and optimal success.
              </p>
              <p className="mt-2 text-xs" style={{ color: COLORS.ink4 }}>
                You only pay on the rows you defined as the action. Everything above is on us.
              </p>
            </div>
          </div>

          {/* Chart 5: Learning curve */}
          <div className="mt-6 rounded-2xl border p-6" style={{ borderColor: COLORS.hairline, background: COLORS.surface2 }}>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-sm font-bold" style={{ color: COLORS.ink }}>CPA decline as the VRTCLS AI optimizer learns</div>
                <div className="text-xs" style={{ color: COLORS.ink3 }}>
                  Personalization compounds: McKinsey reports 5–15% revenue lift and up to 50% lower CAC from production-grade personalization<Cite n={3} />
                </div>
              </div>
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.accent }}>chart 05</div>
            </div>
            <CpaLearningChart />
          </div>
        </div>
      </section>

      {/* SECTION — Secret sauce + 4 levers */}
      <section className="px-6 py-20" style={{ background: COLORS.bg }}>
        <div className="mx-auto max-w-4xl">
          <Eyebrow>The secret sauce</Eyebrow>
          <h2 className="text-4xl font-black leading-tight md:text-5xl" style={{ letterSpacing: "-0.02em" }}>
            <Outlined>Built in today&rsquo;s modern age.</Outlined> <span style={{ color: COLORS.accent }}>For</span> <Outlined>today&rsquo;s modern age.</Outlined>
          </h2>
          <div className="mt-6 space-y-5 text-lg leading-relaxed" style={{ color: COLORS.ink2 }}>
            <p>
              Decades of business logic and success. Productized engines optimized for outcomes. A team of well-equipped geeks, executives, leaders, and high-performing humans — all operating in their <strong style={{ color: COLORS.ink }}>zones of genius</strong>.
            </p>
            <p>
              At the core: <strong style={{ color: COLORS.ink }}>VRTCLS AI</strong> — proprietary technology, big data, and artificial intelligence built to do what every business dreams of doing:
            </p>
            <p className="text-3xl font-black" style={{ color: COLORS.accent, letterSpacing: "-0.02em" }}>
              Run on levers.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              { title: "Systematically increase sales", desc: "Predictive targeting + AI-optimized outbound across our proprietary high intent network. Intent data lifts conversion 25–35%.", cite: 8 },
              { title: "Decrease operational strain", desc: "We carry the infrastructure. 91% of AI-augmented sales teams report stable or improving win rates while spending less time on grunt work.", cite: 9 },
              { title: "Increase profitability", desc: "Pay only for the actions that drive revenue. McKinsey: personalization can cut CAC up to 50% and lift revenue 5–15%.", cite: 3 },
              { title: "Reduce risk", desc: "Self-regulating CPA model. You control budget, cadence, and timing. Compliance carried by us — TCPA, CAN-SPAM, GDPR, CCPA.", cite: 11 },
            ].map((lever) => (
              <div key={lever.title} className="rounded-xl border p-5" style={{ borderColor: COLORS.hairline, background: COLORS.surface2 }}>
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${COLORS.accent}26` }}>
                  <span className="text-base font-extrabold" style={{ color: COLORS.accent }}>↑</span>
                </div>
                <div className="font-bold" style={{ color: COLORS.ink }}>{lever.title}</div>
                <div className="mt-1 text-sm" style={{ color: COLORS.ink3 }}>
                  {lever.desc}<Cite n={lever.cite} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION — How it works */}
      <section id="how" className="px-6 py-20" style={{ background: COLORS.surface }}>
        <div className="mx-auto max-w-6xl">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="text-4xl font-black leading-tight md:text-5xl" style={{ letterSpacing: "-0.02em" }}>
            <Outlined>Four steps.</Outlined> <span style={{ color: COLORS.accent }}>Same-day live.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-lg" style={{ color: COLORS.ink2 }}>
            No agency onboarding. No retainer. No locked contracts. Wallet in, KPI defined, engine on.
          </p>
          <div className="mt-10">
            <HowItWorks />
          </div>
        </div>
      </section>

      {/* SECTION — Stat strip */}
      <section className="px-6 py-16" style={{ background: COLORS.bg }}>
        <div className="mx-auto max-w-6xl">
          <Eyebrow>By the numbers</Eyebrow>
          <h2 className="text-3xl font-black leading-tight md:text-4xl" style={{ letterSpacing: "-0.02em" }}>
            <Outlined>The mechanics of the offer, in six numbers.</Outlined>
          </h2>
          <div className="mt-8">
            <StatStrip />
          </div>
        </div>
      </section>

      {/* SECTION — Comparison table */}
      <section className="px-6 py-20" style={{ background: COLORS.surface }}>
        <div className="mx-auto max-w-6xl">
          <Eyebrow>The honest comparison</Eyebrow>
          <h2 className="text-4xl font-black leading-tight md:text-5xl" style={{ letterSpacing: "-0.02em" }}>
            <Outlined>What you&rsquo;re leaving behind.</Outlined>
          </h2>
          <p className="mt-4 max-w-2xl text-lg" style={{ color: COLORS.ink2 }}>
            Every row is a place we make a different bet than the legacy stack. Not better marketing — different physics.
          </p>
          <div className="mt-10">
            <ComparisonTable />
          </div>
        </div>
      </section>

      {/* SECTION — Winning together */}
      <section className="px-6 py-20" style={{ background: COLORS.bg }}>
        <div className="mx-auto max-w-3xl">
          <Eyebrow>Winning together</Eyebrow>
          <h2 className="text-4xl font-black leading-tight md:text-5xl" style={{ letterSpacing: "-0.02em" }}>
            <Outlined>Working in silos is done.</Outlined>
          </h2>
          <div className="mt-6 space-y-5 text-lg leading-relaxed" style={{ color: COLORS.ink2 }}>
            <p>
              The future is <strong style={{ color: COLORS.ink }}>strategic partnerships and winning together.</strong>
            </p>
            <p>
              Activating humans to meet their potential — letting them thrive in their zone of genius, live a life, be their best selves, contribute individually <em>and</em> uplift the team. That&rsquo;s the future workforce. That&rsquo;s how successful organizations will operate.
            </p>
            <p style={{ color: COLORS.ink3 }}>
              This is not the time for your father&rsquo;s ideas, decks, systems, and thoughts. The future is now. You&rsquo;re either on the rocket ship — or you&rsquo;re not.
            </p>
            <p>
              <span className="rounded-md px-2 py-1 text-sm font-semibold" style={{ background: `${COLORS.violet}26`, color: COLORS.violet }}>
                Acquisition window
              </span>{" "}
              For those who aren&rsquo;t — there will be an acquisition phase. Operators with unique data, and people who fit the mold, can be acquired at all levels.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION — Two offers (substantially expanded) */}
      <section id="offers" className="px-6 py-20" style={{ background: COLORS.surface }}>
        <div className="mx-auto max-w-6xl">
          <Eyebrow>Two ways to ride</Eyebrow>
          <h2 className="text-center text-4xl font-black leading-tight md:text-5xl" style={{ letterSpacing: "-0.02em" }}>
            <Outlined>Pick your path forward.</Outlined>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base" style={{ color: COLORS.ink2 }}>
            Both offers run on the same VRTCLS AI engine and the same compliance stack. The difference is exclusivity and depth of the relationship.
          </p>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {/* OFFER 1 — Pay for Success */}
            <div
              className="rounded-2xl border p-8"
              id="pay-for-success"
              style={{ borderColor: COLORS.hairline2, background: `linear-gradient(135deg, ${COLORS.accent}14, transparent)` }}
            >
              <div className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.2em]" style={{ background: COLORS.accent, color: COLORS.ink }}>
                Option 01 · Self-serve
              </div>
              <h3 className="text-3xl font-black leading-tight" style={{ letterSpacing: "-0.02em" }}>
                <Outlined>Pay for</Outlined> <span style={{ color: COLORS.accent }}>Success</span>
              </h3>
              <p className="mt-3 text-base" style={{ color: COLORS.ink2 }}>
                Use us as a service. Pay only when the system delivers against your KPI.
              </p>

              {/* Pricing transparency */}
              <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border p-3" style={{ borderColor: COLORS.hairline, background: COLORS.surface3 }}>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.ink4 }}>Min CPA</div>
                  <div className="text-lg font-black" style={{ color: COLORS.accent }}>$5</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.ink4 }}>Min deposit</div>
                  <div className="text-lg font-black" style={{ color: COLORS.ink }}>$1,000</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.ink4 }}>Referral</div>
                  <div className="text-lg font-black" style={{ color: COLORS.ink }}>15% · 12mo</div>
                </div>
              </div>

              <ul className="mt-6 space-y-3 text-base" style={{ color: COLORS.ink2 }}>
                <li className="flex gap-2"><CheckIcon /> You know your KPIs. You manage accordingly.</li>
                <li className="flex gap-2"><CheckIcon /> You set the budget. You set the cost-per-action.</li>
                <li className="flex gap-2"><CheckIcon /> You control cadence, timing, and flights.</li>
                <li className="flex gap-2"><CheckIcon /> Turn it on and off when it suits you.</li>
                <li className="flex gap-2"><CheckIcon /> Same-day launch. No agency onboarding cycle.</li>
                <li className="flex gap-2"><CheckIcon /> Live dashboard, CRM webhooks, per-action audit trail.</li>
                <li className="flex gap-2"><CheckIcon /> <strong style={{ color: COLORS.ink }}>You only pay for optimized success.</strong></li>
              </ul>

              <div className="mt-5 rounded-lg p-3" style={{ background: `${COLORS.rose}10`, border: `1px solid ${COLORS.rose}33` }}>
                <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: COLORS.rose }}>What&rsquo;s NOT included</div>
                <p className="mt-1 text-xs" style={{ color: COLORS.ink3 }}>
                  No industry exclusivity. No dedicated account team. No co-built playbooks. You&rsquo;re running the same engine the next advertiser in your niche is running.
                </p>
              </div>

              {/* Mini-FAQ */}
              <details className="mt-5 rounded-lg p-3" style={{ background: COLORS.surface3, border: `1px solid ${COLORS.hairline}` }}>
                <summary className="cursor-pointer text-sm font-bold" style={{ color: COLORS.ink2 }}>Will my deposit refund if I pause?</summary>
                <p className="mt-2 text-xs" style={{ color: COLORS.ink3 }}>
                  Yes. Wallet funds are fully refundable on request, minus any in-flight verified actions. No expiration.
                </p>
              </details>

              <a
                href="/advertise/signup?offer=pay-for-success"
                className="mt-6 inline-flex w-full justify-center rounded-full px-6 py-4 text-base font-bold"
                style={{ background: COLORS.accent, color: COLORS.ink, boxShadow: `0 12px 32px ${COLORS.accent}40` }}
              >
                Create an account →
              </a>
              <a href="#sample-dashboard" className="mt-3 block text-center text-sm font-semibold" style={{ color: COLORS.ink3 }}>
                See sample dashboard →
              </a>
            </div>

            {/* OFFER 2 — Strategic Partner */}
            <div
              className="rounded-2xl border p-8"
              id="partner"
              style={{ borderColor: COLORS.hairline2, background: `linear-gradient(135deg, ${COLORS.violet}1f, transparent)` }}
            >
              <div className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.2em]" style={{ background: COLORS.violet, color: COLORS.ink }}>
                Option 02 · Exclusive
              </div>
              <h3 className="text-3xl font-black leading-tight" style={{ letterSpacing: "-0.02em" }}>
                <Outlined>Strategic</Outlined> <span style={{ color: COLORS.violet }}>Partner</span>
              </h3>
              <p className="mt-3 text-base" style={{ color: COLORS.ink2 }}>
                Step forward as <em>the one</em> strategic partner in your industry. We win together.
              </p>

              {/* Pricing transparency */}
              <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border p-3" style={{ borderColor: COLORS.hairline, background: COLORS.surface3 }}>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.ink4 }}>Exclusivity</div>
                  <div className="text-lg font-black" style={{ color: COLORS.violet }}>1:1</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.ink4 }}>Industries</div>
                  <div className="text-lg font-black" style={{ color: COLORS.ink }}>Top 80</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.ink4 }}>Term</div>
                  <div className="text-lg font-black" style={{ color: COLORS.ink }}>Renewable</div>
                </div>
              </div>

              <ul className="mt-6 space-y-3 text-base" style={{ color: COLORS.ink2 }}>
                <li className="flex gap-2"><CheckIcon color={COLORS.violet} /> Leverage our geek stack, AI stack, and proprietary data.</li>
                <li className="flex gap-2"><CheckIcon color={COLORS.violet} /> Build disruptive engines across your industry.</li>
                <li className="flex gap-2"><CheckIcon color={COLORS.violet} /> One strategic partner per industry — top 80 industries.</li>
                <li className="flex gap-2"><CheckIcon color={COLORS.violet} /> Co-built playbooks, dedicated account team.</li>
                <li className="flex gap-2"><CheckIcon color={COLORS.violet} /> First access to Phase 3 per-click optimizer beta.</li>
                <li className="flex gap-2"><CheckIcon color={COLORS.violet} /> Cross-channel activation lane (IoT, TV, podcasts, PR).</li>
                <li className="flex gap-2"><CheckIcon color={COLORS.violet} /> <strong style={{ color: COLORS.ink }}>As we get stronger, you get stronger.</strong></li>
              </ul>

              <div className="mt-5 rounded-lg p-3" style={{ background: `${COLORS.rose}10`, border: `1px solid ${COLORS.rose}33` }}>
                <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: COLORS.rose }}>What&rsquo;s NOT included</div>
                <p className="mt-1 text-xs" style={{ color: COLORS.ink3 }}>
                  Not a free pass. Strategic partners commit to a baseline spend and a quarterly business review. We pick partners who fit the mold; this is not an open auction.
                </p>
              </div>

              <details className="mt-5 rounded-lg p-3" style={{ background: COLORS.surface3, border: `1px solid ${COLORS.hairline}` }}>
                <summary className="cursor-pointer text-sm font-bold" style={{ color: COLORS.ink2 }}>How do you define an &ldquo;industry&rdquo;?</summary>
                <p className="mt-2 text-xs" style={{ color: COLORS.ink3 }}>
                  We map to NAICS 6-digit codes for exclusivity. Sub-categories and adjacent verticals are negotiated per application.
                </p>
              </details>

              <a
                href="/advertise/signup?offer=strategic-partner"
                className="mt-6 inline-flex w-full justify-center rounded-full px-6 py-4 text-base font-bold"
                style={{ background: COLORS.violet, color: COLORS.ink, boxShadow: `0 12px 32px ${COLORS.violet}40` }}
              >
                Apply as a strategic partner →
              </a>
              <a href="#sample-dashboard" className="mt-3 block text-center text-sm font-semibold" style={{ color: COLORS.ink3 }}>
                See sample dashboard →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION — Sample dashboard */}
      <section id="sample-dashboard" className="px-6 py-20" style={{ background: COLORS.bg }}>
        <div className="mx-auto max-w-6xl">
          <Eyebrow>Sample dashboard</Eyebrow>
          <h2 className="text-4xl font-black leading-tight md:text-5xl" style={{ letterSpacing: "-0.02em" }}>
            <Outlined>The console you&rsquo;ll spend an hour a week in.</Outlined>
          </h2>
          <p className="mt-4 max-w-2xl text-lg" style={{ color: COLORS.ink2 }}>
            Wallet, campaigns, CPA, spend, action receipts — one screen. No dashboards inside of dashboards. Numbers below are sample.
          </p>
          <div className="mt-10">
            <SampleDashboard />
          </div>
        </div>
      </section>

      {/* SECTION — Testimonials */}
      <section className="px-6 py-20" style={{ background: COLORS.surface }}>
        <div className="mx-auto max-w-6xl">
          <Eyebrow>Voices from early access</Eyebrow>
          <h2 className="text-4xl font-black leading-tight md:text-5xl" style={{ letterSpacing: "-0.02em" }}>
            <Outlined>What operators are</Outlined> <span style={{ color: COLORS.accent }}>actually saying.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-lg" style={{ color: COLORS.ink2 }}>
            We&rsquo;re in early access — and we&rsquo;re honest about it. The composites below are built from operator conversations in our beta cohort.
          </p>
          <div className="mt-10">
            <Testimonials />
          </div>
        </div>
      </section>

      {/* SECTION — Integrations */}
      <section className="px-6 py-20" style={{ background: COLORS.bg }}>
        <div className="mx-auto max-w-6xl">
          <Eyebrow>The stack you already run</Eyebrow>
          <h2 className="text-4xl font-black leading-tight md:text-5xl" style={{ letterSpacing: "-0.02em" }}>
            <Outlined>We plug into your tools. We don&rsquo;t replace them.</Outlined>
          </h2>
          <p className="mt-4 max-w-2xl text-lg" style={{ color: COLORS.ink2 }}>
            Verified actions hit your CRM. Wallet events hit your accounting. r0cketship is a demand layer, not another silo.
          </p>
          <div className="mt-10">
            <IntegrationsBelt />
          </div>
        </div>
      </section>

      {/* SECTION — Science behind the system */}
      <section className="px-6 py-20" style={{ background: COLORS.surface }}>
        <div className="mx-auto max-w-4xl">
          <Eyebrow>The science behind the system</Eyebrow>
          <h2 className="text-4xl font-black leading-tight md:text-5xl" style={{ letterSpacing: "-0.02em" }}>
            <Outlined>Not a hot take.</Outlined> <span style={{ color: COLORS.accent }}>Published research.</span>
          </h2>
          <p className="mt-4 text-lg" style={{ color: COLORS.ink2 }}>
            Every claim on this page maps to a footnote at the bottom. Here&rsquo;s the foundation we built on.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Generative AI economic potential",
                pub: "McKinsey, 2024",
                bullet: "Annual value: $2.6–$4.4T. Marketing & sales is one of four functions capturing 75% of the upside.",
                cite: 2,
              },
              {
                title: "Personalization revenue lift",
                pub: "McKinsey, 2023–2024",
                bullet: "5–15% revenue lift. Up to 50% lower CAC. 10–30% better marketing ROI when personalization is production-grade.",
                cite: 3,
              },
              {
                title: "Intent data effectiveness",
                pub: "Industry synthesis, 2025",
                bullet: "25–35% higher conversion. 30–40% shorter sales cycles. 35–50% win-rate lift when early outreach is triggered on intent.",
                cite: 8,
              },
              {
                title: "Email channel dominance",
                pub: "Litmus, 2024–2025",
                bullet: "Average $36 / $1 ROI across B2B email. Top-quartile programs hit 50%+ opens and 10%+ CTR.",
                cite: 1,
              },
              {
                title: "MarTech market scale",
                pub: "Precedence Research, 2025",
                bullet: "Global MarTech is $557B in 2025, projected to $3.28T by 2035 at a 19.4% CAGR.",
                cite: 6,
              },
              {
                title: "SMB economy",
                pub: "SBA Office of Advocacy, 2025",
                bullet: "36.2M US small businesses. 43.5% of US GDP. 9 in 10 net new jobs created by SMBs.",
                cite: 5,
              },
            ].map((c) => (
              <div key={c.title} className="rounded-xl border p-5" style={{ borderColor: COLORS.hairline, background: COLORS.surface2 }}>
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.accent }}>{c.pub}</div>
                <h4 className="mt-1 text-base font-black" style={{ color: COLORS.ink }}>{c.title}</h4>
                <p className="mt-2 text-sm" style={{ color: COLORS.ink3 }}>{c.bullet}<Cite n={c.cite} /></p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border p-6" style={{ borderColor: COLORS.hairline2, background: COLORS.surface2 }}>
            <h4 className="text-xl font-black" style={{ color: COLORS.ink, letterSpacing: "-0.01em" }}>Compliance posture</h4>
            <p className="mt-2 text-sm" style={{ color: COLORS.ink3 }}>
              All outbound activity is run through our compliance stack before send. Suppression lists, consent records, opt-out handling, and DNC scrubbing are auditable in your dashboard.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { label: "TCPA (47 U.S.C. § 227)", n: 12 },
                { label: "CAN-SPAM Act", n: 11 },
                { label: "GDPR (EU 2016/679)", n: 0 },
                { label: "CCPA / CPRA", n: 0 },
                { label: "SOC 2-aligned hosting", n: 0 },
              ].map((b) => (
                <span
                  key={b.label}
                  className="rounded-full border px-3 py-1 text-xs font-bold"
                  style={{ borderColor: COLORS.hairline2, color: COLORS.ink2, background: COLORS.surface3 }}
                >
                  {b.label}
                  {b.n > 0 && <Cite n={b.n} />}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION — Roadmap */}
      <section className="px-6 py-20" style={{ background: COLORS.bg }}>
        <div className="mx-auto max-w-5xl">
          <Eyebrow>Where we&rsquo;re going</Eyebrow>
          <h2 className="text-4xl font-black leading-tight md:text-5xl" style={{ letterSpacing: "-0.02em" }}>
            <Outlined>Four phases.</Outlined> <span style={{ color: COLORS.accent }}>One direction.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-lg" style={{ color: COLORS.ink2 }}>
            Forward and upward only. Strategic partners get to ride every release first.
          </p>
          <div className="mt-12">
            <Roadmap />
          </div>
        </div>
      </section>

      {/* SECTION — FAQ */}
      <section id="faq" className="px-6 py-20" style={{ background: COLORS.surface }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <Eyebrow>Frequently asked</Eyebrow>
            <h2 className="text-4xl font-black leading-tight md:text-5xl" style={{ letterSpacing: "-0.02em" }}>
              <Outlined>The questions every operator asks.</Outlined>
            </h2>
          </div>
          <Faq />
        </div>
      </section>

      {/* SECTION — Win-win thesis */}
      <section className="px-6 py-20" style={{ background: COLORS.bg }}>
        <div className="mx-auto max-w-3xl">
          <Eyebrow>The thesis</Eyebrow>
          <h2 className="text-4xl font-black leading-tight md:text-5xl" style={{ letterSpacing: "-0.02em" }}>
            <Outlined>We are</Outlined> <span style={{ color: COLORS.accent }}>better together</span> <Outlined>than apart.</Outlined>
          </h2>
          <div className="mt-6 space-y-5 text-lg leading-relaxed" style={{ color: COLORS.ink2 }}>
            <p>
              The business thesis is win-win. We have the technology IP. As success goes up — and we validate it together — we both win.
            </p>
            <p>
              As that happens, the door opens to other things: <strong style={{ color: COLORS.ink }}>IoT activations, TV commercials, podcasts, live interviews, social media, press releases.</strong> The world is our oyster. We&rsquo;ve been doing it for decades. We know which levers work.
            </p>
            <p>
              As we win as partners, we may reach out with other opportunities on your exact KPI — or you can let us manage it completely. Once we agree, <strong style={{ color: COLORS.accent }}>the sky is the limit.</strong>
            </p>
            <p>We are truly all on our rocketship together. Forward and upward only.</p>
          </div>
        </div>
      </section>

      {/* CLOSING — The movement */}
      <section
        className="px-6 py-24"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,107,53,0.18) 0%, transparent 70%),
            ${COLORS.bg}
          `,
        }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/rocket.png" alt="" width={72} height={72} style={{ filter: `drop-shadow(0 8px 28px ${COLORS.accent}80)` }} />
          </div>
          <h2 className="text-4xl font-black leading-tight md:text-6xl" style={{ letterSpacing: "-0.03em" }}>
            <Outlined>Every industry is a team of</Outlined> <span style={{ color: COLORS.accent }}>geeks</span> <Outlined>away from being Uberized.</Outlined>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: COLORS.ink2 }}>
            With our unique data and decades of experience — we hope to see you on the ride. 36.2 million US small businesses<Cite n={5} />. One rocketship.
          </p>
          <div className="mt-12 rounded-2xl border p-8" style={{ borderColor: COLORS.hairline2, background: COLORS.surface }}>
            <p className="text-2xl font-extrabold leading-snug" style={{ color: COLORS.ink, letterSpacing: "-0.01em" }}>
              Everything we do, we&rsquo;re building a movement.
            </p>
            <p className="mt-3 text-base" style={{ color: COLORS.ink3 }}>
              Not just a company. Not just a business. Not just a sales plan. Not just a technology.
              <br />A <span style={{ color: COLORS.accent, fontWeight: 700 }}>people-first movement.</span>
            </p>
            <p className="mt-6 text-xs font-bold tracking-[0.32em]" style={{ color: COLORS.accent }}>
              #ARTLAB · r0cketship
            </p>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <a
              href="/advertise/signup?offer=pay-for-success"
              className="rounded-full px-6 py-3 text-base font-bold"
              style={{ background: COLORS.accent, color: COLORS.ink, boxShadow: `0 12px 32px ${COLORS.accent}40` }}
            >
              Create an account →
            </a>
            <a
              href="/advertise/signup?offer=strategic-partner"
              className="rounded-full border px-6 py-3 text-base font-semibold"
              style={{ borderColor: COLORS.hairline2, color: COLORS.ink2 }}
            >
              Apply as a strategic partner
            </a>
          </div>
        </div>
      </section>

      {/* SECTION — Sources */}
      <section className="px-6 py-20" style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.hairline}` }}>
        <SourcesList />
        <p className="mx-auto mt-8 max-w-4xl text-xs" style={{ color: COLORS.ink4 }}>
          Industry benchmarks shift quarterly; we re-baseline this page every quarter against the underlying sources. Where a range is reported, the page picks the median figure. Sample dashboard, testimonials, and dashboard activity feeds are illustrative; campaign performance varies by niche, KPI strictness, and creative input.
        </p>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12" style={{ background: "#000000", borderTop: `1px solid ${COLORS.hairline}` }}>
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <a href="https://r0cketship.com" className="flex items-center gap-2 font-extrabold" style={{ color: COLORS.ink, letterSpacing: "-0.02em" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/rocket.png" alt="" width={20} height={20} />
              <span>r<span style={{ color: COLORS.accent }}>0</span>cketship</span>
            </a>
            <div className="flex flex-wrap gap-5 text-sm" style={{ color: COLORS.ink3 }}>
              <a href="https://r0cketship.com/about">About</a>
              <a href="https://r0cketship.com/how-it-works">How it works</a>
              <a href="https://r0cketship.com/pricing">Pricing</a>
              <a href="https://r0cketship.com/integrations">Integrations</a>
              <a href="https://r0cketship.com/niches">Niches</a>
              <a href="/advertise" style={{ color: COLORS.accent, fontWeight: 700 }}>Advertise with us</a>
              <a href="https://r0cketship.com/terms">Terms</a>
              <a href="https://r0cketship.com/contact">Contact</a>
            </div>
          </div>
          <div className="mt-8 text-xs" style={{ color: COLORS.ink4 }}>
            © {new Date().getFullYear()} r0cketship. Forward and upward only. #ARTLAB
          </div>
        </div>
      </footer>
    </main>
  );
}
