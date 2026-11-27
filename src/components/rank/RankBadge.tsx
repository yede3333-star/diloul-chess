import { ChessBishop, ChessKing, ChessKnight, ChessPawn, ChessQueen, ChessRook, Crown, type LucideIcon } from "lucide-react";
import type { RankKey } from "@/config/rank-keys";

// Each rank climbs the piece ladder: pawn → knight → bishop → rook → queen → king → crown.
const ICONS: Record<RankKey, LucideIcon> = {
  start: ChessPawn,
  novice: ChessKnight,
  amateur: ChessBishop,
  trainee: ChessRook,
  skilled: ChessQueen,
  expert: ChessKing,
  master: Crown,
};

/** Shield in the rank's color (SPEC §4.4). `label` is the translated rank name, for screen readers. */
export function RankBadge({ rank, size = 44, label }: { rank: RankKey; size?: number; label?: string }) {
  const Icon = ICONS[rank];
  return (
    <span
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size * 1.1 }}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="0 0 40 44" className="absolute inset-0 h-full w-full drop-shadow-[0_3px_3px_rgb(0_0_0/0.25)]">
        <path d="M20 2 L36 7.5 V20 C36 31 29.5 38.5 20 42 C10.5 38.5 4 31 4 20 V7.5 Z" fill={`var(--rank-${rank})`} />
        <path d="M20 6 L32 10.2 V20 C32 28.6 27.2 34.6 20 37.6 Z" fill="rgb(255 255 255 / 0.18)" />
      </svg>
      <Icon className="relative -mt-[8%] text-on-rank" style={{ width: "48%", height: "48%" }} strokeWidth={2.3} />
    </span>
  );
}
