import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { tenants, leads } from "@/src/db/schema";
import { browseLeads } from "@/src/leads/browse";
import { PageHeader, Card, Badge } from "@/app/_ui/primitives";

type LeadRow = typeof leads.$inferSelect;

type SP = {
  tenant?: string;
  q?: string;
  segment?: string;
  sort?: string;
  dir?: string;
  page?: string;
};

const SORTABLE = new Set(["name", "city", "zip", "score", "segment", "company", "updated"]);

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toISOString().slice(0, 10);
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const ctx = await requireAuth(["god", "manager"]);
  const isGod = ctx.user.role === "god";
  const sp = await searchParams;

  // Tenant resolution.
  let allTenants: { id: string; domain: string }[] = [];
  let tenantId: string;
  if (isGod) {
    allTenants = await db
      .select({ id: tenants.id, domain: tenants.domain })
      .from(tenants)
      .orderBy(tenants.domain);
    tenantId = sp.tenant ?? allTenants[0]?.id ?? ctx.user.tenantId;
  } else {
    tenantId = ctx.user.tenantId;
  }

  const selectedDomain = allTenants.find((t) => t.id === tenantId)?.domain;

  const data = await browseLeads(tenantId, {
    q: sp.q,
    segment: (sp.segment as "residential" | "commercial" | "") || "",
    sort: sp.sort,
    dir: sp.dir === "asc" ? "asc" : "desc",
    page: Number(sp.page) || 1,
  });

  const activeSort = sp.sort && SORTABLE.has(sp.sort) ? sp.sort : "updated";
  const activeDir = sp.dir === "asc" ? "asc" : "desc";

  // Merge current params with overrides so links preserve search/segment/
  // tenant/sort/page state. Never interpolates raw values into SQL — this is
  // purely URL building.
  function qs(overrides: Partial<Record<string, string | number | undefined>>): string {
    const base: Record<string, string | undefined> = {
      ...(isGod ? { tenant: tenantId } : {}),
      q: sp.q,
      segment: sp.segment,
      sort: sp.sort,
      dir: sp.dir,
      page: sp.page,
    };
    const merged = { ...base, ...overrides };
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) {
      if (v === undefined || v === null || v === "") continue;
      usp.set(k, String(v));
    }
    const s = usp.toString();
    return s ? `/admin/leads?${s}` : "/admin/leads";
  }

  // Toggle dir when the column is already active, else default ascending;
  // reset to page 1 on any sort change.
  function sortHref(key: string): string {
    const nextDir = activeSort === key && activeDir === "asc" ? "desc" : "asc";
    return qs({ sort: key, dir: nextDir, page: "1" });
  }
  function sortArrow(key: string): string {
    if (activeSort !== key) return "";
    return activeDir === "asc" ? " ▲" : " ▼";
  }

  const columns: { label: string; key: string | null }[] = [
    { label: "Name", key: "name" },
    { label: "Email", key: null },
    { label: "Phone", key: null },
    { label: "City/State", key: "city" },
    { label: "ZIP", key: "zip" },
    { label: "Segment", key: "segment" },
    { label: "Score", key: "score" },
    { label: "Company", key: "company" },
    { label: "Freshness", key: "updated" },
    { label: "All data", key: null },
  ];

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle={`${data.total.toLocaleString()} leads${
          isGod && selectedDomain ? ` — ${selectedDomain}` : ""
        }`}
      />

      <Card className="mb-6">
        <form className="flex flex-wrap items-end gap-2">
          {isGod && (
            <label className="flex flex-col gap-1.5">
              <span className="label">White-label</span>
              <select className="input" name="tenant" defaultValue={tenantId}>
                {allTenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.domain}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex flex-1 flex-col gap-1.5" style={{ minWidth: 220 }}>
            <span className="label">Search</span>
            <input
              className="input"
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Search name, email, phone, ZIP, company…"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="label">Segment</span>
            <select className="input" name="segment" defaultValue={sp.segment ?? ""}>
              <option value="">All</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
            </select>
          </label>
          {/* Preserve current sort/dir across a new search. */}
          {sp.sort && <input type="hidden" name="sort" value={sp.sort} />}
          {sp.dir && <input type="hidden" name="dir" value={sp.dir} />}
          <button className="btn btn-primary" type="submit">
            Search
          </button>
          <a className="btn btn-ghost" href="/admin/leads">
            Reset
          </a>
        </form>
      </Card>

      {data.total === 0 ? (
        <Card>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No leads yet — upload a file under Data.{" "}
            {isGod && (
              <a href="/admin/data" style={{ color: "var(--color-accent)" }}>
                Go to Data →
              </a>
            )}
          </p>
        </Card>
      ) : (
        <>
          <div
            className="overflow-x-auto rounded-[var(--radius-lg)] border"
            style={{ borderColor: "var(--line)" }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--surface-2)" }}>
                  {columns.map((c, i) => (
                    <th
                      key={i}
                      className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--muted)" }}
                    >
                      {c.key ? (
                        <a href={sortHref(c.key)} style={{ color: "var(--ink)" }}>
                          {c.label}
                          {sortArrow(c.key)}
                        </a>
                      ) : (
                        c.label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => {
                  const seg = r.segment;
                  const email = r.businessEmail || r.emails[0] || "";
                  const phone = r.mobilePhones[0] || r.personalPhones[0] || "";
                  const name =
                    [r.firstName, r.lastName].filter(Boolean).join(" ") || "—";
                  return (
                    <tr key={r.id} className="border-t" style={{ borderColor: "var(--line)" }}>
                      <td className="px-4 py-3 align-top">{name}</td>
                      <td className="px-4 py-3 align-top">{email || "—"}</td>
                      <td className="px-4 py-3 align-top">{phone || "—"}</td>
                      <td className="px-4 py-3 align-top">
                        {[r.city, r.state].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3 align-top">{r.zip || "—"}</td>
                      <td className="px-4 py-3 align-top">
                        <Badge tone={seg === "commercial" ? "accent" : "neutral"}>{seg}</Badge>
                      </td>
                      <td className="px-4 py-3 align-top">{r.scoreCategory || "—"}</td>
                      <td className="px-4 py-3 align-top">{r.companyName || "—"}</td>
                      <td className="px-4 py-3 align-top">{fmtDate(r.lastUpdated)}</td>
                      <td className="px-4 py-3 align-top">
                        <RowDetails row={r} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span style={{ color: "var(--muted)" }}>
              Page {data.page} of {data.pages}
            </span>
            <div className="flex gap-2">
              {data.page > 1 ? (
                <a className="btn btn-ghost" href={qs({ page: data.page - 1 })}>
                  ← Prev
                </a>
              ) : (
                <span className="btn btn-ghost" style={{ opacity: 0.4, pointerEvents: "none" }}>
                  ← Prev
                </span>
              )}
              {data.page < data.pages ? (
                <a className="btn btn-ghost" href={qs({ page: data.page + 1 })}>
                  Next →
                </a>
              ) : (
                <span className="btn btn-ghost" style={{ opacity: 0.4, pointerEvents: "none" }}>
                  Next →
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

// Full visibility: dumps every non-empty field of the row, including each
// key/value pair in the `extra` jsonb, as a definition list.
function RowDetails({ row }: { row: LeadRow }) {
  const entries: [string, string][] = [];
  const push = (label: string, value: unknown) => {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      if (value.length === 0) return;
      entries.push([label, value.join(", ")]);
      return;
    }
    if (value instanceof Date) {
      entries.push([label, value.toISOString()]);
      return;
    }
    const s = String(value);
    if (s === "") return;
    entries.push([label, s]);
  };

  push("First name", row.firstName);
  push("Last name", row.lastName);
  push("Business email", row.businessEmail);
  push("Emails", row.emails);
  push("Personal phones", row.personalPhones);
  push("Mobile phones", row.mobilePhones);
  push("LinkedIn", row.linkedinUrl);
  push("Address", row.address);
  push("City", row.city);
  push("State", row.state);
  push("ZIP", row.zip);
  push("ZIP4", row.zip4);
  push("Gender", row.gender);
  push("Age range", row.ageRange);
  push("Income range", row.incomeRange);
  push("Net worth", row.netWorth);
  push("Job title", row.jobTitle);
  push("Department", row.department);
  push("Company name", row.companyName);
  push("Company domain", row.companyDomain);
  push("Company revenue", row.companyRevenue);
  push("Company employees", row.companyEmployeeCount);
  push("Company state", row.companyState);
  push("Company LinkedIn", row.companyLinkedinUrl);
  push("Business email status", row.businessEmailValidationStatus);
  push("Contact country", row.contactCountry);
  push("Score category", row.scoreCategory);
  push("Segment", row.segment);
  push("Last updated", row.lastUpdated);
  push("Source", row.source);
  push("Created", row.createdAt);
  push("Updated", row.updatedAt);
  push("SHA lc/hem", row.shaLcHem);

  const extra = (row.extra ?? {}) as Record<string, string>;
  for (const [k, v] of Object.entries(extra)) {
    push(`extra.${k}`, v);
  }

  return (
    <details>
      <summary
        className="cursor-pointer text-xs font-semibold"
        style={{ color: "var(--color-accent)" }}
      >
        View
      </summary>
      <dl
        className="mt-2 grid gap-x-4 gap-y-1 rounded-lg p-3 text-xs"
        style={{
          gridTemplateColumns: "auto 1fr",
          background: "var(--surface-2)",
          minWidth: 320,
        }}
      >
        {entries.map(([k, v]) => (
          <div key={k} className="contents">
            <dt style={{ color: "var(--muted)" }}>{k}</dt>
            <dd className="break-all">{v}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
