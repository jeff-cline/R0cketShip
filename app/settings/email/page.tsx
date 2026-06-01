import { requireAuth } from "@/src/auth/guard";
import { getEmailSettings } from "@/src/email/campaign";
import { saveEmailAction } from "./actions";

export default async function EmailSettingsPage() {
  const ctx = await requireAuth(["customer"]);
  const s = await getEmailSettings(ctx.user.id);
  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="text-2xl font-bold">Email &amp; booking</h1>
      <p className="mt-1 text-sm opacity-70">We email your leads an offer with a tracked link to your booking calendar. A click marks that lead <strong>booked</strong> (a conversion). Use <code>{"{{name}}"}</code> and <code>{"{{booking_link}}"}</code> in your template.</p>
      <form action={saveEmailAction} className="mt-4 flex flex-col gap-2">
        <input name="bookingUrl" defaultValue={s.bookingUrl ?? ""} placeholder="https://calendly.com/you" className="rounded border p-2" />
        <input name="emailSubject" defaultValue={s.emailSubject ?? ""} placeholder="Email subject" className="rounded border p-2" />
        <textarea name="emailBodyHtml" defaultValue={s.emailBodyHtml ?? ""} placeholder={'<p>Hi {{name}}, we have an offer. <a href="{{booking_link}}">Book a time</a>.</p>'} rows={6} className="rounded border p-2" />
        <button className="self-start rounded bg-black px-3 py-2 text-white">Save template</button>
      </form>
    </main>
  );
}
