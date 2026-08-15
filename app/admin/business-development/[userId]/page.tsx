import Link from "next/link";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { users } from "@/src/db/schema";
import { getBdPartnerByUserId, getSalesCode, salesAffiliateLink, opportunityAffiliateLink, recruitLink, listDownline } from "@/src/bd/partners";
import { listInvestorLeadsForPartner, listFeesForPartner } from "@/src/bd/leads";
import { upgradeVpAction, voidFeeAction, sendPartnerEmailAction } from "../actions";

export const dynamic = "force-dynamic";

const card: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, padding: 16 };
const th: React.CSSProperties = { textAlign: "left", padding: "7px 9px", fontSize: 12, color: "var(--muted)", textTransform: "uppercase", borderBottom: "1px solid var(--line)" };
const td: React.CSSProperties = { padding: "8px 9px", fontSize: 13.5, color: "var(--ink)", borderBottom: "1px solid var(--line)" };
const inp: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--bg-app)", color: "var(--ink)", fontSize: 14 };

export default async function Page({ params }: { params: Promise<{ userId: string }> }) {
  await requireAuth(["god"]);
  const { userId } = await params;
  const p = await getBdPartnerByUserId(userId);
  if (!p) return <div style={{ color: "var(--ink)" }}>Partner not found. <Link href="/admin/business-development" style={{ color: "#F5821F" }}>Back</Link></div>;

  const u = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  const code = await getSalesCode(userId);
  const leads = await listInvestorLeadsForPartner(userId);
  const fees = await listFeesForPartner(userId);
  const downline = p.tier === "vp" ? await listDownline(userId) : [];
  const feeTotal = fees.filter((f) => f.status !== "void").reduce((s, f) => s + Number(f.amount), 0);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <Link href="/admin/business-development" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>← All partners</Link>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", marginTop: 6 }}>{p.firstName} {p.lastName} <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>· {p.tier === "vp" ? "Vice President" : "Business Development Manager"}</span></h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
        <div style={card}>
          <div style={{ fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>Contact</div>
          <div style={{ color: "var(--ink)", fontSize: 14, lineHeight: 1.8 }}>
            {u?.email ?? "—"}<br />
            {[p.city, p.state, p.zip].filter(Boolean).join(", ") || "—"}<br />
            <span style={{ color: "var(--muted)", fontSize: 12.5 }}>Track: {p.track} · Joined {p.createdAt.toLocaleDateString("en-US")}</span>
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "var(--ink)" }}>1099: {p.form1099Url ? <a href={p.form1099Url} target="_blank" style={{ color: "#3ecf8e" }}>view PDF</a> : <span style={{ color: "var(--muted)" }}>not uploaded</span>}</span>
            <span style={{ fontSize: 13, color: "var(--ink)" }}>Video: {p.videoWatchedAt ? "watched ✓" : "not yet"}</span>
          </div>
        </div>

        <div style={card}>
          <div style={{ fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>Tracking links</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Sales affiliate</div>
          <div style={{ fontSize: 13, color: "var(--ink)", wordBreak: "break-all" }}>{salesAffiliateLink(code)}</div>
          <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8 }}>Opportunity affiliate</div>
          <div style={{ fontSize: 13, color: "var(--ink)", wordBreak: "break-all" }}>{opportunityAffiliateLink(p.slug)}</div>
          {p.tier === "vp" && <><div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8 }}>Recruit link</div><div style={{ fontSize: 13, color: "var(--ink)", wordBreak: "break-all" }}>{recruitLink(p.slug)}</div></>}
          {p.tier !== "vp" && (
            <form action={upgradeVpAction} style={{ marginTop: 12 }}>
              <input type="hidden" name="userId" value={userId} />
              <button className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 13 }}>Upgrade to Vice President</button>
            </form>
          )}
        </div>
      </div>

      {p.tier === "vp" && (
        <div style={card}>
          <div style={{ fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>Downline ({downline.length})</div>
          {downline.length === 0 ? <div style={{ color: "var(--muted)", fontSize: 13.5 }}>No recruits yet.</div> : downline.map((d) => (
            <div key={d.id} style={{ padding: "6px 0", borderTop: "1px solid var(--line)" }}><Link href={`/admin/business-development/${d.userId}`} style={{ color: "#F5821F", textDecoration: "none" }}>{d.firstName} {d.lastName}</Link> <span style={{ color: "var(--muted)", fontSize: 12.5 }}>· {d.tier}</span></div>
          ))}
        </div>
      )}

      <div style={card}>
        <div style={{ fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>Investor referrals ({leads.length})</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
            <thead><tr><th style={th}>Name</th><th style={th}>Email</th><th style={th}>Phone</th><th style={th}>Type</th><th style={th}>When</th></tr></thead>
            <tbody>
              {leads.length === 0 && <tr><td style={td} colSpan={5}>None yet.</td></tr>}
              {leads.map((l) => (
                <tr key={l.id}><td style={td}>{`${l.firstName ?? ""} ${l.lastName ?? ""}`.trim() || "—"}</td><td style={td}>{l.email ?? "—"}</td><td style={td}>{l.phone ?? "—"}</td><td style={td}>{l.investorType ?? "—"}</td><td style={td}>{l.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={card}>
        <div style={{ fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>Referral fees · accrued ${feeTotal.toLocaleString()}</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 460 }}>
            <thead><tr><th style={th}>Amount</th><th style={th}>Status</th><th style={th}>When</th><th style={th}></th></tr></thead>
            <tbody>
              {fees.length === 0 && <tr><td style={td} colSpan={4}>No fees yet.</td></tr>}
              {fees.map((f) => (
                <tr key={f.id}>
                  <td style={td}>${Number(f.amount).toLocaleString()}</td>
                  <td style={td}>{f.status}</td>
                  <td style={td}>{f.createdAt.toLocaleDateString("en-US")}</td>
                  <td style={td}>{f.status !== "void" && <form action={voidFeeAction}><input type="hidden" name="feeId" value={f.id} /><input type="hidden" name="userId" value={userId} /><button style={{ background: "transparent", border: "1px solid var(--line)", color: "#ff6a4d", borderRadius: 7, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>Void</button></form>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={card}>
        <div style={{ fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>Email {p.firstName}</div>
        <form action={sendPartnerEmailAction} style={{ display: "grid", gap: 10 }}>
          <input type="hidden" name="userId" value={userId} />
          <input name="subject" placeholder="Subject" style={inp} required />
          <textarea name="body" placeholder="Message…" rows={4} style={{ ...inp, resize: "vertical", fontFamily: "inherit" }} required />
          <div><button className="btn btn-primary" style={{ padding: "9px 16px", fontSize: 14 }}>Send email</button></div>
        </form>
      </div>
    </div>
  );
}
