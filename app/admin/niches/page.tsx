import { asc } from "drizzle-orm";
import { requireAuth } from "@/src/auth/guard";
import { db } from "@/src/db/client";
import { tenants } from "@/src/db/schema";
import { PageHeader, Card, SectionTitle, Badge, Table, Tr, Td } from "@/app/_ui/primitives";
import { toggleNicheAction } from "./actions";

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function NichesAdminPage() {
  await requireAuth(["god"]);
  const rows = await db.select().from(tenants).orderBy(asc(tenants.domain));
  const list = rows.filter((t) => t.domain.replace(/^www\./, "") !== "r0cketship.com");
  const shown = list.filter((t) => t.showOnNiches).length;

  return (
    <>
      <PageHeader
        title="Niches"
        subtitle="Choose which white-labels appear on the r0cketship.com directory. The site stays live either way."
      />

      <Card pad={false}>
        <div className="px-5 pt-5">
          <SectionTitle hint={`${shown} of ${list.length} shown`}>Listed on /niches</SectionTitle>
        </div>
        <Table head={["Title", "Niche", "Domain", "On /niches", "Actions"]}>
          {list.map((t) => (
            <Tr key={t.id}>
              <Td>
                <div className="font-medium">{titleCase(t.moneyWord)}</div>
                {t.heroHeadline && <div className="text-xs" style={{ color: "var(--muted-2)" }}>{t.heroHeadline}</div>}
              </Td>
              <Td><span className="text-sm" style={{ color: "var(--muted)" }}>{t.niche}</span></Td>
              <Td>
                <a href={`https://${t.domain}`} target="_blank" rel="noreferrer" className="text-sm" style={{ color: "var(--color-accent)" }}>{t.domain} ↗</a>
              </Td>
              <Td>
                <Badge tone={t.showOnNiches ? "pos" : "neutral"}>{t.showOnNiches ? "Showing" : "Hidden"}</Badge>
              </Td>
              <Td>
                <div className="flex justify-end items-center" style={{ gap: 6 }}>
                  <form action={toggleNicheAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="show" value={(!t.showOnNiches).toString()} />
                    <button className={`btn ${t.showOnNiches ? "btn-ghost" : "btn-primary"}`} style={{ padding: "6px 10px" }}>
                      {t.showOnNiches ? "Turn off" : "Turn on"}
                    </button>
                  </form>
                  <a className="btn btn-ghost" href={`/admin/tenants/${t.id}`} style={{ padding: "6px 10px" }}>Manage</a>
                  <a className="btn btn-primary" href={`/admin/open-as/${t.id}`} style={{ padding: "6px 10px" }}>Open as ↗</a>
                </div>
              </Td>
            </Tr>
          ))}
          {list.length === 0 && (
            <tr className="border-t" style={{ borderColor: "var(--line)" }}>
              <td colSpan={5} className="px-4 py-3" style={{ color: "var(--muted)" }}>No white-labels yet.</td>
            </tr>
          )}
        </Table>
      </Card>
    </>
  );
}
