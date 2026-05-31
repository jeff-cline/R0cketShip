import { getCurrentTenant } from "@/src/tenant/context";
import { notFound } from "next/navigation";

export default async function Page() {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();

  return (
    <main>
      <header
        className="px-8 py-16 text-center"
        style={{ background: "var(--color-primary)", color: "var(--color-background)" }}
      >
        <h1 className="text-4xl font-bold capitalize">{tenant.moneyWord}</h1>
        <p className="mt-2 opacity-80">{tenant.niche}</p>
      </header>

      <section className="mx-auto grid max-w-5xl gap-6 px-8 py-12 md:grid-cols-3">
        {tenant.offers.map((offer) => (
          <div
            key={offer.id}
            className="rounded-xl border p-6"
            style={{ borderColor: "var(--color-secondary)" }}
          >
            <h2 className="text-xl font-semibold" style={{ color: "var(--color-accent)" }}>
              {offer.title}
            </h2>
            <p className="mt-2 text-sm opacity-80">{offer.description}</p>
            <p className="mt-4 font-bold">{offer.price}</p>
          </div>
        ))}
      </section>

      <footer
        className="px-8 py-8 text-center text-sm"
        style={{ background: "var(--color-secondary)", color: "var(--color-background)" }}
        dangerouslySetInnerHTML={{ __html: tenant.footerHtml }}
      />
    </main>
  );
}
