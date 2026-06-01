"use client";
import { useActionState } from "react";
import { launchAction } from "./actions";
import { ThemeEditor } from "@/app/admin/ThemeEditor";
import type { TenantTheme } from "@/src/tenant/types";

export function LaunchForm({ presets }: { presets: { name: string; theme: TenantTheme }[] }) {
  const [state, action, pending] = useActionState(launchAction, {});
  return (
    <form action={action} className="mt-4 grid grid-cols-2 gap-2 text-sm">
      <input name="domain" placeholder="domain (e.g. solarpros.co)" required className="rounded border p-2" />
      <input name="niche" placeholder="niche (e.g. solar)" required className="rounded border p-2" />
      <input name="moneyWord" placeholder="money word (e.g. solar leads)" required className="col-span-2 rounded border p-2" />
      <input name="monthlyPriceDefault" placeholder="monthly price per ZIP (default 1500)" className="col-span-2 rounded border p-2" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="col-span-2 grid grid-cols-3 gap-2">
          <input name={`o${i}t`} placeholder={`offer ${i} title`} className="rounded border p-2" />
          <input name={`o${i}d`} placeholder="description" className="rounded border p-2" />
          <input name={`o${i}p`} placeholder="price" className="rounded border p-2" />
        </div>
      ))}
      <ThemeEditor theme={presets[0].theme} style="bold" presets={presets} />
      {state?.error && <p className="col-span-2 text-sm text-red-600">{state.error}</p>}
      <button disabled={pending} className="col-span-2 mt-2 rounded bg-black px-4 py-2 text-white">{pending ? "Launching…" : "Launch white-label"}</button>
    </form>
  );
}
