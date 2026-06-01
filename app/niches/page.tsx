import { getCurrentTenant } from "@/src/tenant/context";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { MarketingNav } from "@/app/_marketing/MarketingNav";
import { MarketingFooter } from "@/app/_marketing/MarketingFooter";
import type { Metadata } from "next";

function titleCase(s: string): string {
  return s
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function generateMetadata(): Metadata {
  return {
    title: "Lead Networks by Niche — R0cketShip",
    description:
      "Browse R0cketShip's white-label lead networks — predictive, ZIP-exclusive leads for roofing, solar, and more.",
    robots: { index: true, follow: true },
  };
}

export default async function NichesPage() {
  const current = await getCurrentTenant();
  const all = await db.select().from(tenants).where(eq(tenants.status, "active"));
  const list = all.filter(
    (t) => t.domain.replace(/^www\./, "") !== "r0cketship.com",
  );

  const brand = current?.moneyWord ?? "R0cketShip";

  return (
    <>
      <MarketingNav brand={brand} />

      <header
        className="px-6 py-20 text-center"
        style={{
          background:
            "linear-gradient(160deg, var(--bg-app), color-mix(in srgb, var(--color-accent) 10%, var(--bg-app)))",
        }}
      >
        <div
          className="text-sm font-bold uppercase tracking-wide"
          style={{ color: "var(--color-accent)" }}
        >
          {brand}
        </div>
        <h1
          className="mt-3 text-4xl font-extrabold sm:text-5xl"
          style={{ color: "var(--ink)" }}
        >
          Lead networks for every niche
        </h1>
        <p className="mt-4 text-lg" style={{ color: "var(--muted)" }}>
          Predictive, ZIP-exclusive leads — pick your industry.
        </p>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        {list.length === 0 ? (
          <p className="text-center text-lg" style={{ color: "var(--muted)" }}>
            New niche networks launching soon.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((t) => {
              const thumb = t.heroImage ?? t.logoUrl ?? null;
              return (
                <a
                  key={t.id}
                  href={`https://${t.domain}`}
                  className="card p-6 block transition hover:-translate-y-0.5"
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt=""
                      className="mb-4 h-28 w-full rounded object-cover"
                    />
                  ) : null}
                  <div
                    className="text-sm font-bold uppercase tracking-wide"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {titleCase(t.niche)}
                  </div>
                  <h2 className="mt-2 text-xl font-extrabold" style={{ color: "var(--ink)" }}>
                    {titleCase(t.niche)} Leads
                  </h2>
                  <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
                    Exclusive {t.niche} leads in your ZIP — predictive intent,
                    delivered to your CRM.
                  </p>
                  <div
                    className="mt-4 text-sm font-semibold"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {t.domain} →
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </main>

      <MarketingFooter footerHtml={current?.footerHtml ?? ""} />
    </>
  );
}
