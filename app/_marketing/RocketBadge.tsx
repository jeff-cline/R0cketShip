export function RocketBadge() {
  return (
    <a
      href="https://r0cketship.com"
      target="_blank"
      rel="noopener noreferrer"
      title="Powered by R0cketShip"
      aria-label="Powered by R0cketShip"
      className="fixed bottom-4 right-4 z-50 transition-transform hover:scale-110 hover:-rotate-6"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/rocket.png" alt="R0cketShip" width={46} height={46} style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,.28))" }} />
    </a>
  );
}
