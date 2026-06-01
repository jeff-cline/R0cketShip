import { requireAuth } from "@/src/auth/guard";
import { NAMED_PRESETS } from "@/src/tenant/manage";
import { ThemeEditor } from "@/app/admin/ThemeEditor";
import { PageHeader, Card, SectionTitle, Field } from "@/app/_ui/primitives";
import UploadField from "./UploadField";
import { saveBrandingAction } from "./actions";

export default async function BrandingPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const ctx = await requireAuth(["god", "manager"]);
  const t = ctx.tenant;
  const sp = await searchParams;

  return (
    <div>
      <PageHeader title="Your site" subtitle={`Branding & hero for ${t.domain}`} />

      {sp?.saved && (
        <Card className="mb-4">
          <span className="text-sm font-semibold" style={{ color: "var(--pos)" }}>
            Saved. Your site branding has been updated.
          </span>
        </Card>
      )}

      <form action={saveBrandingAction} className="flex flex-col gap-4">
        <Card>
          <SectionTitle>Hero</SectionTitle>
          <div className="flex flex-col gap-4">
            <UploadField
              name="heroImage"
              label="Hero image"
              accept="image/*"
              kind="image"
              defaultValue={t.heroImage ?? ""}
            />
            <UploadField
              name="heroVideo"
              label="Hero video (mp4, optional — autoplays muted)"
              accept="video/mp4"
              kind="video"
              defaultValue={t.heroVideo ?? ""}
            />
            <Field label="Headline">
              <input className="input" name="heroHeadline" defaultValue={t.heroHeadline ?? ""} />
            </Field>
            <Field label="Subhead">
              <textarea className="input" name="heroSubhead" defaultValue={t.heroSubhead ?? ""} />
            </Field>
          </div>
        </Card>

        <Card>
          <SectionTitle>Logo</SectionTitle>
          <UploadField
            name="logoUrl"
            label="Logo"
            accept="image/*"
            kind="image"
            defaultValue={t.logoUrl ?? ""}
          />
        </Card>

        <Card>
          <SectionTitle>Colors</SectionTitle>
          <ThemeEditor theme={t.theme} style={t.style} presets={NAMED_PRESETS} />
        </Card>

        <div>
          <button className="btn btn-primary">Save site</button>
        </div>
      </form>
    </div>
  );
}
