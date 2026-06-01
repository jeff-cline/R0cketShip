"use client";
import { useState } from "react";
import type { TenantTheme } from "@/src/tenant/types";

const KEYS = ["primary", "secondary", "accent", "background", "foreground"] as const;

export function ThemeEditor({ theme, style, presets }: { theme: TenantTheme; style: string; presets: TenantTheme[] }) {
  const [colors, setColors] = useState({
    primary: theme.primary, secondary: theme.secondary, accent: theme.accent,
    background: theme.background, foreground: theme.foreground,
  });
  const applyPreset = (p: TenantTheme) =>
    setColors({ primary: p.primary, secondary: p.secondary, accent: p.accent, background: p.background, foreground: p.foreground });

  return (
    <div className="col-span-2 rounded-lg border p-3">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">Style template:</span>
        <select name="style" defaultValue={style} className="rounded border p-2">
          <option value="bold">Bold — modern SaaS</option>
          <option value="trust">Trust — authority</option>
          <option value="dark">Dark — premium</option>
        </select>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        {KEYS.map((k) => (
          <label key={k} className="flex flex-col items-center text-xs capitalize">
            {k}
            <input type="color" name={k} value={colors[k]} onChange={(e) => setColors((c) => ({ ...c, [k]: e.target.value }))} className="h-9 w-12 rounded border" />
          </label>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span>Quick palettes:</span>
        {presets.map((p, i) => (
          <button type="button" key={i} onClick={() => applyPreset(p)} title={`Preset ${i + 1}`} className="h-6 w-6 rounded-full border" style={{ background: p.accent }} />
        ))}
      </div>
    </div>
  );
}
