"use client";
import { useEffect, useState } from "react";
export default function HubVideoButton() {
  const [show, setShow] = useState(false);
  const [path, setPath] = useState("");
  useEffect(() => { const h = location.hostname.replace(/^www\./, ""); setPath(location.pathname); setShow(h === "r0cketship.com"); }, []);
  if (!show || path === "/presentation") return null;
  return <a href="/presentation" aria-label="Watch the film" style={{ position: "fixed", right: 16, bottom: 16, zIndex: 60, display: "inline-flex", alignItems: "center", gap: 8, background: "#F5821F", color: "#000", fontWeight: 800, textDecoration: "none", borderRadius: 100, padding: "11px 18px", boxShadow: "0 8px 30px rgba(245,130,31,.4)", fontSize: 14 }}>▶ Watch the film</a>;
}
