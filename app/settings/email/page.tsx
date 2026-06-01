import { requireAuth } from "@/src/auth/guard";
import { getEmailSettings } from "@/src/email/campaign";
import { AppShell } from "@/app/_app/AppShell";
import { PageHeader, Card, SectionTitle, Field } from "@/app/_ui/primitives";
import { saveEmailAction } from "./actions";

export default async function EmailSettingsPage() {
  const ctx = await requireAuth(["customer"]);
  const s = await getEmailSettings(ctx.user.id);
  const brand = ctx.tenant.moneyWord.replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <AppShell brand={brand} role="customer">
      <PageHeader title="Email & booking" subtitle="Configure your offer email and calendar link." />

      <Card>
        <SectionTitle>Offer email</SectionTitle>
        <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
          We email your leads an offer with a tracked link to your booking calendar. A click marks that lead{" "}
          <strong>booked</strong> (a conversion). Use{" "}
          <code className="rounded px-1.5 py-0.5" style={{ background: "var(--surface-3)" }}>{"{{name}}"}</code> and{" "}
          <code className="rounded px-1.5 py-0.5" style={{ background: "var(--surface-3)" }}>{"{{booking_link}}"}</code> in your template.
        </p>
        <form action={saveEmailAction} className="flex flex-col gap-4">
          <Field label="Booking URL">
            <input name="bookingUrl" defaultValue={s.bookingUrl ?? ""} placeholder="https://calendly.com/you" className="input" />
          </Field>
          <Field label="Email subject">
            <input name="emailSubject" defaultValue={s.emailSubject ?? ""} placeholder="Email subject" className="input" />
          </Field>
          <Field label="Email body (HTML)">
            <textarea
              name="emailBodyHtml"
              defaultValue={s.emailBodyHtml ?? ""}
              placeholder={'<p>Hi {{name}}, we have an offer. <a href="{{booking_link}}">Book a time</a>.</p>'}
              rows={6}
              className="input"
            />
          </Field>
          <button className="btn btn-primary self-start">Save template</button>
        </form>
      </Card>
    </AppShell>
  );
}
