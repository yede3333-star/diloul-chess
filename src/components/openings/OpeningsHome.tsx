"use client";

import { useTranslations } from "next-intl";
import { MiniBoard } from "@/components/board/MiniBoard";
import { PrimaryAction } from "@/components/shell/PrimaryAction";
import { Link } from "@/i18n/navigation";
import { useStorage } from "@/lib/storage/StorageProvider";

export type OpeningCard = {
  id: string;
  name: string;
  side: "white" | "black";
  group: "white" | "vs-e4" | "vs-d4";
  fen: string;
  /** Path nodes in the course; 0 when the course is not built yet. */
  total: number;
};

const GROUPS = [
  { group: "white", key: "white" },
  { group: "vs-e4", key: "vsE4" },
  { group: "vs-d4", key: "vsD4" },
] as const;

/** Openings home (SPEC §7.1): my openings first, then one horizontal row per side. */
export function OpeningsHome({ cards }: { cards: OpeningCard[] }) {
  const t = useTranslations("openingsHome");
  const tl = useTranslations("learn");
  const { data, status } = useStorage();

  const doneOf = (id: string) => (status === "ready" ? new Set(data.progress.filter((p) => p.course === `opening:${id}`).map((p) => p.nodeId)).size : 0);
  const percent = (c: OpeningCard) => (c.total ? Math.round((100 * Math.min(doneOf(c.id), c.total)) / c.total) : 0);

  // Most recently practised first.
  const lastAt = (id: string) =>
    data.progress.filter((p) => p.course === `opening:${id}`).reduce((m, p) => (p.completedAt > m ? p.completedAt : m), "");
  const mine = cards.filter((c) => c.total && doneOf(c.id) > 0).sort((a, b) => lastAt(b.id).localeCompare(lastAt(a.id)));
  const ctaTarget = mine[0] ?? cards.find((c) => c.total);

  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-col gap-3" aria-labelledby="mine">
        <h2 id="mine" className="font-heading text-lg font-extrabold">
          {t("mine")}
        </h2>
        {mine.length === 0 ? (
          <p className="text-fg-muted">{t("mineEmpty")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {mine.map((c) => (
              <li key={c.id}>
                <Link href={`/openings/${c.id}`} className="card flex items-center gap-3 p-3 transition-colors hover:border-accent">
                  <MiniBoard fen={c.fen} orientation={c.side} label={c.name} className="w-16 shrink-0" />
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="truncate font-bold">{c.name}</span>
                    <Progress value={percent(c)} />
                    <span className="text-xs text-fg-muted tabular">{t("progress", { percent: percent(c) })}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {GROUPS.map(({ group, key }) => {
        const row = cards.filter((c) => c.group === group).sort((a, b) => Number(!!b.total) - Number(!!a.total));
        return (
          <section key={group} className="flex min-w-0 flex-col gap-3" aria-labelledby={`row-${group}`}>
            <h2 id={`row-${group}`} className="font-heading text-lg font-extrabold">
              {t(key)}
            </h2>
            <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
              {row.map((c) => (
                <li key={c.id} className="w-36 shrink-0 snap-start">
                  {c.total ? (
                    <Link href={`/openings/${c.id}`} className="card flex h-full flex-col gap-2 p-2.5 transition-colors hover:border-accent">
                      <MiniBoard fen={c.fen} orientation={c.side} label={c.name} />
                      <span className="line-clamp-2 text-sm font-bold leading-snug">{c.name}</span>
                      <span className="mt-auto flex flex-col gap-1">
                        <Progress value={percent(c)} />
                        <span className="text-xs text-fg-muted tabular">{doneOf(c.id) ? t("progress", { percent: percent(c) }) : t("notStarted")}</span>
                      </span>
                    </Link>
                  ) : (
                    <div className="card flex h-full flex-col gap-2 p-2.5 opacity-60" aria-disabled="true">
                      <MiniBoard fen={c.fen} orientation={c.side} label={c.name} />
                      <span className="line-clamp-2 text-sm font-bold leading-snug">{c.name}</span>
                      <span className="chip mt-auto self-start text-xs">{t("soon")}</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {ctaTarget && <PrimaryAction label={tl("cta")} href={`/openings/${ctaTarget.id}`} />}
    </div>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <span className="block h-1.5 overflow-hidden rounded-full bg-surface-3" aria-hidden="true">
      <span className="block h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
    </span>
  );
}
