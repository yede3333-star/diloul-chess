#!/usr/bin/env node
/**
 * Splits each opening tree (data/openings/{id}.json) into per-rank files the app loads on demand
 * (SPEC §17.1): public/data/openings/{id}/{rank}.json holds every node up to that rank.
 * Runs before every build (npm "prebuild"); the output is generated, not committed.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RANKS = ["start", "novice", "amateur", "trainee", "skilled", "expert", "master"];
type Node = { tier: string; children: Node[] } & Record<string, unknown>;

const root = new URL("..", import.meta.url).pathname;
const src = join(root, "data/openings");
const out = join(root, "public/data/openings");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const prune = (nodes: Node[], max: number): Node[] =>
  nodes.filter((n) => RANKS.indexOf(n.tier) <= max).map((n) => ({ ...n, children: prune(n.children, max) }));

const index: Record<string, { ranks: string[]; builtAt: string }> = {};
for (const f of existsSync(src) ? readdirSync(src).filter((x) => x.endsWith(".json")) : []) {
  const tree = JSON.parse(readFileSync(join(src, f), "utf8"));
  const upTo = RANKS.indexOf(tree.source?.upTo ?? "amateur");
  mkdirSync(join(out, tree.id), { recursive: true });
  for (let r = 0; r <= upTo; r++) {
    // Compact JSON: these files are fetched by phones on mobile networks.
    writeFileSync(join(out, tree.id, `${RANKS[r]}.json`), JSON.stringify({ ...tree, children: prune(tree.children, r) }));
  }
  index[tree.id] = { ranks: RANKS.slice(0, upTo + 1), builtAt: tree.builtAt };
}
writeFileSync(join(out, "index.json"), JSON.stringify(index));
console.log(`split ${Object.keys(index).length} opening(s) into public/data/openings`);
