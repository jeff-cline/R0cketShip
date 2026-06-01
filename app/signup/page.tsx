import { SignupForm } from "./SignupForm";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm opacity-70">Get $50 in leads free — no card required.</p>
      <SignupForm refCode={ref ?? ""} />
      <p className="mt-4 text-sm opacity-70">Already have an account? <a href="/login" className="underline">Sign in</a></p>
    </main>
  );
}
