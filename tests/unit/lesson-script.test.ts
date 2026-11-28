import { readFileSync } from "node:fs";
import { Chess } from "chess.js";
import { describe, expect, it } from "vitest";
import { buildCourse } from "@/lib/openings/course";
import { nodeScript, type Tpl } from "@/lib/openings/lesson";
import type { OpeningTree } from "@/lib/openings/types";

const tree = JSON.parse(readFileSync("data/openings/london.json", "utf8")) as OpeningTree;
const course = buildCourse(tree);
const nodes = course.sections.flatMap((s) => s.nodes);
const tpl: Tpl = (key, vars) => ({ ar: `${key} ${JSON.stringify(vars ?? {})}`, fr: key });
const name = { ar: "لندن", fr: "Londres" };

describe("lesson scripts (London)", () => {
  it("chains every step: each position follows from the previous step's moves", () => {
    for (const node of nodes) {
      const script = nodeScript(tree, course, node, name, tpl, node === nodes[0]);
      let fen: string | null = null;
      for (const step of script.steps) {
        if (step.kind === "slide") continue;
        if (fen && step.kind !== "replay") expect(step.fen, `${node.id}`).toBe(fen);
        const game = new Chess(step.fen);
        if (step.kind === "replay") step.moves.forEach((m) => game.move(m));
        if (step.kind === "move") {
          game.move(step.expect[0]);
          if (step.reply) game.move(step.reply);
        }
        fen = game.fen();
      }
    }
  });

  it("lessons teach with the arrow, drills from memory from the first move", () => {
    const lesson = nodeScript(tree, course, nodes[0], name, tpl, true);
    expect(lesson.mode).toBe("learn");
    expect(lesson.steps.filter((s) => s.kind === "slide")).toHaveLength(3);
    const drill = nodeScript(tree, course, nodes[1], name, tpl, false);
    expect(drill.mode).toBe("practice");
    expect(drill.steps[0]).toMatchObject({ kind: "replay", auto: false, moves: [] });
    expect(drill.steps.every((s) => s.kind !== "move" || !s.after)).toBe(true);
  });

  it("prints a lesson's moves", () => {
    const id = process.env.SHOW;
    if (!id) return;
    const node = nodes.find((n) => n.id === id)!;
    const script = nodeScript(tree, course, node, name, tpl, false);
    for (const s of script.steps) console.log(s.kind, s.kind === "move" ? `${s.expect[0]} ${s.reply ?? ""} after=${!!s.after}` : "");
  });
});
