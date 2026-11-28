#!/usr/bin/env node
/**
 * Builds an opening tree (SPEC §7.4) into data/openings/{id}.json.
 *
 *   node scripts/build-openings.mts <opening-id> [--to=amateur] [--depth=20]
 *
 * - Player's turn: popular moves from the Lichess explorer (rating band of the rank), evaluated
 *   with Stockfish. The player's move is: a forced override, else the first `prefer` move of the
 *   opening within 0.3 pawn of the engine's best, else the most popular move within 0.3 pawn,
 *   else the engine's best.
 * - Opponent's turn: replies by popularity until the rank's coverage is reached, skipping replies
 *   that are too rare (minimum games, and minimum probability of reaching the position).
 * - Depth and coverage grow with each rank; each node records the first rank it appears in.
 * - Opponent replies that lose ≥ 1.5 pawns are tagged "trap" (the player learns to punish them).
 * - Transpositions: a position reached a second time is not expanded again; the node is tagged
 *   "transposition" and the app continues from the first occurrence (same FEN).
 * - Explanations come from data/openings/notes/{id}.json (written by hand, Arabic + French).
 * - Every explorer answer is cached in .cache/explorer/, so rebuilding needs no new requests.
 *   The explorer requires a Lichess token (Authorization: Bearer, env LICHESS_TOKEN; in the cloud
 *   session the network proxy injects it).
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Chess } from "chess.js";
import { createEngine } from "./lib/engine.mjs";

// ---------------------------------------------------------------- config (SPEC §7.4 table)
const TIERS = ["start", "novice", "amateur", "trainee", "skilled", "expert", "master"] as const;
type Tier = (typeof TIERS)[number];

type TierRule = {
  maxUserMoves: number; // player moves after the root
  coverage: number; // share of the opponent's replies to cover (0–1)
  onlyFirstReply?: boolean;
  ratings: number[]; // explorer rating buckets
  minGames: number; // a reply needs at least this many games in the band
  minReach: number; // and the line's probability of being reached must be at least this
};

const RULES: Record<Tier, TierRule> = {
  start: { maxUserMoves: 5, coverage: 0, onlyFirstReply: true, ratings: [1000, 1200, 1400], minGames: 200, minReach: 0 },
  novice: { maxUserMoves: 7, coverage: 0.7, ratings: [1000, 1200, 1400], minGames: 300, minReach: 0.04 },
  amateur: { maxUserMoves: 10, coverage: 0.8, ratings: [1200, 1400, 1600], minGames: 300, minReach: 0.015 },
  trainee: { maxUserMoves: 13, coverage: 0.88, ratings: [1400, 1600, 1800], minGames: 300, minReach: 0.008 },
  skilled: { maxUserMoves: 16, coverage: 0.93, ratings: [1600, 1800, 2000], minGames: 200, minReach: 0.004 },
  expert: { maxUserMoves: 19, coverage: 0.96, ratings: [1800, 2000, 2200, 2500], minGames: 100, minReach: 0.002 },
  master: { maxUserMoves: 21, coverage: 0.98, ratings: [2000, 2200, 2500], minGames: 50, minReach: 0.001 },
};
const MAX_LOSS_CP = 30; // a player move may lose at most 0.3 pawn vs the engine's best
const TRAP_SWING_CP = 150; // an opponent reply losing ≥ 1.5 pawns is a trap to punish

// ---------------------------------------------------------------- types (mirror of SPEC §7.4)
type Bi = { ar: string; fr: string };
type OpeningNode = {
  fen: string;
  san: string;
  uci: string;
  ply: number;
  side: "user" | "opponent";
  freq?: number;
  games?: number;
  eval?: number; // centipawns, White's point of view, after the move
  loss?: number; // player moves only: centipawns lost vs the engine's best move (0 = best)
  tier: Tier;
  name?: Bi;
  note?: Bi;
  tags?: string[];
  eco?: string; // ECO code + English name from the explorer, for reference
  children: OpeningNode[];
};
type Notes = {
  idea?: Bi;
  plans?: Bi[];
  mistakes?: Bi[];
  /** Keyed by the move path from the start, e.g. "d4 d5 Bf4". */
  moves?: Record<string, { note?: Bi; name?: Bi; tags?: string[] }>;
};
type Override = { forced?: Record<string, string> }; // path → SAN

// ---------------------------------------------------------------- args
const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith("--"));
const toTier = (args.find((a) => a.startsWith("--to="))?.slice(5) ?? "amateur") as Tier;
const DEPTH = Number(args.find((a) => a.startsWith("--depth="))?.slice(8) ?? 20);
if (!id || !TIERS.includes(toTier)) {
  console.error("Usage: node scripts/build-openings.mts <opening-id> [--to=amateur] [--depth=20]");
  process.exit(1);
}

const root = new URL("..", import.meta.url).pathname;
const catalogue = readFileSync(join(root, "src/config/openings.ts"), "utf8");
// Read the opening definition from the TypeScript config without importing it (no build step).
const block = catalogue.split(/\n  \{\n/).find((b) => b.includes(`id: "${id}"`));
if (!block) throw new Error(`Unknown opening "${id}" in src/config/openings.ts`);
const side = /side: "black"/.test(block) ? "black" : "white";
const rootMoves: string[] = JSON.parse(`[${block.match(/root: \[([^\]]*)\]/)![1]}]`);
const prefer: string[] = block.match(/prefer: \[([^\]]*)\]/) ? JSON.parse(`[${block.match(/prefer: \[([^\]]*)\]/)![1]}]`) : [];

const notesPath = join(root, "data/openings/notes", `${id}.json`);
const notes: Notes = existsSync(notesPath) ? JSON.parse(readFileSync(notesPath, "utf8")) : {};
const overridePath = join(root, "data/openings/overrides", `${id}.json`);
const overrides: Override = existsSync(overridePath) ? JSON.parse(readFileSync(overridePath, "utf8")) : {};

// ---------------------------------------------------------------- explorer (cached, polite)
type ExplorerMove = { uci: string; san: string; white: number; draws: number; black: number; opening?: { eco: string; name: string } | null };
type ExplorerAnswer = { white: number; draws: number; black: number; moves: ExplorerMove[]; opening?: { eco: string; name: string } | null };

const CACHE = join(root, ".cache/explorer");
mkdirSync(CACHE, { recursive: true });
let requests = 0;
let cacheHits = 0;
let lastRequestAt = 0;

async function explore(fen: string, ratings: number[]): Promise<ExplorerAnswer> {
  const params = new URLSearchParams({
    variant: "standard",
    speeds: "blitz,rapid,classical",
    ratings: ratings.join(","),
    fen,
    moves: "12",
    topGames: "0",
    recentGames: "0",
  });
  const url = `https://explorer.lichess.ovh/lichess?${params}`;
  const file = join(CACHE, `${createHash("sha1").update(url).digest("hex")}.json`);
  if (existsSync(file)) {
    cacheHits++;
    return JSON.parse(readFileSync(file, "utf8"));
  }
  for (let attempt = 1; ; attempt++) {
    // One request at a time, at most ~2 per second.
    const wait = 500 - (Date.now() - lastRequestAt);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();
    const headers: Record<string, string> = { "User-Agent": "diloul-chess build-openings (open source; github.com/yede3333-star/diloul-chess)" };
    if (process.env.LICHESS_TOKEN) headers.Authorization = `Bearer ${process.env.LICHESS_TOKEN}`;
    const res = await fetch(url, { headers });
    requests++;
    if (res.status === 429) {
      console.warn("  explorer 429: waiting 65 s");
      await new Promise((r) => setTimeout(r, 65_000));
      continue;
    }
    if (!res.ok) {
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 5_000 * attempt));
        continue;
      }
      throw new Error(`explorer ${res.status} for ${fen}`);
    }
    const data = (await res.json()) as ExplorerAnswer;
    writeFileSync(file, JSON.stringify(data));
    return data;
  }
}

// ---------------------------------------------------------------- engine (cached per position)
const engine = createEngine();
await engine.init();
// Engine results are cached on disk too, so a rebuild (e.g. after editing notes) is fast.
const ENGINE_CACHE = join(root, ".cache/engine");
mkdirSync(ENGINE_CACHE, { recursive: true });
const evalCache = new Map<string, { best: { uci: string; cp: number }[] }>();
const fenKey = (fen: string) => fen.split(" ").slice(0, 4).join(" ");
const toWhite = (cp: number, fen: string) => (fen.split(" ")[1] === "w" ? cp : -cp);

/** Engine lines for the side to move (cp from the mover's point of view). */
async function lines(fen: string, multiPv = 5) {
  const key = `${fenKey(fen)}|${multiPv}|${DEPTH}`;
  if (!evalCache.has(key)) {
    const file = join(ENGINE_CACHE, `${createHash("sha1").update(key).digest("hex")}.json`);
    if (existsSync(file)) evalCache.set(key, JSON.parse(readFileSync(file, "utf8")));
    else {
      const res = await engine.analyse(fen, { depth: DEPTH, multiPv });
      const value = { best: res.map((r) => ({ uci: r.uci, cp: r.cp })) };
      evalCache.set(key, value);
      writeFileSync(file, JSON.stringify(value));
    }
  }
  return evalCache.get(key)!.best;
}
/** White-point-of-view eval of the position after a move. */
async function evalWhiteAfter(fenAfter: string) {
  const cp = await scoreAfter(fenAfter);
  return fenAfter.split(" ")[1] === "b" ? cp : -cp; // side to move is "b" → White just moved
}
/** Score of the position after a move, from the point of view of the side that just moved. */
async function scoreAfter(fenAfter: string) {
  const l = await lines(fenAfter, 1);
  if (!l.length) {
    const g = new Chess(fenAfter);
    return g.isCheckmate() ? 100000 : 0; // the mover delivered mate, or stalemate/draw
  }
  return -l[0].cp;
}

// ---------------------------------------------------------------- build
const userColor = side === "white" ? "w" : "b";
const seen = new Map<string, OpeningNode>(); // fenKey → first node reaching it (for transpositions)
let positions = 0;

function makeNode(parentFen: string, san: string, ply: number, tier: Tier): OpeningNode {
  const g = new Chess(parentFen);
  const mover = g.turn();
  const m = g.move(san);
  return {
    fen: g.fen(),
    san: m.san,
    uci: `${m.from}${m.to}${m.promotion ?? ""}`,
    ply,
    side: mover === userColor ? "user" : "opponent",
    tier,
    children: [],
  };
}

async function chooseUserMove(fen: string, path: string, tier: Tier): Promise<{ san: string; eval: number; loss: number } | null> {
  const forced = overrides.forced?.[path];
  const g = new Chess(fen);
  if (forced) {
    const after = new Chess(fen);
    const m = after.move(forced);
    const best = (await lines(fen, 1))[0]?.cp ?? 0;
    const cp = await scoreAfter(after.fen());
    return { san: m.san, eval: await evalWhiteAfter(after.fen()), loss: Math.max(0, best - cp) };
  }
  const engineLines = await lines(fen, 5);
  if (!engineLines.length) return null;
  const best = engineLines[0].cp;
  const explorer = await explore(fen, RULES[tier].ratings);
  const total = explorer.white + explorer.draws + explorer.black;

  // Loss of each candidate (explorer moves + engine moves) vs the engine's best.
  const candidates = new Map<string, { san: string; loss: number; games: number; cp: number }>();
  for (const l of engineLines) {
    const san = new Chess(fen).move(l.uci).san;
    candidates.set(san, { san, loss: best - l.cp, games: 0, cp: l.cp });
  }
  for (const mv of explorer.moves) {
    const games = mv.white + mv.draws + mv.black;
    const known = candidates.get(mv.san);
    if (known) known.games = games;
    else if (games >= RULES[tier].minGames && games / Math.max(total, 1) >= 0.03) {
      const after = new Chess(fen);
      after.move(mv.san);
      const cp = await scoreAfter(after.fen());
      candidates.set(mv.san, { san: mv.san, loss: best - cp, games, cp });
    }
  }
  const ok = [...candidates.values()].filter((c) => c.loss <= MAX_LOSS_CP);
  const legal = new Set(g.moves());
  const pick =
    prefer.map((p) => ok.find((c) => c.san === p && legal.has(p))).find(Boolean) ??
    ok.sort((a, b) => b.games - a.games || a.loss - b.loss)[0] ??
    [...candidates.values()].sort((a, b) => a.loss - b.loss)[0];
  return { san: pick.san, eval: toWhite(pick.cp, fen), loss: Math.max(0, pick.loss) };
}

async function expand(node: { fen: string; children: OpeningNode[]; ply: number }, path: string, userMoves: number, reach: number, tier: Tier) {
  const rule = RULES[tier];
  const g = new Chess(node.fen);
  if (g.isGameOver()) return;
  positions++;
  if (positions % 25 === 0) console.log(`  … ${tier}: ${positions} positions, ${requests} requests, ${cacheHits} cached`);

  if (g.turn() === userColor) {
    if (userMoves >= rule.maxUserMoves) return;
    let child = node.children[0];
    if (!child) {
      const choice = await chooseUserMove(node.fen, path, tier);
      if (!choice) return;
      child = makeNode(node.fen, choice.san, node.ply + 1, tier);
      child.eval = choice.eval;
      child.loss = choice.loss;
      node.children.push(child);
    }
    await descend(child, `${path} ${child.san}`.trim(), userMoves + 1, reach, tier);
  } else {
    const explorer = await explore(node.fen, rule.ratings);
    const total = explorer.white + explorer.draws + explorer.black;
    if (!total) return;
    const replies = [...explorer.moves].sort((a, b) => b.white + b.draws + b.black - (a.white + a.draws + a.black));
    let covered = 0;
    for (const [i, mv] of replies.entries()) {
      const games = mv.white + mv.draws + mv.black;
      const share = games / total;
      const already = node.children.find((c) => c.san === mv.san);
      const wanted = rule.onlyFirstReply ? i === 0 : covered < rule.coverage && games >= rule.minGames && reach * share >= rule.minReach;
      // Replies are re-sorted for each rank's rating band, so never stop early: skip instead,
      // and keep deepening replies added at an earlier rank.
      if (!already && !wanted) continue;
      if (wanted) covered += share;
      let child = already;
      if (!child) {
        child = makeNode(node.fen, mv.san, node.ply + 1, tier);
        child.freq = Math.round(share * 1000) / 1000;
        child.games = games;
        if (mv.opening) child.eco = `${mv.opening.eco} ${mv.opening.name}`;
        node.children.push(child);
      }
      await descend(child, `${path} ${child.san}`.trim(), userMoves, reach * share, tier);
    }
  }
}

async function descend(child: OpeningNode, path: string, userMoves: number, reach: number, tier: Tier) {
  const k = fenKey(child.fen);
  const first = seen.get(k);
  if (first && first !== child) {
    // Transposition: continue from the first occurrence instead of growing a copy.
    child.tags = [...new Set([...(child.tags ?? []), "transposition"])];
    return;
  }
  seen.set(k, child);
  if (child.side === "opponent" && child.eval === undefined) {
    // Evaluate opponent replies to spot traps (cheap: positions are cached).
    child.eval = await evalWhiteAfter(child.fen);
  }
  await expand(child, path, userMoves, reach, tier);
}

// Root moves: forced, all tier "start".
const start = new Chess();
const tree = { id, color: side, root: rootMoves, children: [] as OpeningNode[] };
let cursor: { fen: string; children: OpeningNode[]; ply: number } = { fen: start.fen(), children: tree.children, ply: 0 };
let rootPath = "";
for (const san of rootMoves) {
  const n = makeNode(cursor.fen, san, cursor.ply + 1, "start");
  n.eval = await evalWhiteAfter(n.fen);
  if (n.side === "user") {
    const best = (await lines(cursor.fen, 1))[0]?.cp ?? 0;
    n.loss = Math.max(0, best - (await scoreAfter(n.fen)));
  }
  cursor.children.push(n);
  seen.set(fenKey(n.fen), n);
  rootPath = `${rootPath} ${n.san}`.trim();
  cursor = n;
}

for (const tier of TIERS.slice(0, TIERS.indexOf(toTier) + 1)) {
  const t = Date.now();
  seen.clear();
  // Re-register the root path, then grow the tree for this tier.
  let c: OpeningNode | undefined = tree.children[0];
  while (c) {
    seen.set(fenKey(c.fen), c);
    c = c.children.length === 1 && c.ply < rootMoves.length ? c.children[0] : undefined;
  }
  await expand(cursor, rootPath, 0, 1, tier);
  console.log(`tier ${tier}: done in ${((Date.now() - t) / 1000).toFixed(0)} s (requests ${requests}, cache ${cacheHits})`);
}

// ---------------------------------------------------------------- traps, notes, stats
const all: OpeningNode[] = [];
(function walk(nodes: OpeningNode[], parentEval: number) {
  for (const n of nodes) {
    all.push(n);
    if (n.side === "opponent" && n.eval !== undefined) {
      const userSign = side === "white" ? 1 : -1;
      if ((n.eval - parentEval) * userSign >= TRAP_SWING_CP && n.children.length) n.tags = [...new Set([...(n.tags ?? []), "trap"])];
    }
    walk(n.children, n.eval ?? parentEval);
  }
})(tree.children, 0);

const pathOf = new Map<OpeningNode, string>();
(function paths(nodes: OpeningNode[], prefix: string) {
  for (const n of nodes) {
    const p = `${prefix} ${n.san}`.trim();
    pathOf.set(n, p);
    paths(n.children, p);
  }
})(tree.children, "");
const byPath = new Map([...pathOf].map(([n, p]) => [p, n]));
const unknownNotes: string[] = [];
for (const [p, extra] of Object.entries(notes.moves ?? {})) {
  const n = byPath.get(p);
  if (!n) {
    unknownNotes.push(p);
    continue;
  }
  if (extra.note) n.note = extra.note;
  if (extra.name) n.name = extra.name;
  if (extra.tags) n.tags = [...new Set([...(n.tags ?? []), ...extra.tags])];
}

const out = {
  id,
  color: side,
  root: rootMoves,
  builtAt: new Date().toISOString(),
  source: { explorer: "lichess", speeds: "blitz,rapid,classical", depth: DEPTH, upTo: toTier },
  idea: notes.idea,
  plans: notes.plans,
  mistakes: notes.mistakes,
  children: tree.children,
};
const file = join(root, "data/openings", `${id}.json`);
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, JSON.stringify(out, null, 1) + "\n");

const perTier = Object.fromEntries(TIERS.map((t) => [t, all.filter((n) => n.tier === t && n.side === "user").length]));
console.log(`\n${id}: ${all.length} nodes, ${all.filter((n) => n.side === "user").length} player moves`, perTier);
console.log(`traps: ${all.filter((n) => n.tags?.includes("trap")).length}, transpositions: ${all.filter((n) => n.tags?.includes("transposition")).length}, positions visited: ${positions}`);
console.log(`explorer requests: ${requests}, cache hits: ${cacheHits}`);
if (unknownNotes.length) console.warn(`⚠ notes for paths not in the tree:\n  ${unknownNotes.join("\n  ")}`);
engine.quit();
