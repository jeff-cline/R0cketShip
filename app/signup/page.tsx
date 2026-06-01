import { SignupForm } from "./SignupForm";
import { Card, Badge } from "@/app/_ui/primitives";
import { Rocket } from "@/app/_ui/Rocket";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16" style={{ background: "var(--bg-app)" }}>
      <Card pad className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: "var(--color-accent)" }}>
            <Rocket size={16} color="#fff" />
          </span>
          <h1 className="text-xl font-extrabold">Create your account</h1>
        </div>
        <div className="mb-5">
          <Badge tone="accent">$50 free credit</Badge>
          <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>Get $50 in leads free — no card required.</p>
        </div>
        <SignupForm refCode={ref ?? ""} />
        <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
          Already have an account?{" "}
          <a href="/login" className="font-semibold" style={{ color: "var(--color-accent)" }}>Sign in</a>
        </p>
      </Card>
    </div>
  );
}
