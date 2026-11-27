// Chessground styles its pieces with custom tag selectors (`.cg-wrap piece.pawn.white`).
// The static board renders the same tags so it can reuse those styles.
import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      piece: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
