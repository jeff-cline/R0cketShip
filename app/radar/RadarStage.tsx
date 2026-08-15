"use client";

/** Command-central visual: a rocket rising through a rotating radar ring. */
export default function RadarStage({ size = 340 }: { size?: number }) {
  return (
    <div style={{ position: "relative", width: size, height: size, maxWidth: "100%", margin: "0 auto" }}>
      <style>{`
        @keyframes rsSweep{to{transform:rotate(360deg)}}
        @keyframes rsBlip{0%,100%{opacity:.15}50%{opacity:1}}
        @keyframes rsRocket{0%{transform:translate(-50%,8%)}50%{transform:translate(-50%,-6%)}100%{transform:translate(-50%,8%)}}
      `}</style>
      <svg viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <defs>
          <radialGradient id="rsGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F5821F" stopOpacity="0.22" /><stop offset="70%" stopColor="#F5821F" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="rsSweepG" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3ecf8e" stopOpacity="0" /><stop offset="100%" stopColor="#3ecf8e" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="49" fill="url(#rsGlow)" />
        {[13, 25, 37, 48].map((r) => <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="#2a2c34" strokeWidth="0.4" />)}
        <line x1="2" y1="50" x2="98" y2="50" stroke="#26282f" strokeWidth="0.3" />
        <line x1="50" y1="2" x2="50" y2="98" stroke="#26282f" strokeWidth="0.3" />
        <g style={{ transformOrigin: "50px 50px", animation: "rsSweep 4.5s linear infinite" }}>
          <path d="M50 50 L50 2 A48 48 0 0 1 91 27 Z" fill="url(#rsSweepG)" />
          <line x1="50" y1="50" x2="50" y2="2" stroke="#3ecf8e" strokeWidth="0.5" />
        </g>
        {[[70, 30], [31, 41], [64, 69], [39, 24], [76, 58]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.1" fill="#3ecf8e" style={{ animation: `rsBlip 3s ease-in-out ${i * 0.55}s infinite` }} />
        ))}
      </svg>
      <div style={{ position: "absolute", left: "50%", bottom: "8%", transform: "translate(-50%,8%)", fontSize: size * 0.17, animation: "rsRocket 3.4s ease-in-out infinite", filter: "drop-shadow(0 12px 26px rgba(245,130,31,.55))" }}>🚀</div>
    </div>
  );
}
