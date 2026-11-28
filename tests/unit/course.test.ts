import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildCourse, pathKey } from "@/lib/openings/course";
import type { OpeningTree } from "@/lib/openings/types";

const tree = JSON.parse(readFileSync("data/openings/london.json", "utf8")) as OpeningTree;
const course = buildCourse(tree);
const nodes = course.sections.flatMap((s) => s.nodes);

describe("opening course (London)", () => {
  it("prints the course", () => {
    if (!process.env.SHOW) return;
    for (const s of course.sections)
      for (const n of s.nodes)
        if (n.type === "lesson")
          console.log(n.id, n.moves, "\n  " + n.lines.map((l) => `${pathKey(l.path)} [from ${l.from}, ${(l.reach * 100).toFixed(1)}%]`).join("\n  "));
  });

  it("alternates lesson and drill, with unique ids", () => {
    nodes.forEach((n, i) => expect(n.type).toBe(i % 2 ? "drill" : "lesson"));
    expect(new Set(nodes.map((n) => n.id)).size).toBe(nodes.length);
  });

  it("teaches every player move of the tree exactly in its rank", () => {
    const taught = new Set<string>();
    for (const n of nodes)
      if (n.type === "lesson")
        for (const l of n.lines) l.path.forEach((m, i) => i >= l.from && m.side === "user" && taught.add(`${m.tier}|${pathKey(l.path, i + 1)}`));
    const all = new Set<string>();
    const walk = (ns: OpeningTree["children"], prefix: string[]) =>
      ns.forEach((m) => {
        const p = [...prefix, m.san];
        if (m.side === "user") all.add(`${m.tier}|${p.join(" ")}`);
        walk(m.children, p);
      });
    walk(tree.children, []);
    expect(taught).toEqual(all);
  });

  it("starts with the main line", () => {
    const first = nodes[0];
    expect(first.rank).toBe("start");
    expect(first.lines[0].from).toBe(0);
  });
});
