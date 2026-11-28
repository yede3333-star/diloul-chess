import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { OpeningLesson } from "@/components/openings/OpeningLesson";
import { OPENINGS } from "@/config/openings";
import { findNode } from "@/lib/openings/course";
import { lessonFor, loadCourse } from "@/lib/openings/server";

export async function generateStaticParams() {
  const params: { id: string; node: string }[] = [];
  for (const def of OPENINGS.filter((o) => o.built)) {
    const loaded = await loadCourse(def.id);
    loaded?.course.sections.forEach((s) => s.nodes.forEach((n) => params.push({ id: def.id, node: n.id })));
  }
  return params;
}

export async function generateMetadata({ params }: PageProps<"/[locale]/openings/[id]/[node]">): Promise<Metadata> {
  const { id, node } = await params;
  const locale = (await getLocale()) as "ar" | "fr";
  const lesson = await lessonFor(id, node);
  return { title: lesson?.script.title[locale], robots: { index: false } };
}

export default async function LessonPage({ params }: PageProps<"/[locale]/openings/[id]/[node]">) {
  const { id, node } = await params;
  const lesson = await lessonFor(id, node);
  const loaded = await loadCourse(id);
  if (!lesson || !loaded) notFound();
  const next = lesson.nextId ? findNode(loaded.course, lesson.nextId)?.node : undefined;
  return <OpeningLesson script={lesson.script} openingId={id} nodeId={node} next={next ? { id: next.id, type: next.type } : undefined} />;
}
