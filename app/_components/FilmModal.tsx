"use client";
import { useEffect, useState } from "react";

const O = "#F5821F";

/* Fullscreen YouTube overlay reused by /deck and /launch. */
function Overlay({ videoId, onClose }: { videoId: string; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(5,6,8,.94)", display: "grid", placeItems: "center", padding: "min(6vw,60px)", backdropFilter: "blur(6px)" }}>
      <button onClick={onClose} aria-label="Close video" style={{ position: "absolute", top: 18, right: 22, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.2)", color: "#fff", borderRadius: 100, padding: "8px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>✕ Close</button>
      <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "min(94vw, 1360px)", aspectRatio: "16 / 9", boxShadow: "0 30px 120px rgba(245,130,31,.25)", borderRadius: 12, overflow: "hidden" }}>
        <iframe src={`https://www.youtube.com/embed/${videoId}?rel=0&autoplay=1&modestbranding=1`} title="R0cketShip film" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
      </div>
    </div>
  );
}

/* Big clickable poster with a play button. */
export function FilmThumb({ videoId, label = "Watch the film", maxWidth = 520 }: { videoId: string; label?: string; maxWidth?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} aria-label={label} style={{ position: "relative", display: "block", width: "100%", maxWidth, aspectRatio: "16 / 9", border: `1px solid ${O}55`, borderRadius: 16, overflow: "hidden", cursor: "pointer", padding: 0, background: `#000 center/cover no-repeat url(https://img.youtube.com/vi/${videoId}/hqdefault.jpg)`, boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>
        <span style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.5))" }} />
        <span style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 78, height: 78, borderRadius: "50%", background: O, display: "grid", placeItems: "center", boxShadow: "0 0 44px rgba(245,130,31,.6)" }}>
          <span style={{ marginLeft: 6, borderStyle: "solid", borderWidth: "15px 0 15px 26px", borderColor: "transparent transparent transparent #0a0a0b" }} />
        </span>
        <span style={{ position: "absolute", left: 16, bottom: 14, color: "#fff", fontWeight: 800, fontSize: 15, letterSpacing: ".02em", textShadow: "0 2px 8px rgba(0,0,0,.7)" }}>▶ {label}</span>
      </button>
      {open && <Overlay videoId={videoId} onClose={() => setOpen(false)} />}
    </>
  );
}

/* Plain button that opens the same fullscreen film. */
export function FilmTextButton({ videoId, label = "▶ Watch the film", style }: { videoId: string; label?: string; style?: React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} style={style}>{label}</button>
      {open && <Overlay videoId={videoId} onClose={() => setOpen(false)} />}
    </>
  );
}
