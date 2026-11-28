import { Chess, type Square } from "chess.js";

export type Color = "white" | "black";

/** Legal destinations per origin square, in the shape Chessground expects. */
export function legalDests(chess: Chess): Map<Square, Square[]> {
  const dests = new Map<Square, Square[]>();
  for (const m of chess.moves({ verbose: true })) {
    const list = dests.get(m.from);
    if (list) list.push(m.to);
    else dests.set(m.from, [m.to]);
  }
  return dests;
}

export function turnColor(chess: Chess): Color {
  return chess.turn() === "w" ? "white" : "black";
}

/** True if moving this piece from → to is a pawn reaching the last rank. */
export function isPromotion(chess: Chess, from: Square, to: Square): boolean {
  const piece = chess.get(from);
  if (!piece || piece.type !== "p") return false;
  return (piece.color === "w" && to[1] === "8") || (piece.color === "b" && to[1] === "1");
}
