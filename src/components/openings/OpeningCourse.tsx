"use client";

import { useTranslations } from "next-intl";
import { PathMap, type PathSection } from "@/components/path/PathMap";
import { PrimaryAction } from "@/components/shell/PrimaryAction";
import type { CourseSummary } from "@/lib/openings/course";
import { useStorage } from "@/lib/storage/StorageProvider";

/**
 * The "Course" tab of an opening (SPEC §7.3): one section per rank part, lesson → drill pairs.
 * Nodes open one after the other; the first one not done is the current one.
 */
export function OpeningCourse({ summary, name }: { summary: CourseSummary; name: string }) {
  const t = useTranslations("opening");
  const tr = useTranslations("ranks");
  const { data, status } = useStorage();

  const done = new Set(status === "ready" ? data.progress.filter((p) => p.course === `opening:${summary.id}`).map((p) => p.nodeId) : []);
  const all = summary.sections.flatMap((s) => s.nodes);
  const current = status === "ready" ? all.find((n) => !done.has(n.id)) : undefined;
  const currentIndex = current ? all.indexOf(current) : all.length;

  const sections: PathSection[] = summary.sections.map((s, k) => ({
    id: s.id,
    eyebrow: name,
    title: t("sectionTitle", { rank: tr(s.rank), n: s.index }),
    subtitle: t("sectionMoves", { count: s.moves }),
    color: ((k % 6) + 1) as PathSection["color"],
    nodes: s.nodes.map((n) => {
      const index = all.indexOf(n as (typeof all)[number]);
      const state = done.has(n.id) ? "done" : n === current ? "current" : index < currentIndex ? "open" : "locked";
      return { id: n.id, type: n.type, state, href: `/openings/${summary.id}/${n.id}` };
    }),
  }));

  return (
    <>
      {status === "ready" && !current && <p className="card p-4 text-center font-semibold">{t("finished")}</p>}
      <PathMap sections={sections} />
      {current && <PrimaryAction label={currentIndex === 0 ? t("ctaStart") : t("ctaContinue")} href={`/openings/${summary.id}/${current.id}`} />}
    </>
  );
}
