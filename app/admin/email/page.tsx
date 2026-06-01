import { asc, desc, eq } from "drizzle-orm";
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { emailMailboxes, emailOutbound, emailInbound, tenants } from "@/src/db/schema";
import { poolCapacity } from "@/src/email/mailbox";
import { getOutboundSettings, DEFAULT_AUTO_REPLY } from "@/src/email/settings";
import { zapmailConfigured, fetchZapmailMailboxes } from "@/src/email/zapmail";
import { PageHeader, Card, SectionTitle, StatCard, Badge, Field, Table, Tr, Td } from "@/app/_ui/primitives";
import {
  addMailboxAction,
  updateMailboxAction,
  deleteMailboxAction,
  importZapmailAction,
  saveEmailSettingsAction,
  sendTestEmailAction,
} from "./actions";

function fmt(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function statusTone(s: string): "pos" | "neg" | "warn" | "neutral" {
  if (s === "sent") return "pos";
  if (s === "failed") return "neg";
  if (s === "skipped") return "warn";
  return "neutral";
}

export default async function EmailAdminPage() {
  const ctx = await requireAuth(["god", "manager"]);
  const isGod = ctx.user.role === "god";
  const tenantId = ctx.user.tenantId;
  const today = new Date().toISOString().slice(0, 10);
  const base = `https://${ctx.tenant.domain}`;

  const pool = await poolCapacity(tenantId);
  const settings = await getOutboundSettings(tenantId);

  // God sees ALL white-labels' email activity (a copy of every white-label send
  // lives in the platform view); a manager sees only their own tenant's.
  const outboundQ = db.select().from(emailOutbound).orderBy(desc(emailOutbound.createdAt)).limit(30);
  const inboundQ = db.select().from(emailInbound).orderBy(desc(emailInbound.receivedAt)).limit(30);
  const outbound = isGod ? await outboundQ : await outboundQ.where(eq(emailOutbound.tenantId, tenantId));
  const inbound = isGod ? await inboundQ : await inboundQ.where(eq(emailInbound.tenantId, tenantId));

  // God-only: the shared Zapmail pool (mailboxes on the platform tenant) + Zapmail account status.
  let sharedMailboxes: (typeof emailMailboxes.$inferSelect)[] = [];
  let zapConfigured = false;
  let zapCount = 0;
  let zapError: string | undefined;
  let domainById = new Map<string, string>();
  if (isGod) {
    const [mb, zc, tlist] = await Promise.all([
      db.select().from(emailMailboxes).where(eq(emailMailboxes.tenantId, tenantId)).orderBy(asc(emailMailboxes.address)),
      zapmailConfigured(tenantId),
      db.select({ id: tenants.id, domain: tenants.domain }).from(tenants),
    ]);
    sharedMailboxes = mb;
    zapConfigured = zc;
    domainById = new Map(tlist.map((t) => [t.id, t.domain]));
    if (zc) {
      const za = await fetchZapmailMailboxes(tenantId);
      zapCount = za.mailboxes.length;
      zapError = za.error;
    }
  }
  const wl = (id: string) => domainById.get(id) ?? "—";

  return (
    <>
      <PageHeader
        title="Email"
        subtitle={isGod ? "One shared Zapmail pool powers every white-label. Manage it here and watch all email activity." : "Your emails send through the platform's shared Zapmail pool."}
      />

      <div className="flex flex-col gap-6">
        {/* Capacity */}
        <Card>
          <SectionTitle>Daily capacity</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Mailboxes in pool" value={String(pool.mailboxes)} />
            <StatCard label="Daily capacity" value={String(pool.cap)} />
            <StatCard label="Remaining today" value={String(pool.remaining)} accent />
          </div>
          <p className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
            {isGod
              ? "Each mailbox sends ~50/day. All password resets, auto-replies and notifications across every white-label flow through this pool."
              : "Capacity is shared across the platform. All your password resets and auto-replies send from here automatically — nothing to set up."}
          </p>
        </Card>

        {/* GOD: the shared Zapmail pool */}
        {isGod && (
          <Card>
            <SectionTitle hint={zapConfigured ? (zapError ? `Zapmail: ${zapError}` : `${zapCount} mailboxes in your Zapmail account`) : "Add your Zapmail key in Settings"}>
              Zapmail pool
            </SectionTitle>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <form action={importZapmailAction}>
                <button className="btn btn-primary" disabled={!zapConfigured}>Sync from Zapmail</button>
              </form>
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                Pulls every mailbox from your Zapmail account into the shared pool — active immediately (app passwords come from Zapmail). Re-run anytime.
              </span>
            </div>
            <Table head={["Mailbox", "Domain", "Today", "Cap", "Status", ""]}>
              {sharedMailboxes.length === 0 ? (
                <Tr><Td className="text-sm"><span style={{ color: "var(--muted)" }}>No mailboxes yet — click “Sync from Zapmail”.</span></Td><Td>{""}</Td><Td>{""}</Td><Td>{""}</Td><Td>{""}</Td><Td>{""}</Td></Tr>
              ) : (
                sharedMailboxes.map((m) => {
                  const used = m.sentDate === today ? m.sentToday : 0;
                  return (
                    <Tr key={m.id}>
                      <Td>
                        <div className="font-medium">{m.address}</div>
                        {m.displayName && <div className="text-xs" style={{ color: "var(--muted)" }}>{m.displayName}</div>}
                      </Td>
                      <Td>{m.address.split("@")[1] ?? "—"}</Td>
                      <Td>{used}/{m.dailyCap}</Td>
                      <Td>{m.dailyCap}</Td>
                      <Td><Badge tone={m.status === "active" ? "pos" : "neutral"}>{m.status}</Badge></Td>
                      <Td>
                        <div className="flex items-center justify-end gap-2">
                          <form action={updateMailboxAction} className="flex items-center gap-1.5">
                            <input type="hidden" name="mailboxId" value={m.id} />
                            <select name="status" defaultValue={m.status} className="input" style={{ padding: "5px 8px", width: "auto" }}>
                              <option value="active">active</option>
                              <option value="paused">paused</option>
                            </select>
                            <input name="dailyCap" type="number" min={1} defaultValue={m.dailyCap} className="input" style={{ padding: "5px 8px", width: "68px" }} />
                            <button className="btn btn-ghost" style={{ padding: "5px 11px" }}>Save</button>
                          </form>
                          <form action={deleteMailboxAction}>
                            <input type="hidden" name="mailboxId" value={m.id} />
                            <button className="btn btn-ghost" style={{ padding: "5px 11px" }}>Remove</button>
                          </form>
                        </div>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Table>

            <details className="mt-4">
              <summary className="cursor-pointer text-sm" style={{ color: "var(--muted)" }}>Add a mailbox manually (non-Zapmail SMTP)</summary>
              <form action={addMailboxAction} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Address"><input name="address" type="email" required placeholder="sales@yourdomain.com" className="input" /></Field>
                <Field label="Display name"><input name="displayName" placeholder="Sales Team" className="input" /></Field>
                <Field label="SMTP host"><input name="smtpHost" placeholder="smtp.gmail.com" className="input" /></Field>
                <Field label="SMTP port"><input name="smtpPort" defaultValue="587" className="input" /></Field>
                <Field label="SMTP user"><input name="smtpUser" placeholder="sales@yourdomain.com" className="input" /></Field>
                <Field label="SMTP password"><input name="smtpPassword" type="password" placeholder="app password" className="input" /></Field>
                <Field label="Daily cap"><input name="dailyCap" type="number" min={1} defaultValue={50} className="input" /></Field>
                <div className="flex items-end"><button className="btn btn-ghost">Add mailbox</button></div>
              </form>
            </details>
          </Card>
        )}

        {/* Send test */}
        <Card>
          <SectionTitle>Send test</SectionTitle>
          <form action={sendTestEmailAction} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[260px] flex-1"><Field label="To"><input name="to" type="email" required placeholder="you@example.com" className="input" /></Field></div>
            <button className="btn btn-primary">Send test</button>
          </form>
        </Card>

        {/* Settings */}
        <Card>
          <SectionTitle>Settings</SectionTitle>
          <form action={saveEmailSettingsAction} className="flex flex-col gap-3">
            {isGod && (
              <Field label="Zapmail API key" hint="The shared account key for the whole platform. Workspace auto-detects.">
                <input name="zapmailApiKey" type="password" placeholder={zapConfigured ? "•••• saved — leave blank to keep" : "paste your Zapmail API key"} className="input" />
              </Field>
            )}
            <Field label="Booking URL" hint="Used in auto-replies & password emails">
              <input name="bookingUrl" defaultValue={settings.bookingUrl ?? ""} placeholder="https://calendly.com/you" className="input" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input name="autoReplyEnabled" type="checkbox" defaultChecked={settings.autoReplyEnabled} />
              <span>Auto-reply to inbound replies with the booking link</span>
            </label>
            <Field label="Auto-reply HTML" hint="Tokens: {{booking_link}} {{brand}}">
              <textarea className="input" name="autoReplyHtml" rows={6} defaultValue={settings.autoReplyHtml ?? DEFAULT_AUTO_REPLY} />
            </Field>
            <div><button className="btn btn-primary">Save settings</button></div>
          </form>
        </Card>

        {/* Outbound log */}
        <Card>
          <SectionTitle hint={isGod ? "all white-labels" : undefined}>Outbound log</SectionTitle>
          <Table head={isGod ? ["White-label", "To", "Subject", "Kind", "Status", "When"] : ["To", "Subject", "Kind", "Status", "When"]}>
            {outbound.length === 0 ? (
              <Tr><Td><span style={{ color: "var(--muted)" }}>No sends yet.</span></Td><Td>{""}</Td><Td>{""}</Td><Td>{""}</Td><Td>{""}</Td>{isGod && <Td>{""}</Td>}</Tr>
            ) : (
              outbound.map((o) => (
                <Tr key={o.id}>
                  {isGod && <Td><span className="chip">{wl(o.tenantId)}</span></Td>}
                  <Td>{o.toAddr}</Td>
                  <Td>{o.subject ?? "—"}</Td>
                  <Td><span className="chip">{o.kind}</span></Td>
                  <Td><Badge tone={statusTone(o.status)}>{o.status}</Badge></Td>
                  <Td>{fmt(o.createdAt)}</Td>
                </Tr>
              ))
            )}
          </Table>
        </Card>

        {/* Inbound */}
        <Card>
          <SectionTitle hint={isGod ? "all white-labels" : undefined}>Inbound &amp; auto-replies</SectionTitle>
          {inbound.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Inbound replies appear here. Forward your mailbox replies to POST {base}/api/email/inbound/{tenantId}.
            </p>
          ) : (
            <Table head={isGod ? ["White-label", "From", "Subject", "Auto-replied", "When"] : ["From", "Subject", "Auto-replied", "When"]}>
              {inbound.map((i) => (
                <Tr key={i.id}>
                  {isGod && <Td><span className="chip">{wl(i.tenantId)}</span></Td>}
                  <Td>{i.fromAddr}</Td>
                  <Td>{i.subject ?? "—"}</Td>
                  <Td><Badge tone={i.autoReplied ? "pos" : "neutral"}>{i.autoReplied ? "Yes" : "No"}</Badge></Td>
                  <Td>{fmt(i.receivedAt)}</Td>
                </Tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
