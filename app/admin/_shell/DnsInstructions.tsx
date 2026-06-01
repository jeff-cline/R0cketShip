import { Card, SectionTitle } from "@/app/_ui/primitives";

const IP = "137.220.56.129";

export function DnsInstructions({ domain }: { domain: string }) {
  return (
    <Card>
      <SectionTitle>Point your domain → go live</SectionTitle>
      <ol className="space-y-3 text-sm">
        <li>
          1. At your domain registrar / DNS, create an <strong>A record</strong> for{" "}
          <code className="rounded bg-[var(--surface-3)] px-2 py-1 text-sm">@</code> →{" "}
          <code className="rounded bg-[var(--surface-3)] px-2 py-1 text-sm">{IP}</code>.
        </li>
        <li>
          2. Create an <strong>A record</strong> for{" "}
          <code className="rounded bg-[var(--surface-3)] px-2 py-1 text-sm">www</code> →{" "}
          <code className="rounded bg-[var(--surface-3)] px-2 py-1 text-sm">{IP}</code>.
        </li>
        <li>3. Wait for DNS to propagate (a few minutes–1 hour).</li>
        <li>
          4. Tell us the domain is pointed; we issue HTTPS (Let&apos;s Encrypt) and the site goes
          live at{" "}
          <code className="rounded bg-[var(--surface-3)] px-2 py-1 text-sm">https://{domain}</code>.
        </li>
      </ol>
      <p className="mt-4 text-xs" style={{ color: "var(--muted)" }}>
        Each white-label runs on the r0cketship backend but on its own domain and branding.
      </p>
    </Card>
  );
}
