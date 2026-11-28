"use client";

import { BookOpen, Check, Crown, Sprout, Swords, Target } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Logo } from "@/components/brand/Logo";
import { CoachBubble } from "@/components/coach/CoachBubble";
import { BackArrow, NextArrow } from "@/components/ui/icons";
import { LEVEL_START, initialPuzzleStats } from "@/config/onboarding";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { dayKey } from "@/lib/storage/merge";
import { useStorage } from "@/lib/storage/StorageProvider";
import { ONBOARDING_LEVELS, type OnboardingLevel } from "@/lib/storage/types";

const LEVEL_ICONS = { none: Sprout, rules: BookOpen, r800: Target, r1200: Swords, r1600: Crown } as const;
// Chess.com and Lichess usernames: Latin letters, digits, underscore, hyphen (SPEC §17.8).
const USERNAME = /^[A-Za-z0-9_-]{2,30}$/;

type Step = "language" | "level" | "link";

/** First visit (SPEC §5.4): language → level → optional Chess.com / Lichess accounts. */
export function Onboarding() {
  const t = useTranslations("onboarding");
  const tl = useTranslations("languageNames");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { update, data } = useStorage();
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>(params.get("step") === "level" ? "level" : "language");
  const [level, setLevel] = useState<OnboardingLevel | null>(data.profile?.onboardingLevel ?? null);
  const [chesscom, setChesscom] = useState("");
  const [lichess, setLichess] = useState("");
  const [saving, setSaving] = useState(false);

  const stepIndex = step === "language" ? 1 : step === "level" ? 2 : 3;
  const ccBad = chesscom !== "" && !USERNAME.test(chesscom);
  const liBad = lichess !== "" && !USERNAME.test(lichess);

  async function finish(withAccounts: boolean) {
    if (!level) return;
    setSaving(true);
    const start = LEVEL_START[level];
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await update({
      profile: {
        locale,
        timezone,
        onboardingLevel: level,
        onboardedAt: new Date().toISOString(),
        basicsChapter: start.basicsChapter,
        linked: withAccounts ? { chesscom: chesscom || undefined, lichess: lichess || undefined } : {},
      },
      ranks: start.ranks,
      // Keep an existing puzzle rating (e.g. a returning player); otherwise start from the level.
      puzzles: data.puzzles ?? initialPuzzleStats(level),
      activity: { [dayKey(new Date(), timezone)]: 0 },
    });
    router.replace("/learn/basics");
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <Logo name={locale === "ar" ? "ديلول" : "Diloul"} size={30} />
        <div className="flex items-center gap-2" aria-label={t("stepOf", { step: stepIndex })} role="img">
          {[1, 2, 3].map((i) => (
            <span key={i} className={`h-2 rounded-full transition-all duration-[var(--dur)] ${i <= stepIndex ? "w-6 bg-accent" : "w-2 bg-surface-3"}`} />
          ))}
        </div>
      </header>

      {step === "language" && (
        <section className="flex flex-1 flex-col gap-5">
          <CoachBubble key="c1" text={t("language.coach")} />
          <h1 className="text-2xl font-extrabold">{t("language.title")}</h1>
          <div role="radiogroup" aria-label={t("language.title")} className="grid gap-3">
            {routing.locales.map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={locale === l}
                lang={l}
                onClick={() =>
                  // Switching language reloads this page in the other locale, on the next step.
                  startTransition(() => router.replace({ pathname, query: { step: "level" } }, { locale: l }))
                }
                disabled={pending}
                className={`card flex min-h-16 items-center justify-between px-5 text-start text-lg font-bold transition-colors ${locale === l ? "!border-accent" : ""}`}
              >
                {tl(l)}
                {locale === l && <Check className="size-5 text-accent-text" aria-hidden="true" />}
              </button>
            ))}
          </div>
          <div className="mt-auto flex justify-end">
            <button type="button" className="btn btn-primary btn-lg" onClick={() => setStep("level")}>
              {t("next")}
              <NextArrow />
            </button>
          </div>
        </section>
      )}

      {step === "level" && (
        <section className="flex flex-1 flex-col gap-5">
          <CoachBubble key="c2" text={t("level.coach")} />
          <h1 className="text-2xl font-extrabold">{t("level.title")}</h1>
          <div role="radiogroup" aria-label={t("level.title")} className="grid gap-2.5">
            {ONBOARDING_LEVELS.map((l) => {
              const Icon = LEVEL_ICONS[l];
              const on = level === l;
              return (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setLevel(l)}
                  className={`flex items-center gap-3 rounded-md border-2 bg-surface px-4 py-3 text-start transition-colors ${on ? "border-accent" : "border-border"}`}
                >
                  <span className={`grid size-11 shrink-0 place-items-center rounded-full ${on ? "bg-accent text-on-accent" : "bg-surface-2 text-fg-muted"}`}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="font-bold">{t(`level.${l}`)}</span>
                    <span className="text-sm text-fg-muted">{t(`level.${l}Hint`)}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-auto flex justify-between gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => setStep("language")}>
              <BackArrow />
              {t("back")}
            </button>
            <button type="button" className="btn btn-primary btn-lg" disabled={!level} onClick={() => setStep("link")}>
              {t("next")}
              <NextArrow />
            </button>
          </div>
        </section>
      )}

      {step === "link" && (
        <section className="flex flex-1 flex-col gap-5">
          <CoachBubble key="c3" text={t("link.coach")} />
          <h1 className="text-2xl font-extrabold">{t("link.title")}</h1>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!ccBad && !liBad) void finish(true);
            }}
          >
            {(
              [
                { id: "chesscom", label: t("link.chesscom"), value: chesscom, set: setChesscom, bad: ccBad },
                { id: "lichess", label: t("link.lichess"), value: lichess, set: setLichess, bad: liBad },
              ] as const
            ).map((f) => (
              <label key={f.id} htmlFor={f.id} className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">{f.label}</span>
                <input
                  id={f.id}
                  dir="ltr"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  inputMode="text"
                  value={f.value}
                  onChange={(e) => f.set(e.target.value.trim())}
                  placeholder={t("link.placeholder")}
                  aria-invalid={f.bad}
                  aria-describedby={f.bad ? `${f.id}-err` : undefined}
                  className={`min-h-12 rounded-md border-2 bg-surface px-4 text-base text-fg placeholder:text-fg-subtle focus:outline-none focus-visible:border-accent ${f.bad ? "border-danger" : "border-border"}`}
                />
                {f.bad && (
                  <span id={`${f.id}-err`} className="text-sm text-danger">
                    {t("link.invalid")}
                  </span>
                )}
              </label>
            ))}
            <div className="mt-2 flex flex-wrap justify-between gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => setStep("level")}>
                <BackArrow />
                {t("back")}
              </button>
              <div className="flex gap-2">
                <button type="button" className="btn btn-secondary" disabled={saving} onClick={() => void finish(false)}>
                  {t("skip")}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving || ccBad || liBad || (!chesscom && !lichess)}>
                  {saving ? t("saving") : t("finish")}
                </button>
              </div>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
