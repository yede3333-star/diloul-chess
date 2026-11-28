/**
 * Builds the lesson and drill scripts of an opening course node (SPEC §6.4, §7.3).
 * Runs on the server; every position is replayed with chess.js, so a bad tree fails the build.
 */
import { Chess, type Square } from "chess.js";
import type { BoardShape } from "@/components/board/Board";
import type { LessonScript, LessonStep } from "@/components/lesson/types";
import type { Course, CourseLine, CourseNode } from "./course";
import type { Bi, OpeningNode, OpeningTree } from "./types";

export type GenKey =
  | "replayLine"
  | "drillStart"
  | "drillNext"
  | "firstMove"
  | "replyMain"
  | "replyOther"
  | "replyRare"
  | "trap"
  | "continue"
  | "transposition"
  | "drillFirst"
  | "drillMove"
  | "hintPiece"
  | "hintCastle"
  | "lessonTitle"
  | "drillTitle";

/** Message lookup in both languages (lessonGen namespace). A Bi value is used in its own language. */
export type Tpl = (key: GenKey, vars?: Record<string, string | number | Bi>) => Bi;

const START = new Chess().fen();

/** Positions along a path: fens[i] is the position before path[i]; last moves for highlighting. */
function positions(path: OpeningNode[]) {
  const game = new Chess();
  const fens = [game.fen()];
  const last: ([Square, Square] | undefined)[] = [undefined];
  for (const n of path) {
    const m = game.move(n.san);
    fens.push(game.fen());
    last.push([m.from, m.to]);
  }
  return { fens, last };
}

/** "d4", "f3e5:best" → a board shape. */
export function parseShape(s: string): BoardShape {
  const [sq, tone] = s.split(":");
  return { from: sq.slice(0, 2) as Square, to: sq.length > 2 ? (sq.slice(2, 4) as Square) : undefined, tone: (tone as BoardShape["tone"]) ?? "best" };
}

function hintFor(fen: string, san: string, tpl: Tpl): Bi {
  const m = new Chess(fen).move(san);
  if (m.isKingsideCastle() || m.isQueensideCastle()) return tpl("hintCastle");
  return tpl("hintPiece", { piece: m.piece });
}

/** What the coach says before a player move in a lesson. */
function promptFor(prev: OpeningNode | undefined, node: OpeningNode, opp: string, tpl: Tpl): Bi {
  if (!prev) return tpl("firstMove", { san: node.san });
  if (prev.note) return prev.note;
  const vars = { reply: prev.san, san: node.san, opp };
  if (prev.tags?.includes("trap")) return tpl("trap", vars);
  if (prev.freq === undefined) return tpl("continue", vars);
  if (prev.freq >= 0.35) return tpl("replyMain", vars);
  if (prev.freq < 0.12) return tpl("replyRare", vars);
  return tpl("replyOther", vars);
}

function lessonSteps(line: CourseLine, opp: string, tpl: Tpl, practice: boolean, firstLine: boolean): LessonStep[] {
  const { path } = line;
  const { fens, last } = positions(path);
  const steps: LessonStep[] = [];

  // Where the player starts playing: in a lesson, the first new move (the opponent's new reply is
  // replayed with the rest); in a drill, the very beginning.
  let start = practice ? 0 : line.from;
  if (path[start]?.side === "opponent") start++;
  const replay = path.slice(0, start).map((n) => n.san);
  if (practice) steps.push({ kind: "replay", fen: START, moves: replay, text: tpl(firstLine ? "drillStart" : "drillNext"), auto: false });
  else if (replay.length) steps.push({ kind: "replay", fen: START, moves: replay, text: tpl("replayLine"), auto: true });

  for (let i = start; i < path.length; i++) {
    const node = path[i];
    if (node.side !== "user") continue;
    const prev = i > 0 ? path[i - 1] : undefined;
    const reply = path[i + 1];
    steps.push({
      kind: "move",
      fen: fens[i],
      lastMove: last[i],
      expect: [node.san],
      reply: reply?.san,
      prompt: practice ? (prev ? tpl("drillMove", { reply: prev.san, opp }) : tpl("drillFirst")) : promptFor(prev, node, opp, tpl),
      hint: hintFor(fens[i], node.san, tpl),
      after: practice ? undefined : node.note,
    });
  }

  // The line ends on the opponent's move: say something about it if there is something to say.
  const end = path[path.length - 1];
  if (!practice && end.side === "opponent" && end.tags?.includes("transposition"))
    steps.push({ kind: "info", fen: fens[path.length], lastMove: last[path.length], text: tpl("transposition") });
  else if (!practice && end.side === "opponent" && end.note) steps.push({ kind: "info", fen: fens[path.length], lastMove: last[path.length], text: end.note });
  return steps;
}

export function nodeScript(tree: OpeningTree, course: Course, node: CourseNode, name: Bi, tpl: Tpl, withIntro: boolean): LessonScript {
  const practice = node.type === "drill";
  const opp = tree.color === "white" ? "black" : "white";
  const number = Number(node.id.split("-").pop()!.slice(1));
  const steps: LessonStep[] = [];

  if (withIntro && !practice && tree.intro)
    for (const slide of tree.intro) {
      const game = new Chess();
      slide.moves
        .split(" ")
        .filter(Boolean)
        .forEach((san) => game.move(san));
      steps.push({ kind: "slide", fen: game.fen(), title: slide.title, text: slide.text, shapes: (slide.shapes ?? []).map(parseShape) });
    }

  node.lines.forEach((line, k) => steps.push(...lessonSteps(line, opp, tpl, practice, k === 0)));

  return {
    id: `${course.id}:${node.id}`,
    kind: practice ? "drill" : "lesson",
    mode: practice ? "practice" : "learn",
    title: tpl(practice ? "drillTitle" : "lessonTitle", { name, n: number }),
    orientation: tree.color,
    startFen: withIntro && !practice && tree.intro ? START : undefined,
    steps,
    count: node.moves,
  };
}
