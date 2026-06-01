import nodemailer from "nodemailer";
import { getIntegrations } from "../integrations/store";

export interface SmtpConfig { host: string; port: number; user: string; pass: string; from: string }

export async function resolveSmtp(tenantId: string): Promise<SmtpConfig | null> {
  const i = await getIntegrations(tenantId);
  if (!i.smtpHost || !i.smtpFrom) return null;
  return { host: i.smtpHost, port: Number(i.smtpPort ?? 587), user: i.smtpUser ?? "", pass: i.smtpPass ?? "", from: i.smtpFrom };
}

export async function sendEmail(cfg: SmtpConfig | null, msg: { to: string; subject: string; html: string }): Promise<"sent" | "skipped" | "failed"> {
  if (!cfg) return "skipped";
  try {
    const transport = nodemailer.createTransport({
      host: cfg.host, port: cfg.port, secure: cfg.port === 465,
      auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
    });
    await transport.sendMail({ from: cfg.from, to: msg.to, subject: msg.subject, html: msg.html });
    return "sent";
  } catch {
    return "failed";
  }
}
