// Tiny rocket glyph used as nav bullets and brand mark.
export function Rocket({ size = 12, className = "", color = "currentColor" }: { size?: number; className?: string; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 15c-1.2 1-2 3.5-2 4 .5 0 3-.8 4-2M14.5 4.5C17 2 21 2.5 21.5 2.5c0 .5.5 4.5-2 7l-7 7-5-5 7-7z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="15" cy="9" r="1.6" fill={color} />
    </svg>
  );
}
