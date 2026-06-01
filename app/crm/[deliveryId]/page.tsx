import { notFound } from "next/navigation";
import { requireAuth } from "@/src/auth/guard";
import { getDeliveryDetail, getLeadNotes } from "@/src/delivery/notes";
import { AppShell } from "@/app/_app/AppShell";
import { PageHeader, Card, SectionTitle, Badge, Field } from "@/app/_ui/primitives";
import { addNoteAction } from "../actions";

const STATUSES = ["new", "contacted", "booked", "sold", "dead"] as const;

function fmt(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function dispoTone(s: string): "pos" | "neg" | "warn" | "accent" | "neutral" {
  if (s === "sold") return "pos";
  if (s === "dead") return "neg";
  if (s === "booked") return "accent";
  if (s === "contacted") return "warn";
  return "neutral";
}

export default async function LeadDetailPage({ params }: { params: Promise<{ deliveryId: string }> }) {
  const { deliveryId } = await params;
  const ctx = await requireAuth(["customer"]);
  const detail = await getDeliveryDetail(ctx.user.id, deliveryId);
  if (!detail) notFound();
  const { delivery, lead } = detail;
  const notes = await getLeadNotes(deliveryId);
  const brand = ctx.tenant.moneyWord.replace(/\b\w/g, (c) => c.toUpperCase());

  // Every non-empty lead field, including unknown `extra` columns.
  const fields: { label: string; value: string }[] = [];
  const add = (label: string, v: unknown) => {
    if (v == null) return;
    const s = Array.isArray(v) ? v.filter(Boolean).join(", ") : String(v);
    if (s.trim() !== "") fields.push({ label, value: s });
  };
  add("First name", lead.firstName);
  add("Last name", lead.lastName);
  add("Address", lead.address);
  add("City", lead.city);
  add("State", lead.state);
  add("ZIP", [lead.zip, lead.zip4].filter(Boolean).join("-"));
  add("Mobile phones", lead.mobilePhones);
  add("Phones", lead.personalPhones);
  add("Emails", lead.emails);
  add("Business email", lead.businessEmail);
  add("Segment", lead.segment);
  add("Score", lead.scoreCategory);
  add("Age range", lead.ageRange);
  add("Income range", lead.incomeRange);
  add("Net worth", lead.netWorth);
  add("Gender", lead.gender);
  add("Job title", lead.jobTitle);
  add("Department", lead.department);
  add("Company", lead.companyName);
  add("Company domain", lead.companyDomain);
  add("Company revenue", lead.companyRevenue);
  add("Company employees", lead.companyEmployeeCount);
  add("Company state", lead.companyState);
  add("LinkedIn", lead.linkedinUrl);
  add("Company LinkedIn", lead.companyLinkedinUrl);
  add("Email validation", lead.businessEmailValidationStatus);
  add("Country", lead.contactCountry);
  add("Last updated", lead.lastUpdated ? fmt(lead.lastUpdated) : null);
  for (const [k, v] of Object.entries(lead.extra ?? {})) add(k, v);

  return (
    <AppShell brand={brand} role="customer">
      <PageHeader
        title={`${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim() || "Lead"}
        subtitle={[lead.city, lead.state].filter(Boolean).join(", ")}
        actions={<a href="/crm" className="btn btn-ghost">← Back to CRM</a>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Badge tone={dispoTone(delivery.status)}>{delivery.status}</Badge>
        <span className="text-sm" style={{ color: "var(--muted)" }}>Delivered {fmt(delivery.deliveredAt)}</span>
        {delivery.saleValue && <span className="text-sm" style={{ color: "var(--pos)" }}>Sale ${delivery.saleValue}</span>}
        <span className="text-sm" style={{ color: "var(--muted-2)" }}>{delivery.tierAtDelivery} · {delivery.priceCredits} credits</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Full lead data */}
        <Card className="lg:col-span-3">
          <SectionTitle>Full lead data</SectionTitle>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {fields.map((f, i) => (
              <div key={i}>
                <dt className="label">{f.label}</dt>
                <dd className="mt-0.5 text-sm break-words" style={{ color: "var(--ink)" }}>{f.value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Activity / notes timeline */}
        <Card className="lg:col-span-2">
          <SectionTitle hint={`${notes.length}`}>Activity &amp; notes</SectionTitle>

          <form action={addNoteAction} className="flex flex-col gap-3">
            <input type="hidden" name="deliveryId" value={deliveryId} />
            <Field label="Add a note">
              <textarea name="body" rows={3} placeholder="Called — left voicemail…" className="input" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Disposition">
                <select name="disposition" defaultValue="" className="input">
                  <option value="">— no change —</option>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Sale $ (optional)">
                <input name="saleValue" placeholder="0" className="input" />
              </Field>
            </div>
            <button className="btn btn-primary">Add to timeline</button>
          </form>

          <div className="mt-5 flex flex-col gap-3">
            {notes.length === 0 && <p className="text-sm" style={{ color: "var(--muted)" }}>No activity yet. Add the first note above.</p>}
            {notes.map((n) => (
              <div key={n.id} className="rounded-lg border p-3" style={{ borderColor: "var(--line)" }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{fmt(n.createdAt)}</span>
                  {n.disposition && <Badge tone={dispoTone(n.disposition)}>{n.disposition}</Badge>}
                </div>
                {n.body && <p className="mt-1.5 text-sm whitespace-pre-wrap" style={{ color: "var(--ink)" }}>{n.body}</p>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
