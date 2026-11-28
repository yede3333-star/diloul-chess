#!/usr/bin/env node
/**
 * Content validation (SPEC §7.4, §15.1). Runs in CI on every push/PR: `npm run validate-content`.
 * (.mts so Node runs it as an ES module with its built-in TypeScript support, no build step.)
 *
 * Opening trees (data/openings/{id}.json) are checked for:
 *  - valid JSON with a root `children` array of OpeningNode
 *  - every move legal from its parent position, `san` and `uci` describing the same move
 *  - `fen` equal to the position after the move (move counters ignored)
 *  - `ply` consistent, `side` alternating between "user" and "opponent"
 *  - `freq` in 0–1, `tier` a known rank key, bilingual `name`/`note` when present
 *  - transpositions: the same position reached twice must ask the same user move
 *  - engine rule (SPEC §7.4): no player move loses more than 0.5 pawn (`loss`, computed by the
 *    build script with Stockfish) unless tagged "gambit"; every player move must carry `loss`
 *  - opening-level explanation (idea, 3–5 plans, mistakes) bilingual when present
 *
 * Exit code 1 on any error, so CI fails.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { Chess } from "chess.js";

type Bi = { ar: string; fr: string };
type OpeningNode = {
  loss?: number;
  fen: string;
  san: string;
  uci: string;
  ply: number;
  side: "user" | "opponent";
  freq?: number;
  games?: number;
  eval?: number;
  tier: string;
  name?: Bi;
  note?: Bi;
  tags?: string[];
  children: OpeningNode[];
};
type OpeningFile = {
  id: string;
  color: "white" | "black";
  startFen?: string;
  idea?: Bi;
  plans?: Bi[];
  mistakes?: Bi[];
  children: OpeningNode[];
};

const RANKS = new Set(["start", "novice", "amateur", "trainee", "skilled", "expert", "master"]);
const root = new URL("..", import.meta.url).pathname;
const errors: string[] = [];
let checkedNodes = 0;

/** Position identity without the half-move and full-move counters. */
const fenKey = (fen: string) => fen.split(" ").slice(0, 4).join(" ");

function isBi(x: unknown): x is Bi {
  return !!x && typeof (x as Bi).ar === "string" && typeof (x as Bi).fr === "string" && (x as Bi).ar.length > 0 && (x as Bi).fr.length > 0;
}

function checkOpening(file: string) {
  const where = (path: string) => `${file}${path}`;
  let data: OpeningFile;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    errors.push(`${file}: invalid JSON (${(e as Error).message})`);
    return;
  }
  if (!Array.isArray(data.children)) {
    errors.push(`${file}: missing root "children" array`);
    return;
  }
  const userSide = data.color === "black" ? "b" : "w";
  // position → user move expected there (transposition consistency)
  const userMoveAt = new Map<string, { uci: string; path: string }>();

  const walk = (parentFen: string, nodes: OpeningNode[], path: string, parentPly: number) => {
    for (const [i, node] of nodes.entries()) {
      const here = `${path} > ${node.san ?? `#${i}`}`;
      checkedNodes++;
      // Field checks first, so an illegal move still reports everything else wrong with the node.
      if (node.freq !== undefined && !(node.freq >= 0 && node.freq <= 1)) errors.push(where(`${here}: freq ${node.freq} outside 0–1`));
      if (!RANKS.has(node.tier)) errors.push(where(`${here}: unknown tier "${node.tier}"`));
      if (node.name !== undefined && !isBi(node.name)) errors.push(where(`${here}: name must have non-empty ar and fr`));
      if (node.note !== undefined && !isBi(node.note)) errors.push(where(`${here}: note must have non-empty ar and fr`));
      if (node.side === "user" && node.ply > 0) {
        if (typeof node.loss !== "number") errors.push(where(`${here}: player move without engine "loss"`));
        else if (node.loss > 50 && !node.tags?.includes("gambit")) errors.push(where(`${here}: player move loses ${node.loss} cp (> 50) without the "gambit" tag`));
      }
      const game = new Chess(parentFen);
      const mover = game.turn();
      let move;
      try {
        move = game.move(node.san);
      } catch {
        errors.push(where(`${here}: illegal move "${node.san}" in ${parentFen}`));
        continue;
      }
      const uci = `${move.from}${move.to}${move.promotion ?? ""}`;
      if (node.uci !== uci) errors.push(where(`${here}: uci "${node.uci}" does not match san "${node.san}" (expected ${uci})`));
      if (fenKey(node.fen ?? "") !== fenKey(game.fen())) errors.push(where(`${here}: fen mismatch (expected ${fenKey(game.fen())})`));
      if (node.ply !== parentPly + 1) errors.push(where(`${here}: ply ${node.ply}, expected ${parentPly + 1}`));
      const expectedSide = mover === userSide ? "user" : "opponent";
      if (node.side !== expectedSide) errors.push(where(`${here}: side "${node.side}", expected "${expectedSide}"`));
      if (expectedSide === "user") {
        const key = fenKey(parentFen);
        const seen = userMoveAt.get(key);
        if (seen && seen.uci !== uci) errors.push(where(`${here}: transposition conflict, ${seen.path} plays ${seen.uci} in the same position`));
        else if (!seen) userMoveAt.set(key, { uci, path: here });
      }
      if (!Array.isArray(node.children)) errors.push(where(`${here}: missing children array`));
      else walk(game.fen(), node.children, here, node.ply);
    }
  };

  if (data.idea !== undefined && !isBi(data.idea)) errors.push(`${file}: idea must have non-empty ar and fr`);
  if (data.plans !== undefined && (!Array.isArray(data.plans) || data.plans.length < 3 || data.plans.length > 5 || !data.plans.every(isBi)))
    errors.push(`${file}: plans must be 3–5 bilingual items`);
  if (data.mistakes !== undefined && (!Array.isArray(data.mistakes) || !data.mistakes.every(isBi))) errors.push(`${file}: mistakes must be bilingual items`);

  walk(data.startFen ?? new Chess().fen(), data.children, "", 0);
}

const openingsDir = join(root, "data", "openings");
const files = existsSync(openingsDir) ? readdirSync(openingsDir).filter((f) => f.endsWith(".json")) : [];
for (const f of files) checkOpening(join(openingsDir, f));

if (errors.length) {
  console.error(`✗ Content validation failed (${errors.length} problem${errors.length > 1 ? "s" : ""}):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✓ Content valid: ${files.length} opening file(s), ${checkedNodes} node(s).`);
