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

/** A short line of moves: "1. d4 d5 2. Bf4" → numbered moves with piece drawings. */
export function SanLine({ moves, startPly = 0 }: { moves: string[]; startPly?: number }) {
  return (
    <bdi className="san">
      {moves.map((m, i) => {
        const ply = startPly + i;
        const isWhite = ply % 2 === 0;
        return (
          <span key={i} className="whitespace-nowrap">
            {i > 0 && " "}
            {isWhite && <span className="san-num">{Math.floor(ply / 2) + 1}. </span>}
            {!isWhite && i === 0 && <span className="san-num">{Math.floor(ply / 2) + 1}… </span>}
            <San san={m} />
          </span>
        );
      })}
    </bdi>
  );
}
