import type { TicketRow } from "./tickets";
import { TicketReserve } from "./TicketReserve";

const usd = (c: number) => `$${(c / 100).toFixed(0)}`;

export function TicketsSection({ tickets, title = "Tickets & experiences", compact = false }: { tickets: TicketRow[]; title?: string; compact?: boolean }) {
  if (tickets.length === 0) return null;
  return (
    <section id="tickets" className={compact ? "" : "px-5 py-14 sm:px-8"}>
      <div className={compact ? "" : "mx-auto max-w-6xl"}>
        <h2 className="text-2xl font-extrabold sm:text-3xl" style={{ color: "#0a0e17" }}>{title}</h2>
        {!compact && <p className="mt-1 text-sm" style={{ color: "#61708a" }}>Bookable excursions and events at crew prices.</p>}
        <div className={`mt-6 grid gap-5 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
          {tickets.map((t) => (
            <div key={t.id} className="flex flex-col overflow-hidden rounded-2xl border bg-white" style={{ borderColor: "#e6eaf1" }}>
              {t.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.imageUrl} alt={t.name} className="h-36 w-full object-cover" />
              )}
              <div className="flex flex-1 flex-col p-4">
                <div className="text-base font-extrabold" style={{ color: "#0a0e17" }}>{t.name}</div>
                {t.description && <p className="mt-1 flex-1 text-sm leading-relaxed" style={{ color: "#61708a" }}>{t.description}</p>}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-extrabold" style={{ color: "#0a0e17" }}>{usd(t.priceCents)}</span>
                  <TicketReserve ticketId={t.id} name={t.name} priceCents={t.priceCents} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
