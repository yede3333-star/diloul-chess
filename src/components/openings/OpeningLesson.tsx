"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import type { LessonScript } from "@/components/lesson/types";
import { dayKey } from "@/lib/storage/merge";
import { useStorage } from "@/lib/storage/StorageProvider";

/** A lesson or drill of an opening course: plays it, then saves the stars and today's activity. */
export function OpeningLesson({ script, openingId, nodeId, next }: { script: LessonScript; openingId: string; nodeId: string; next?: { id: string; type: "lesson" | "drill" } }) {
  const t = useTranslations("lesson");
  const { update, data } = useStorage();
  const timezone = data.profile?.timezone;

  const onComplete = useCallback(
    ({ stars }: { stars: number }) => {
      void update({
        progress: [{ course: `opening:${openingId}`, nodeId, stars, completedAt: new Date().toISOString() }],
        activity: { [dayKey(new Date(), timezone)]: 1 },
      });
    },
    [update, openingId, nodeId, timezone],
  );

  return (
    <LessonPlayer
      script={script}
      exitHref={`/openings/${openingId}`}
      nextHref={next ? `/openings/${openingId}/${next.id}` : `/openings/${openingId}`}
      nextLabel={next?.type === "drill" ? t("endNext") : next ? t("continue") : t("endBack")}
      onComplete={onComplete}
    />
  );
}
