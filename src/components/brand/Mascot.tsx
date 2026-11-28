/**
 * The mascot: a round, friendly pawn wearing a turquoise desert scarf.
 * Original drawing, colored from the theme tokens. Shown next to the path and the coach bubble.
 */
export function Mascot({ size = 56, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={(size * 72) / 64} viewBox="0 0 64 72" className={className} aria-hidden="true">
      <ellipse cx="32" cy="67" rx="21" ry="3.6" fill="var(--overlay)" opacity="0.5" />
      <path d="M17 60 C17 50 22.5 44.5 26.5 40.5 H37.5 C41.5 44.5 47 50 47 60 Z" fill="var(--accent)" />
      <rect x="11.5" y="56.5" width="41" height="9.5" rx="4.75" fill="var(--accent-edge)" />
      <path d="M40 38 C46 39 50.5 43 52 48.5 C47.5 46.5 44 46 40.5 46.5 Z" fill="var(--info)" />
      <rect x="20" y="35.5" width="24" height="7.5" rx="3.75" fill="var(--info)" />
      <circle cx="32" cy="21.5" r="15" fill="var(--accent)" />
      <circle cx="24" cy="25.5" r="2.6" fill="var(--accent-edge)" opacity="0.35" />
      <circle cx="40" cy="25.5" r="2.6" fill="var(--accent-edge)" opacity="0.35" />
      <circle cx="26.6" cy="20.5" r="2.4" fill="var(--on-accent)" />
      <circle cx="37.4" cy="20.5" r="2.4" fill="var(--on-accent)" />
      <circle cx="27.3" cy="19.7" r="0.8" fill="var(--accent-hover)" />
      <circle cx="38.1" cy="19.7" r="0.8" fill="var(--accent-hover)" />
      <path d="M28 27.5 Q32 30.8 36 27.5" fill="none" stroke="var(--on-accent)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
