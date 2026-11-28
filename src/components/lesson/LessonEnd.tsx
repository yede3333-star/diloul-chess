"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Mascot } from "@/components/brand/Mascot";
import { playSound } from "@/lib/sound/sounds";
import { starsFor } from "./stars";

/** End of a lesson (SPEC §6.4): stars from mistakes, a short summary and "Next". */
export function LessonEnd({
  title,
  kind,
  count,
  mistakes,
  nextLabel,
  onNext,
  onRetry,
}: {
  title: string;
  kind: "lesson" | "drill";
  /** New moves (lesson) or positions played from memory (drill). */
  count: number;
  mistakes: number;
  nextLabel: string;
  onNext: () => void;
  onRetry: () => void;
}) {
  const t = useTranslations("lesson");
  const stars = starsFor(mistakes);

  // One soft chime once the stars have popped.
  useEffect(() => {
    const id = window.setTimeout(() => playSound("promote"), 350 + stars * 320);
    return () => clearTimeout(id);
  }, [stars]);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="lesson-burst relative grid place-items-center" aria-hidden="true">
          {Array.from({ length: 10 }, (_, k) => (
            <span
              key={k}
              className="lesson-spark"
              style={{
                ["--a" as string]: `${k * 36}deg`,
                ["--d" as string]: `${(k % 3) * 90}ms`,
              }}
            />
          ))}
          <Mascot size={104} className="lesson-hop" />
        </div>

        <div className="flex items-end gap-2" role="img" aria-label={t("stars", { count: stars })}>
          {[0, 1, 2].map((k) => (
            <Star
              key={k}
              aria-hidden="true"
              strokeWidth={1.5}
              className={`lesson-star ${k === 1 ? "size-16 -translate-y-2" : "size-12"} ${k < stars ? "text-accent" : "text-surface-3"}`}
              fill="currentColor"
              style={{ animationDelay: `${300 + k * 320}ms` }}
            />
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-extrabold">{t(kind === "drill" ? "endDrillTitle" : "endTitle")}</h1>
          <p className="font-semibold text-accent-text">{title}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 text-sm">
          <span className="chip tabular">{t(kind === "drill" ? "endPositions" : "endMoves", { count })}</span>
          <span className="chip tabular">{t("endMistakes", { count: mistakes })}</span>
        </div>

        <p className="max-w-xs text-[15px] leading-relaxed text-fg-muted">{t("endReview")}</p>
      </div>

      <footer className="flex shrink-0 flex-col gap-2 px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
        <button type="button" className="btn btn-primary btn-lg" onClick={onNext}>
          {nextLabel}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onRetry}>
          {t("endRetry")}
        </button>
      </footer>
    </>
  );
}
