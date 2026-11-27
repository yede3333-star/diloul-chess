import { useId } from "react";

/**
 * Original Diloul mark: a sand-gold pawn rising from a dune under a desert star,
 * on an indigo night tile. Fixed brand colors (identical in both themes).
 * The same drawing is in src/app/icon.svg (favicon) and public/brand/.
 */
export function LogoMark({ size = 32, className = "", title }: { size?: number; className?: string; title?: string }) {
  const id = useId();
  const clip = `${id}c`;
  const sky = `${id}s`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <clipPath id={clip}>
          <rect width="48" height="48" rx="13" />
        </clipPath>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#323b78" />
          <stop offset="1" stopColor="#141831" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width="48" height="48" fill={`url(#${sky})`} />
        <path d="M0 40 C9 34.5 17 34 24 36.5 C31 39 38 38.5 48 33 V48 H0 Z" fill="#c8832e" />
        <path d="M0 44 C12 40 22 40.5 30 42.5 C37 44.2 43 43.6 48 41.5 V48 H0 Z" fill="#a8722a" />
        <circle cx="21" cy="14.5" r="6.2" fill="#e9b864" />
        <rect x="15.2" y="20.6" width="11.6" height="3.4" rx="1.7" fill="#e9b864" />
        <path d="M16.4 24 C16.4 28.4 14 31.6 12.4 35.2 H29.6 C28 31.6 25.6 28.4 25.6 24 Z" fill="#e9b864" />
        <path d="M37 6.5 L38.25 10.25 L42 11.5 L38.25 12.75 L37 16.5 L35.75 12.75 L32 11.5 L35.75 10.25 Z" fill="#eee7da" />
      </g>
    </svg>
  );
}
