import type { Metadata } from "next";
import RoadmapClient from "./RoadmapClient";
export const metadata: Metadata = { title: "R0cketShip — Roadmap · Portfolio, Acquisitions & JV Pipeline", description: "The live network: portfolio companies, acquisition targets and joint-venture opportunities across dozens of industries." };
export default function Page() {
  return <div style={{ minHeight: "100vh", background: "radial-gradient(1200px 700px at 50% -10%, #1a1206, #0a0a0b)", color: "#f4f5f7", fontFamily: "var(--font-body),Inter,sans-serif" }}><RoadmapClient /></div>;
}
