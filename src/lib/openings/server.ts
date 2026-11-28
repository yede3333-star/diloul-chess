/**
 * Server helpers for the openings pages: tree loading, the course, lesson scripts.
 * Trees are imported (bundled) rather than read from disk, so they are there wherever the server runs.
 */
import { Chess } from "chess.js";
import { createTranslator } from "next-intl";
import { OPENING_BY_ID, type OpeningDef } from "@/config/openings";
import ar from "@/messages/ar.json";
import fr from "@/messages/fr.json";
import { buildCourse, findNode, summarize, type Course, type CourseSummary } from "./course";
import { nodeScript, type GenKey, type Tpl } from "./lesson";
import type { Bi, OpeningTree } from "./types";
import type { LessonScript } from "@/components/lesson/types";

export async function loadTree(id: string): Promise<OpeningTree | null> {
  if (!OPENING_BY_ID.get(id)?.built) return null;
  try {
    return (await import(`../../../data/openings/${id}.json`)).default as OpeningTree;
  } catch {
    return null;
  }
}

export async function loadCourse(id: string): Promise<{ def: OpeningDef; tree: OpeningTree; course: Course } | null> {
  const def = OPENING_BY_ID.get(id);
  const tree = def ? await loadTree(id) : null;
  if (!def || !tree) return null;
  return { def, tree, course: buildCourse(tree) };
}

export async function courseSummary(id: string): Promise<CourseSummary | null> {
  const loaded = await loadCourse(id);
  return loaded ? summarize(loaded.course) : null;
}

/** The position after an opening's root moves (for its mini board). */
export function rootFen(def: OpeningDef): string {
  const game = new Chess();
  def.root.forEach((san) => game.move(san));
  return game.fen();
}

const tAr = createTranslator({ locale: "ar", messages: ar, namespace: "lessonGen" });
const tFr = createTranslator({ locale: "fr", messages: fr, namespace: "lessonGen" });

/** The lesson text templates in both languages. */
export const lessonTpl: Tpl = (key: GenKey, vars = {}) => {
  const pick = (lang: "ar" | "fr") =>
    Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, typeof v === "object" ? (v as Bi)[lang] : v])) as Record<string, string | number>;
  return { ar: tAr(key, pick("ar")), fr: tFr(key, pick("fr")) };
};

export async function lessonFor(id: string, nodeId: string): Promise<{ def: OpeningDef; script: LessonScript; nextId?: string } | null> {
  const loaded = await loadCourse(id);
  if (!loaded) return null;
  const found = findNode(loaded.course, nodeId);
  if (!found) return null;
  const script = nodeScript(loaded.tree, loaded.course, found.node, loaded.def.name, lessonTpl, found.first);
  return { def: loaded.def, script, nextId: found.next?.id };
}
