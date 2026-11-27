"use client";

import { Flame } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { dayKey } from "@/lib/storage/merge";
import { useStorage } from "@/lib/storage/StorageProvider";
import { computeStreak } from "@/lib/storage/streak";

/** Streak flame (SPEC §12.4): gray until today's activity is done, then gold, with the day count. */
export function StreakFlame() {
  const t = useTranslations("streak");
  const { data, status } = useStorage();
  const tz = data.profile?.timezone;
  // "Today" is the player's day, known only in the browser (never during static prerendering).
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the current day exists only on the client
    setToday(dayKey(new Date(), tz));
  }, [tz]);
  const { days, doneToday } = status === "ready" && today ? computeStreak(data.activity, today) : { days: 0, doneToday: false };
  return (
    <span className="chip tabular" role="img" aria-label={t("label", { count: days })}>
      <Flame className={`size-[18px] ${doneToday ? "fill-current text-accent-text" : "text-fg-subtle"}`} aria-hidden="true" />
      <span aria-hidden="true">{days}</span>
    </span>
  );
}
