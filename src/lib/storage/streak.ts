/**
 * Daily streak (SPEC §12.4): consecutive days with at least one counted action.
 * Today not done yet does not break the streak; it is still alive from yesterday.
 * (The weekly "freeze" day of SPEC §17.5 arrives with phase 1.)
 */
export function computeStreak(activity: Record<string, number>, today: string): { days: number; doneToday: boolean } {
  const doneToday = (activity[today] ?? 0) > 0;
  let days = 0;
  const d = new Date(`${today}T12:00:00Z`);
  if (!doneToday) d.setUTCDate(d.getUTCDate() - 1);
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if ((activity[key] ?? 0) > 0) {
      days++;
      d.setUTCDate(d.getUTCDate() - 1);
    } else break;
  }
  return { days, doneToday };
}
