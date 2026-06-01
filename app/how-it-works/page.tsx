export default function HowItWorksPage() {
  const steps = [
    ["Create your account", "Sign up free and get $50 in lead credits — no card required."],
    ["Pick your ZIP & filters", "Choose your territory, demographics, segment, and lead recency."],
    ["Buy & receive leads", "Spend credits on high-intent leads; they unlock with full contact info."],
    ["Work them in your CRM", "Track status, conversions, and sales — and auto-push to your own CRM."],
  ];
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold">How it works</h1>
      <ol className="mt-6 space-y-4">
        {steps.map(([t, d], i) => (
          <li key={t} className="flex gap-3"><span className="font-bold" style={{ color: "var(--color-accent)" }}>{i + 1}</span><div><div className="font-semibold">{t}</div><div className="text-sm opacity-75">{d}</div></div></li>
        ))}
      </ol>
      <a href="/signup" className="mt-6 inline-block underline">Get started →</a>
    </main>
  );
}
