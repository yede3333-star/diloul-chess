import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { notFound } from "next/navigation";
import { OPENING_BY_ID, OPENINGS } from "@/config/openings";
import type { OpeningTree } from "@/lib/openings/types";
import { TreeReview } from "./TreeReview";

// Internal review page for checkpoint 1.1: walk a built opening tree with its stats and notes.
export const metadata: Metadata = { title: "Opening review", robots: { index: false, follow: false } };

export function generateStaticParams() {
  return OPENINGS.filter((o) => o.built).map((o) => ({ id: o.id }));
}

async function loadTree(id: string): Promise<OpeningTree | null> {
  try {
    return JSON.parse(await readFile(join(process.cwd(), "data/openings", `${id}.json`), "utf8"));
  } catch {
    return null;
  }
}

export default async function OpeningReviewPage({ params }: PageProps<"/[locale]/dev/openings/[id]">) {
  const { id } = await params;
  const def = OPENING_BY_ID.get(id);
  const tree = def ? await loadTree(id) : null;
  if (!def || !tree) notFound();
  return (
    <main className="mx-auto flex w-full max-w-[1000px] flex-col gap-5 px-[max(16px,env(safe-area-inset-left))] py-6">
      <TreeReview tree={tree} name={def.name} />
    </main>
  );
}
