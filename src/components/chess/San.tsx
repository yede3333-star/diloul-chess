import "@/styles/piece-glyphs.css";

const PIECES = new Set(["K", "Q", "R", "B", "N"]);

/**
 * A move in algebraic notation, shown with the cburnett piece drawing instead of the letter
 * (SPEC §17.4, the default "symbols" mode). Pawn moves and castling have no piece letter.
 * `figurine={false}` shows plain letters (the "letters" option in settings, wired in a later phase).
 * Always left-to-right, even inside Arabic text.
 */
export function San({ san, figurine = true }: { san: string; figurine?: boolean }) {
  const first = san[0];
  if (!figurine || !PIECES.has(first)) {
    return <bdi className="san">{san}</bdi>;
  }
  return (
    <bdi className="san">
      <span className="san-piece" data-p={first} aria-hidden="true" />
      <span className="sr-only">{first}</span>
      {san.slice(1)}
    </bdi>
  );
}

/**
 * A list of moves: "1. d4 d5 2. Bf4" → numbered moves with piece drawings.
 * Always wraps inside its container (flex-wrap, left-to-right), never widens the page.
 */
export function SanLine({ moves, startPly = 0, className = "" }: { moves: string[]; startPly?: number; className?: string }) {
  // Group into numbered pairs: "1. d4 d5" is one unbreakable item; items wrap between them.
  const items: { num: string; moves: string[] }[] = [];
  moves.forEach((m, i) => {
    const ply = startPly + i;
    const isWhite = ply % 2 === 0;
    if (isWhite || i === 0) items.push({ num: `${Math.floor(ply / 2) + 1}.${isWhite ? "" : "…"}`, moves: [m] });
    else items[items.length - 1].moves.push(m);
  });
  return (
    <span dir="ltr" className={`san inline-flex min-w-0 max-w-full flex-wrap gap-x-2.5 gap-y-1 ${className}`}>
      {items.map((it, i) => (
        <span key={i} className="whitespace-nowrap">
          <span className="san-num">{it.num} </span>
          {it.moves.map((m, j) => (
            <span key={j}>
              {j > 0 && " "}
              <San san={m} />
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}
