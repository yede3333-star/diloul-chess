/**
 * An opening course built from its tree (SPEC §7.3): one or more sections per rank, each a path of
 * lesson → drill pairs. Pure functions: the server pages build the course and the lesson scripts,
 * the client only receives the result.
 *
 * - A "line" is a path from the first move to a leaf of the tree pruned to a rank.
 * - A line is taught in the rank where its first new move appears; the part before is replayed.
 * - Lines are taught in tree order, the most played reply first, so a lesson stays on one branch.
 * - A lesson teaches about LESSON_NEW_MOVES new player moves; its drill replays the same lines
 *   from the start, from memory.
 */
import { RANK_KEYS, type RankKey } from "@/config/rank-keys";
import type { OpeningNode, OpeningTree } from "./types";

export const LESSON_NEW_MOVES = 5;
export const SECTION_LESSONS = 4;

export type CourseLine = {
  path: OpeningNode[];
  /** Index in `path` of the first move new at this rank. */
  from: number;
  reach: number;
};

export type CourseNode = {
  /** e.g. "novice-2-l3" (rank, section, lesson number, l = lesson / d = drill). */
  id: string;
  type: "lesson" | "drill";
  rank: RankKey;
  lines: CourseLine[];
  /** New player moves taught (lesson), or player moves practised (drill). */
  moves: number;
};

export type CourseSection = { id: string; rank: RankKey; index: number; nodes: CourseNode[] };

export type Course = { id: string; color: "white" | "black"; sections: CourseSection[] };

/** What the client needs to draw the path: no tree data. */
export type CourseSummary = {
  id: string;
  sections: { id: string; rank: RankKey; index: number; moves: number; nodes: { id: string; type: "lesson" | "drill" }[] }[];
};

const rankIndex = (r: RankKey) => RANK_KEYS.indexOf(r);

/** Leaf paths in tree order, the most played reply first, so related lines stay next to each other. */
function leafPaths(nodes: OpeningNode[], max: number, prefix: OpeningNode[] = []): OpeningNode[][] {
  const out: OpeningNode[][] = [];
  const sorted = [...nodes].sort((a, b) => (b.freq ?? 0) - (a.freq ?? 0));
  for (const n of sorted) {
    if (rankIndex(n.tier) > max) continue;
    const path = [...prefix, n];
    const kids = n.children.filter((c) => rankIndex(c.tier) <= max);
    if (!kids.length) out.push(path);
    else out.push(...leafPaths(kids, max, path));
  }
  return out;
}

const reachOf = (path: OpeningNode[]) => path.reduce((p, n) => (n.side === "opponent" && n.freq !== undefined ? p * n.freq : p), 1);

/** Identity of a node inside the tree: its move path. */
export const pathKey = (path: OpeningNode[], end = path.length) =>
  path
    .slice(0, end)
    .map((n) => n.san)
    .join(" ");

export function buildCourse(tree: OpeningTree): Course {
  const sections: CourseSection[] = [];
  const top = rankIndex(tree.source.upTo);
  for (let r = 0; r <= top; r++) {
    const rank = RANK_KEYS[r];
    const lines: CourseLine[] = leafPaths(tree.children, r)
      .map((path) => ({ path, from: path.findIndex((n) => n.tier === rank), reach: reachOf(path) }))
      .filter((l) => l.from >= 0);

    // Group lines into lessons of about LESSON_NEW_MOVES new player moves.
    const lessons: { lines: CourseLine[]; moves: number }[] = [];
    let current: { lines: CourseLine[]; seen: Set<string> } | null = null;
    for (const line of lines) {
      if (!current) current = { lines: [], seen: new Set() };
      current.lines.push(line);
      line.path.forEach((n, i) => i >= line.from && n.side === "user" && current!.seen.add(pathKey(line.path, i + 1)));
      if (current.seen.size >= LESSON_NEW_MOVES) {
        lessons.push({ lines: current.lines, moves: current.seen.size });
        current = null;
      }
    }
    if (current) {
      // A small remainder joins the previous lesson rather than making a tiny one.
      const prev = lessons[lessons.length - 1];
      if (prev && current.seen.size < 3) {
        prev.lines.push(...current.lines);
        prev.moves += current.seen.size;
      } else lessons.push({ lines: current.lines, moves: current.seen.size });
    }

    for (let s = 0; s * SECTION_LESSONS < lessons.length; s++) {
      const index = s + 1;
      const nodes: CourseNode[] = [];
      lessons.slice(s * SECTION_LESSONS, (s + 1) * SECTION_LESSONS).forEach((lesson, k) => {
        const n = s * SECTION_LESSONS + k + 1;
        const drilled = new Set(lesson.lines.flatMap((l) => l.path.map((node, i) => (node.side === "user" ? pathKey(l.path, i + 1) : "")).filter(Boolean)));
        nodes.push({ id: `${rank}-${index}-l${n}`, type: "lesson", rank, lines: lesson.lines, moves: lesson.moves });
        nodes.push({ id: `${rank}-${index}-d${n}`, type: "drill", rank, lines: lesson.lines, moves: drilled.size });
      });
      sections.push({ id: `${rank}-${index}`, rank, index, nodes });
    }
  }
  return { id: tree.id, color: tree.color, sections };
}

export function summarize(course: Course): CourseSummary {
  return {
    id: course.id,
    sections: course.sections.map((s) => ({
      id: s.id,
      rank: s.rank,
      index: s.index,
      moves: s.nodes.filter((n) => n.type === "lesson").reduce((sum, n) => sum + n.moves, 0),
      nodes: s.nodes.map((n) => ({ id: n.id, type: n.type })),
    })),
  };
}

export function findNode(course: Course, nodeId: string): { node: CourseNode; next?: CourseNode; first: boolean } | null {
  const all = course.sections.flatMap((s) => s.nodes);
  const i = all.findIndex((n) => n.id === nodeId);
  if (i < 0) return null;
  return { node: all[i], next: all[i + 1], first: i === 0 };
}
