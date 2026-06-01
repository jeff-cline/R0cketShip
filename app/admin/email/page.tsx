import { asc, desc, eq } from "drizzle-orm";
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { emailMailboxes, emailOutbound, emailInbound } from "@/src/db/schema";
import { poolCapacity } from "@/src/email/mailbox";
import { getOutboundSettings, DEFAULT_AUTO_REPLY } from "@/src/email/settings";
import { zapmailConfigured } from "@/src/email/zapmail";
import {
  PageHeader,
  Card,
  SectionTitle,
  StatCard,
  Badge,
  Field,
  Table,
  Tr,
  Td,
} from "@/app/_ui/primitives";
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
  return dt.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusTone(s: string): "pos" | "neg" | "warn" | "neutral" {
  if (s === "sent") return "pos";
  if (s === "failed") return "neg";
  if (s === "skipped") return "warn";
  return "neutral";
}

export default async function EmailAdminPage() {
  const ctx = await requireAuth(["god", "manager"]);
  const tenantId = ctx.user.tenantId;
  const today = new Date().toISOString().slice(0, 10);
  const base = `https://${ctx.tenant.domain}`;

  const [mailboxes, pool, settings, outbound, inbound, zapConfigured] = await Promise.all([
    db.select().from(emailMailboxes).where(eq(emailMailboxes.tenantId, tenantId)).orderBy(asc(emailMailboxes.address)),
    poolCapacity(tenantId),
    getOutboundSettings(tenantId),
    db.select().from(emailOutbound).where(eq(emailOutbound.tenantId, tenantId)).orderBy(desc(emailOutbound.createdAt)).limit(25),
    db.select().from(emailInbound).where(eq(emailInbound.tenantId, tenantId)).orderBy(desc(emailInbound.receivedAt)).limit(25),
    zapmailConfigured(tenantId),
  ]);

  return (
    <>
      <PageHeader
        title="Outbound email"
        subtitle="Send through your mailbox pool, watch sends & replies, auto-respond with your booking link."
      />

      <div className="flex flex-col gap-6">
        {/* 1. Capacity */}
        <Card>
          <SectionTitle>Capacity</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Mailboxes" value={String(pool.mailboxes)} />
            <StatCard label="Daily capacity" value={String(pool.cap)} />
            <StatCard label="Remaining today" value={String(pool.remaining)} accent />
          </div>
          <p className="mt-3 text-xs" style={{ color: "var(--muted)" }}>
            Each mailbox sends ~50/day; add more mailboxes to scale.
          </p>
        </Card>

        {/* 2. Mailboxes */}
        <Card>
          <SectionTitle>Mailboxes</SectionTitle>
          <Table head={["Address", "Provider", "Today", "Cap", "Status", ""]}>
            {mailboxes.length === 0 ? (
              <Tr>
                <Td className="text-sm">
                  <span style={{ color: "var(--muted)" }}>No mailboxes yet — add one below.</span>
                </Td>
                <Td>{""}</Td>
                <Td>{""}</Td>
                <Td>{""}</Td>
                <Td>{""}</Td>
                <Td>{""}</Td>
              </Tr>
            ) : (
              mailboxes.map((m) => {
                const used = m.sentDate === today ? m.sentToday : 0;
                return (
                  <Tr key={m.id}>
                    <Td>
                      <div className="font-medium">{m.address}</div>
                      {m.displayName && (
                        <div className="text-xs" style={{ color: "var(--muted)" }}>{m.displayName}</div>
                      )}
                    </Td>
                    <Td>
                      <span className="chip">{m.provider}</span>
                    </Td>
                    <Td>{used}/{m.dailyCap}</Td>
                    <Td>{m.dailyCap}</Td>
                    <Td>
                      <Badge tone={m.status === "active" ? "pos" : "neutral"}>{m.status}</Badge>
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-2">
                        <form action={updateMailboxAction} className="flex items-center gap-1.5">
                          <input type="hidden" name="mailboxId" value={m.id} />
                          <select name="status" defaultValue={m.status} className="input" style={{ padding: "5px 8px", width: "auto" }}>
                            <option value="active">active</option>
                            <option value="paused">paused</option>
                          </select>
                          <input
                            name="dailyCap"
                            type="number"
                            min={1}
                            defaultValue={m.dailyCap}
                            className="input"
                            style={{ padding: "5px 8px", width: "72px" }}
                          />
                          <input
                            name="smtpPassword"
                            type="password"
                            placeholder="new app pw (optional)"
                            className="input"
                            style={{ padding: "5px 8px", width: "150px" }}
                          />
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

          {/* Add mailbox */}
          <div className="mt-4 rounded-[var(--radius-lg)] p-4" style={{ background: "var(--surface-2)" }}>
            <SectionTitle hint="Use your Zapmail/Google Workspace mailbox + its app password.">Add mailbox</SectionTitle>
            <form action={addMailboxAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Address">
                <input name="address" type="email" required placeholder="sales@yourdomain.com" className="input" />
              </Field>
              <Field label="Display name">
                <input name="displayName" placeholder="Sales Team" className="input" />
              </Field>
              <Field label="SMTP host">
                <input name="smtpHost" placeholder="smtp.gmail.com" className="input" />
              </Field>
              <Field label="SMTP port">
                <input name="smtpPort" defaultValue="587" className="input" />
              </Field>
              <Field label="SMTP user">
                <input name="smtpUser" placeholder="sales@yourdomain.com" className="input" />
              </Field>
              <Field label="SMTP password">
                <input name="smtpPassword" type="password" placeholder="app password" className="input" />
              </Field>
              <Field label="Daily cap">
                <input name="dailyCap" type="number" min={1} defaultValue={50} className="input" />
              </Field>
              <div className="flex items-end">
                <button className="btn btn-primary">Add mailbox</button>
              </div>
            </form>
          </div>

          {/* Import from Zapmail */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <form action={importZapmailAction}>
              <button className="btn btn-ghost">Import from Zapmail</button>
            </form>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              {zapConfigured
                ? "Pulls mailboxes from your Zapmail account (add each mailbox's app password to activate)."
                : "Add your Zapmail API key in Settings below to enable import."}
            </span>
          </div>
        </Card>

        {/* 3. Send test */}
        <Card>
          <SectionTitle>Send test</SectionTitle>
          <form action={sendTestEmailAction} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[260px] flex-1">
              <Field label="To">
                <input name="to" type="email" required placeholder="you@example.com" className="input" />
              </Field>
            </div>
            <button className="btn btn-primary">Send test</button>
          </form>
        </Card>

        {/* 4. Settings */}
        <Card>
          <SectionTitle>Settings</SectionTitle>
          <form action={saveEmailSettingsAction} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Zapmail API key">
                <input name="zapmailApiKey" type="password" placeholder="•••• leave blank to keep" className="input" />
              </Field>
              <Field label="Zapmail workspace key">
                <input name="zapmailWorkspaceKey" defaultValue={settings.zapmailWorkspaceKey ?? ""} className="input" />
              </Field>
            </div>
            <Field label="Booking URL" hint="Used in auto-replies & password emails">
              <input name="bookingUrl" defaultValue={settings.bookingUrl ?? ""} placeholder="https://calendly.com/you" className="input" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input name="autoReplyEnabled" type="checkbox" defaultChecked={settings.autoReplyEnabled} />
              <span>Auto-reply to inbound replies</span>
            </label>
            <Field label="Auto-reply HTML" hint="Tokens: {{booking_link}} {{brand}}">
              <textarea
                className="input"
                name="autoReplyHtml"
                rows={6}
                defaultValue={settings.autoReplyHtml ?? DEFAULT_AUTO_REPLY}
              />
            </Field>
            <div>
              <button className="btn btn-primary">Save settings</button>
            </div>
          </form>
        </Card>

        {/* 5. Outbound log */}
        <Card>
          <SectionTitle>Outbound log</SectionTitle>
          <Table head={["To", "Subject", "Kind", "Status", "When"]}>
            {outbound.length === 0 ? (
              <Tr>
                <Td><span style={{ color: "var(--muted)" }}>No sends yet.</span></Td>
                <Td>{""}</Td>
                <Td>{""}</Td>
                <Td>{""}</Td>
                <Td>{""}</Td>
              </Tr>
            ) : (
              outbound.map((o) => (
                <Tr key={o.id}>
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

        {/* 6. Inbound & auto-replies */}
        <Card>
          <SectionTitle>Inbound & auto-replies</SectionTitle>
          {inbound.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Inbound replies appear here. Point your mailbox forwarding at POST {base}/api/email/inbound/{tenantId}.
            </p>
          ) : (
            <Table head={["From", "Subject", "Auto-replied", "When"]}>
              {inbound.map((i) => (
                <Tr key={i.id}>
                  <Td>{i.fromAddr}</Td>
                  <Td>{i.subject ?? "—"}</Td>
                  <Td>
                    <Badge tone={i.autoReplied ? "pos" : "neutral"}>{i.autoReplied ? "Yes" : "No"}</Badge>
                  </Td>
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
