"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RANK_KEYS } from "@/config/rank-keys";
import { RankBadge } from "./RankBadge";

/**
 * Current rank → next rank with the progress line between them, and two arrows to browse
 * the other ranks (SPEC §4.4). Used for openings, endgames and puzzles.
 */
export function RankTrack({
  rank,
  progress,
  goalsDone,
  goalsTotal,
  className = "",
}: {
  /** Index of the current rank, 0–6. */
  rank: number;
  /** Progress toward the next rank, 0–1. */
  progress: number;
  goalsDone: number;
  goalsTotal: number;
  className?: string;
}) {
  const t = useTranslations("components.rankTrack");
  const tr = useTranslations("ranks");
  const [view, setView] = useState(rank);

  const last = RANK_KEYS.length - 1;
  const from = RANK_KEYS[view];
  const to = view < last ? RANK_KEYS[view + 1] : null;
  const fill = view < rank ? 1 : view === rank ? Math.max(0, Math.min(1, progress)) : 0;
  const status =
    view < rank ? t("completed") : view === rank ? (to ? t("goals", { done: goalsDone, total: goalsTotal }) : t("maxRank")) : t("locked");

  return (
    <div className={`card flex flex-col gap-3 p-4 ${className}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-secondary btn-icon btn-sm shrink-0"
          onClick={() => setView((v) => Math.max(0, v - 1))}
          disabled={view === 0}
          aria-label={t("prev")}
        >
          <ChevronLeft className="rtl:rotate-180" aria-hidden="true" />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <RankBadge rank={from} size={48} muted={view > rank} label={tr(from)} />
          <div
            className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-3"
            role="progressbar"
            aria-label={t("progressLabel")}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(fill * 100)}
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-[var(--dur-slow)]"
              style={{ width: `${fill * 100}%`, background: `var(--rank-${from})` }}
            />
          </div>
          {to ? <RankBadge rank={to} size={48} muted={view >= rank} label={tr(to)} /> : <span className="w-12 shrink-0" />}
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-icon btn-sm shrink-0"
          onClick={() => setView((v) => Math.min(last, v + 1))}
          disabled={view === last}
          aria-label={t("next")}
        >
          <ChevronRight className="rtl:rotate-180" aria-hidden="true" />
        </button>
      </div>

      <div className="flex items-baseline justify-between gap-3 px-1" aria-live="polite">
        <p className="font-heading text-lg font-extrabold">
          {tr(from)}
          {view === rank && <span className="ms-2 text-sm font-semibold text-accent-text">{t("current")}</span>}
        </p>
        <p className="text-sm text-fg-muted tabular">{status}</p>
      </div>
    </div>
  );
}
