"use client";

import { useActionState, useState, type CSSProperties } from "react";
import { setupAction, loginAction, resetPasswordAction } from "./actions";
import { YellowSheet, BlackBand } from "./ui";

type Mode = "setup" | "login" | "reset";

export function YellowAuthScreen({ mode, name }: { mode: Mode; name?: string }) {
  const [view, setView] = useState<Mode>(mode);
  const action = view === "setup" ? setupAction : view === "reset" ? resetPasswordAction : loginAction;
  const [state, formAction, pending] = useActionState(action, {} as { error?: string });

  const title = view === "setup" ? "Set up your yellow pad" : view === "reset" ? "Set a new password" : "Log in";
  const sub =
    view === "setup" ? "First account — this becomes your admin login."
      : view === "reset" ? `Welcome, ${name}. Choose your own password to continue.`
      : "One login and it stays open on this device.";
  const cta = view === "setup" ? "Create pad →" : view === "reset" ? "Save password →" : "Log in →";

  return (
    <div style={{ minHeight: "100vh", background: "#111", display: "grid", placeItems: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <YellowSheet compact>
          <BlackBand right={view === "reset" ? name : undefined} />
          <div style={{ padding: "26px 30px 34px" }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 3px", color: "#1a1a1a" }}>{title}</h1>
            <p style={{ margin: "0 0 18px", fontSize: 13.5, color: "#4a4632" }}>{sub}</p>

            <form action={formAction} style={{ display: "grid", gap: 12 }}>
              {view === "setup" && (
                <>
                  <Field name="name" label="Your name" autoFocus />
                  <Field name="username" label="Username" />
                  <Field name="email" label="Email" type="email" />
                  <Field name="password" label="Password" type="password" />
                </>
              )}
              {view === "login" && (
                <>
                  <Field name="username" label="Username or email" autoFocus autoComplete="username" />
                  <Field name="password" label="Password" type="password" autoComplete="current-password" />
                </>
              )}
              {view === "reset" && <Field name="password" label="New password" type="password" autoFocus />}

              {state?.error && <div style={{ color: "#b3261e", fontSize: 13, fontWeight: 600 }}>{state.error}</div>}

              <button type="submit" disabled={pending}
                style={{ marginTop: 4, padding: "11px 18px", borderRadius: 10, border: 0, background: "#111",
                  color: "#ffe94d", fontWeight: 800, fontSize: 15, cursor: "pointer", opacity: pending ? 0.6 : 1 }}>
                {pending ? "…" : cta}
              </button>
            </form>

            {view !== "reset" && (
              <div style={{ marginTop: 16, fontSize: 13, color: "#4a4632" }}>
                {view === "login" ? (
                  mode === "setup" && (
                    <button onClick={() => setView("setup")} style={linkBtn}>← Set up a new pad</button>
                  )
                ) : (
                  <>Already have an account?{" "}
                    <button onClick={() => setView("login")} style={linkBtn}>Log in</button>
                  </>
                )}
              </div>
            )}
          </div>
        </YellowSheet>
      </div>
    </div>
  );
}

const linkBtn: CSSProperties = { background: "none", border: 0, color: "#111", fontWeight: 800, cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: 13 };

function Field({ name, label, type = "text", autoFocus, autoComplete }: {
  name: string; label: string; type?: string; autoFocus?: boolean; autoComplete?: string;
}) {
  return (
    <label style={{ display: "grid", gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, color: "#6b6647" }}>{label}</span>
      <input name={name} type={type} autoFocus={autoFocus} autoComplete={autoComplete} required
        style={{ padding: "10px 12px", borderRadius: 9, border: "1.5px solid #d9cf7a", background: "#fffdf0",
          fontSize: 15, color: "#1a1a1a", outline: "none" }} />
    </label>
  );
}
