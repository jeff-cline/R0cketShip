import { getCurrentTenant } from "@/src/tenant/context";
export default async function AboutPage() {
  const t = await getCurrentTenant();
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold">About {t?.moneyWord}</h1>
      <p className="mt-4 opacity-80">We connect {t?.niche} businesses with consumers who are actively in-market, using predictive and intent signals across billions of data points. Data drives decisions — and we put you in front of the right people at the right time, by ZIP code, with exclusivity and the buying power of a nationwide network.</p>
      <a href="/signup" className="mt-6 inline-block underline">Get started — $50 free →</a>
    </main>
  );
}
