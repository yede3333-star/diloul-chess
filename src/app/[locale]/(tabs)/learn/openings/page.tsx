import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { OpeningsHome, type OpeningCard } from "@/components/openings/OpeningsHome";
import { OPENINGS } from "@/config/openings";
import { courseSummary, rootFen } from "@/lib/openings/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("learn.openings");
  return { title: t("title") };
}

export default async function Page() {
  const locale = (await getLocale()) as "ar" | "fr";
  const cards: OpeningCard[] = await Promise.all(
    OPENINGS.map(async (def) => {
      const summary = await courseSummary(def.id);
      return {
        id: def.id,
        name: def.name[locale],
        side: def.side,
        group: def.group,
        fen: rootFen(def),
        total: summary ? summary.sections.reduce((n, s) => n + s.nodes.length, 0) : 0,
      };
    }),
  );
  return <OpeningsHome cards={cards} />;
}
