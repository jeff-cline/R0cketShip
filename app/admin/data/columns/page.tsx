import { requireAuth } from "@/src/auth/guard";
import { PageHeader, Card, SectionTitle, Table, Tr, Td, Badge } from "@/app/_ui/primitives";
import { listCustomColumns } from "@/src/leads/custom_columns";
import { KNOWN_COLUMNS } from "@/src/leads/normalize";
import { addCustomColumnAction, deleteCustomColumnAction } from "./actions";

export const dynamic = "force-dynamic";

interface SP {
  ok?: string;
  err?: string;
}

export default async function CustomColumnsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  await requireAuth(["god"]);
  const sp = await searchParams;
  const custom = await listCustomColumns();

  return (
    <>
      <PageHeader
        title="Lead columns"
        subtitle="Built-in canonical columns ship with the platform. Add custom keys here when new data sources arrive — the import preview will then recognize them and the values flow into leads.extra."
      />

      {sp?.ok && (
        <div className="mb-3">
          <Card>
            <div className="flex items-center gap-2 text-sm">
              <Badge tone="pos">Saved</Badge>
              <span>Column added.</span>
            </div>
          </Card>
        </div>
      )}
      {sp?.err && (
        <div className="mb-3">
          <Card>
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--neg)" }}>
              <Badge tone="neg">Error</Badge>
              <span>{sp.err}</span>
            </div>
          </Card>
        </div>
      )}

      <Card className="mb-6">
        <SectionTitle hint="Will be unioned with the built-in list">Add a custom column</SectionTitle>
        <form action={addCustomColumnAction} className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              Key (CSV header)
            </span>
            <input
              required
              name="key"
              className="input"
              placeholder="opt_in_source"
              pattern="[a-zA-Z0-9_ -]+"
              title="Lowercased, snake_case. We'll normalize the input."
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              Label (UI)
            </span>
            <input required name="label" className="input" placeholder="Opt-in Source" />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              Kind
            </span>
            <select name="kind" defaultValue="string" className="input">
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="date">date</option>
              <option value="boolean">boolean</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
              Description (optional)
            </span>
            <input
              name="description"
              className="input"
              placeholder="Where this came from / what it represents"
            />
          </label>
          <div className="md:col-span-4">
            <button className="btn btn-primary">Add column</button>
          </div>
        </form>
      </Card>

      <Card className="mb-6" pad={false}>
        <div className="px-5 pt-5">
          <SectionTitle hint={`${custom.length} custom`}>Custom columns</SectionTitle>
        </div>
        <Table head={["Key", "Label", "Kind", "Description", ""]}>
          {custom.length === 0 ? (
            <tr className="border-t" style={{ borderColor: "var(--line)" }}>
              <td colSpan={5} className="px-4 py-3" style={{ color: "var(--muted)" }}>
                No custom columns yet. Add one above when your next data source ships a new field.
              </td>
            </tr>
          ) : (
            custom.map((c) => (
              <Tr key={c.id}>
                <Td>
                  <code className="rounded px-1.5 py-0.5" style={{ background: "rgba(0,0,0,0.06)" }}>
                    {c.key}
                  </code>
                </Td>
                <Td>{c.label}</Td>
                <Td>
                  <Badge tone="neutral">{c.kind}</Badge>
                </Td>
                <Td>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {c.description ?? "—"}
                  </span>
                </Td>
                <Td>
                  <form action={deleteCustomColumnAction} className="flex justify-end">
                    <input type="hidden" name="id" value={c.id} />
                    <button className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }}>
                      Delete
                    </button>
                  </form>
                </Td>
              </Tr>
            ))
          )}
        </Table>
      </Card>

      <Card pad={false}>
        <div className="px-5 pt-5">
          <SectionTitle hint={`${KNOWN_COLUMNS.length} built-in`}>Built-in canonical columns</SectionTitle>
        </div>
        <div className="flex flex-wrap gap-1.5 px-5 pb-5 text-xs">
          {KNOWN_COLUMNS.map((k) => (
            <code
              key={k}
              className="rounded px-1.5 py-1"
              style={{
                background: "color-mix(in srgb, var(--pos) 12%, transparent)",
                color: "var(--pos)",
              }}
            >
              {k}
            </code>
          ))}
        </div>
      </Card>
    </>
  );
}
