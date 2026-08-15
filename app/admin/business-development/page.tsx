import Link from "next/link";
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { users } from "@/src/db/schema";
import { listBdPartners } from "@/src/bd/partners";
import { listInvestorLeads } from "@/src/bd/leads";
import { getPlatformSettings } from "@/src/referral/core";
import { setFeeAction } from "./actions";

export const dynamic = "force-dynamic";

const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em", borderBottom: "1px solid var(--line)" };
const td: React.CSSProperties = { padding: "9px 10px", fontSize: 14, color: "var(--ink)", borderBottom: "1px solid var(--line)" };

export default async function Page() {
  await requireAuth(["god"]);
  const partners = await listBdPartners();
  const leads = await listInvestorLeads();
  const ps = await getPlatformSettings();
  const emailRows = await db.select({ id: users.id, email: users.email }).from(users);
  const emailById = new Map(emailRows.map((r) => [r.id, r.email]));
  const partnerNameByUser = new Map(partners.map((p) => [p.userId, `${p.firstName} ${p.lastName}`]));
  const leadCountBy = new Map<string, number>();
  for (const l of leads) if (l.referredByUserId) leadCountBy.set(l.referredByUserId, (leadCountBy.get(l.referredByUserId) || 0) + 1);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)" }}>Business Development</h1>
          <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 4 }}>Partners recruit clients (product sales) and investors (opportunity). The hand-out link is <b style={{ color: "var(--ink)" }}>r0cketship.com/radar</b>.</p>
        </div>
        <form action={setFeeAction} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ color: "var(--muted)", fontSize: 13 }}>Investor referral fee $</label>
          <input name="amount" defaultValue={String(ps.investorReferralFee)} style={{ width: 90, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)" }} />
          <button className="btn btn-ghost" style={{ padding: "8px 14px" }}>Save</button>
        </form>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", margin: "26px 0 8px" }}>Partners ({partners.length})</h2>
      <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
          <thead><tr><th style={th}>Name</th><th style={th}>Email</th><th style={th}>Track</th><th style={th}>Tier</th><th style={th}>Investor refs</th><th style={th}>1099</th><th style={th}>Video</th><th style={th}>Joined</th></tr></thead>
          <tbody>
            {partners.length === 0 && <tr><td style={td} colSpan={8}>No partners yet.</td></tr>}
            {partners.map((p) => (
              <tr key={p.id}>
                <td style={td}><Link href={`/admin/business-development/${p.userId}`} style={{ color: "#F5821F", fontWeight: 700, textDecoration: "none" }}>{p.firstName} {p.lastName}</Link></td>
                <td style={td}>{emailById.get(p.userId) ?? "—"}</td>
                <td style={td}>{p.track}</td>
                <td style={td}>{p.tier === "vp" ? "VP" : "Manager"}</td>
                <td style={td}>{leadCountBy.get(p.userId) ?? 0}</td>
                <td style={td}>{p.form1099Url ? "✓" : "—"}</td>
                <td style={td}>{p.videoWatchedAt ? "✓" : "—"}</td>
                <td style={td}>{p.createdAt.toLocaleDateString("en-US")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", margin: "26px 0 8px" }}>Investor leads ({leads.length})</h2>
      <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
          <thead><tr><th style={th}>Name</th><th style={th}>Email</th><th style={th}>Phone</th><th style={th}>Type</th><th style={th}>Referred by</th><th style={th}>When</th></tr></thead>
          <tbody>
            {leads.length === 0 && <tr><td style={td} colSpan={6}>No investor leads yet.</td></tr>}
            {leads.map((l) => (
              <tr key={l.id}>
                <td style={td}>{`${l.firstName ?? ""} ${l.lastName ?? ""}`.trim() || "—"}</td>
                <td style={td}>{l.email ?? "—"}</td>
                <td style={td}>{l.phone ?? "—"}</td>
                <td style={td}>{l.investorType ?? "—"}</td>
                <td style={td}>{l.referredByUserId ? <Link href={`/admin/business-development/${l.referredByUserId}`} style={{ color: "#3ecf8e", textDecoration: "none", fontWeight: 700 }}>{partnerNameByUser.get(l.referredByUserId) ?? "partner"}</Link> : <span style={{ color: "var(--muted)" }}>organic</span>}</td>
                <td style={td}>{l.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
