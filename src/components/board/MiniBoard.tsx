import { StaticBoard } from "./StaticBoard";

/**
 * A small fixed board for cards and lists (SPEC §4.4). No JavaScript.
 * Uses the board theme the player chose (data-board on <html>).
 */
export function MiniBoard({
  fen,
  orientation = "white",
  lastMove,
  label,
  className = "",
}: {
  fen: string;
  orientation?: "white" | "black";
  lastMove?: [string, string];
  label: string;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-sm ${className}`}>
      <StaticBoard fen={fen} orientation={orientation} lastMove={lastMove} coords={false} label={label} />
    </div>
  );
}
