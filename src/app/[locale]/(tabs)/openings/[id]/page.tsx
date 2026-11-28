import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { BackArrow } from "@/components/ui/icons";
import { OpeningCourse } from "@/components/openings/OpeningCourse";
import { OPENING_BY_ID, OPENINGS } from "@/config/openings";
import { Link } from "@/i18n/navigation";
import { summarize } from "@/lib/openings/course";
import { loadCourse } from "@/lib/openings/server";

export function generateStaticParams() {
  return OPENINGS.filter((o) => o.built).map((o) => ({ id: o.id }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/openings/[id]">): Promise<Metadata> {
  const { id } = await params;
  const locale = (await getLocale()) as "ar" | "fr";
  const def = OPENING_BY_ID.get(id);
  return { title: def?.name[locale] };
}

const TABS = ["course", "spar", "lines"] as const;

export default async function OpeningPage({ params }: PageProps<"/[locale]/openings/[id]">) {
  const { id } = await params;
  const loaded = await loadCourse(id);
  if (!OPENING_BY_ID.get(id)) notFound();
  const t = await getTranslations("opening");
  const locale = (await getLocale()) as "ar" | "fr";
  const def = OPENING_BY_ID.get(id)!;
  const tree = loaded?.tree;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <Link href="/learn/openings" className="flex items-center gap-1.5 self-start text-sm font-semibold text-fg-muted hover:text-fg">
          <BackArrow className="size-4" />
          {t("back")}
        </Link>
        <h1 className="font-heading text-2xl font-extrabold">{def.name[locale]}</h1>
        <p className="text-fg-muted">{def.description[locale]}</p>
        <span className="chip self-start text-sm">{t(def.side === "white" ? "asWhite" : "asBlack")}</span>
      </header>

      <nav aria-label={t("tabs.label")} className="rounded-full bg-surface p-1">
        <ul className="flex gap-1">
          {TABS.map((tab) => (
            <li key={tab} className="flex-1">
              <span
                aria-current={tab === "course" ? "page" : undefined}
                aria-disabled={tab !== "course" || undefined}
                title={tab !== "course" ? t("soonTab") : undefined}
                className={`flex min-h-10 items-center justify-center rounded-full px-2 text-sm font-semibold ${
                  tab === "course" ? "bg-surface-3 text-fg" : "text-fg-subtle"
                }`}
              >
                {t(`tabs.${tab}`)}
              </span>
            </li>
          ))}
        </ul>
      </nav>

      {!loaded ? (
        <p className="card p-4 text-center text-fg-muted">{t("notBuilt")}</p>
      ) : (
        <>
          {tree?.idea && (
            <details className="card group p-4">
              <summary className="cursor-pointer list-none font-heading text-lg font-bold marker:hidden">{t("idea")}</summary>
              <div className="mt-3 flex flex-col gap-3 leading-relaxed">
                <p>{tree.idea[locale]}</p>
                {tree.plans && (
                  <>
                    <h3 className="font-bold">{t("plans")}</h3>
                    <ul className="list-disc ps-5">
                      {tree.plans.map((p, i) => (
                        <li key={i}>{p[locale]}</li>
                      ))}
                    </ul>
                  </>
                )}
                {tree.mistakes && (
                  <>
                    <h3 className="font-bold">{t("mistakes")}</h3>
                    <ul className="list-disc ps-5">
                      {tree.mistakes.map((p, i) => (
                        <li key={i}>{p[locale]}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </details>
          )}
          <OpeningCourse summary={summarize(loaded.course)} name={def.name[locale]} />
        </>
      )}
    </div>
  );
}
