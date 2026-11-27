import "chessground/assets/chessground.cburnett.css";
import "./static-board.css";

/**
 * A non-interactive board rendered from a FEN, with no JavaScript.
 * It reuses Chessground's piece set, so it looks identical to the interactive board.
 * Later it becomes the base of <MiniBoard>.
 */

const ROLES: Record<string, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

const FILES = "abcdefgh";

export type Arrow = { from: string; to: string; tone?: "best" | "alt" };

type Props = {
  fen: string;
  orientation?: "white" | "black";
  lastMove?: [string, string];
  check?: string;
  arrows?: Arrow[];
  coords?: boolean;
  label?: string;
  className?: string;
};

/** Square ("e4") → [column, row] in view space, from the top-left corner. */
function toView(sq: string, orientation: "white" | "black"): [number, number] {
  const file = FILES.indexOf(sq[0]);
  const rank = Number(sq[1]) - 1;
  return orientation === "white" ? [file, 7 - rank] : [7 - file, rank];
}

function pct(n: number) {
  return `${n * 12.5}%`;
}

export function StaticBoard({
  fen,
  orientation = "white",
  lastMove,
  check,
  arrows = [],
  coords = true,
  label,
  className = "",
}: Props) {
  const rows = fen.split(" ")[0].split("/");
  const pieces: { key: string; role: string; color: string; col: number; row: number }[] = [];
  rows.forEach((rowStr, r) => {
    let f = 0;
    for (const ch of rowStr) {
      if (/\d/.test(ch)) {
        f += Number(ch);
        continue;
      }
      const sq = `${FILES[f]}${8 - r}`;
      const [col, row] = toView(sq, orientation);
      pieces.push({
        key: sq,
        role: ROLES[ch.toLowerCase()],
        color: ch === ch.toUpperCase() ? "white" : "black",
        col,
        row,
      });
      f++;
    }
  });

  const highlights: { sq: string; kind: string }[] = [];
  if (lastMove) lastMove.forEach((sq) => highlights.push({ sq, kind: "last" }));
  if (check) highlights.push({ sq: check, kind: "check" });

  const fileLabels = orientation === "white" ? FILES.split("") : FILES.split("").reverse();
  const rankLabels = orientation === "white" ? ["8", "7", "6", "5", "4", "3", "2", "1"] : ["1", "2", "3", "4", "5", "6", "7", "8"];

  return (
    <div className={`cg-wrap sboard ${className}`} role="img" aria-label={label ?? fen} dir="ltr">
      {highlights.map(({ sq, kind }) => {
        const [col, row] = toView(sq, orientation);
        return <span key={`${kind}-${sq}`} className={`sb-hl sb-${kind}`} style={{ left: pct(col), top: pct(row) }} />;
      })}
      {coords && (
        <>
          {rankLabels.map((r, i) => (
            <span key={`r${r}`} className={`sb-coord sb-rank ${i % 2 === 0 ? "on-light" : "on-dark"}`} style={{ top: pct(i) }}>
              {r}
            </span>
          ))}
          {fileLabels.map((f, i) => (
            <span key={`f${f}`} className={`sb-coord sb-file ${i % 2 === 0 ? "on-dark" : "on-light"}`} style={{ left: pct(i) }}>
              {f}
            </span>
          ))}
        </>
      )}
      {pieces.map((p) => (
        <piece key={p.key} className={`${p.role} ${p.color}`} style={{ left: pct(p.col), top: pct(p.row) }} />
      ))}
      {arrows.length > 0 && (
        <svg className="sb-arrows" viewBox="0 0 8 8" aria-hidden="true">
          <defs>
            <marker id="sb-head" viewBox="0 0 4 4" refX="2" refY="2" markerWidth="2.6" markerHeight="2.6" orient="auto">
              <path d="M0,0 L4,2 L0,4 z" fill="context-stroke" />
            </marker>
          </defs>
          {arrows.map((a) => {
            const [c1, r1] = toView(a.from, orientation);
            const [c2, r2] = toView(a.to, orientation);
            const x1 = c1 + 0.5;
            const y1 = r1 + 0.5;
            const dx = c2 - c1;
            const dy = r2 - r1;
            const len = Math.hypot(dx, dy);
            const x2 = c2 + 0.5 - (dx / len) * 0.38;
            const y2 = r2 + 0.5 - (dy / len) * 0.38;
            return (
              <line
                key={`${a.from}${a.to}`}
                className={`sb-arrow sb-arrow-${a.tone ?? "best"}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                markerEnd="url(#sb-head)"
              />
            );
          })}
        </svg>
      )}
    </div>
  );
}
