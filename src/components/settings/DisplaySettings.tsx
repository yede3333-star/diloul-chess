"use client";

import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { StaticBoard } from "@/components/board/StaticBoard";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { applyBoard, applyTheme, BOARD_THEMES, readBoard, readTheme, type BoardTheme, type Theme } from "@/lib/prefs/prefs";
import { useStorage } from "@/lib/storage/StorageProvider";

// Small board preview for the board-theme picker (start position).
const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string; lang?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-fg-muted">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-full bg-surface-2 p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            lang={o.lang}
            onClick={() => onChange(o.value)}
            className={`min-h-10 flex-1 rounded-full px-3 text-sm font-semibold transition-colors duration-[var(--dur-fast)] ${
              value === o.value ? "bg-surface text-fg shadow-pop" : "text-fg-muted hover:text-fg"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Language, theme and board theme. A fuller settings screen comes in phase 3 (SPEC §12.3). */
export function DisplaySettings() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { update, data } = useStorage();
  // Server renders the defaults; the real values (set before paint by the inline script) are read after mount.
  const [theme, setTheme] = useState<Theme>("dark");
  const [board, setBoard] = useState<BoardTheme>("sand");

  // Read what the inline script (or the account settings) applied to <html>.
  const accountTheme = data.profile?.settings.theme;
  const accountBoard = data.profile?.settings.board;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with values only the browser knows
    setTheme(readTheme());
    setBoard(readBoard());
  }, [accountTheme, accountBoard]);

  return (
    <div className="card flex flex-col gap-6 p-4" aria-busy={pending}>
      <Segmented
        label={t("settings.language")}
        value={locale}
        options={routing.locales.map((l) => ({ value: l, label: t(`languageNames.${l}`), lang: l }))}
        onChange={(l) => {
          void update({ profile: { locale: l } });
          startTransition(() => router.replace(pathname, { locale: l }));
        }}
      />
      <Segmented
        label={t("settings.theme")}
        value={theme}
        options={[
          { value: "dark", label: t("settings.themeDark") },
          { value: "light", label: t("settings.themeLight") },
        ]}
        onChange={(v) => {
          setTheme(v);
          applyTheme(v);
          void update({ profile: { settings: { theme: v } } });
        }}
      />
      <div className="flex flex-col gap-2">
        <span id="board-theme-label" className="text-sm font-semibold text-fg-muted">
          {t("settings.board")}
        </span>
        <div role="radiogroup" aria-labelledby="board-theme-label" className="grid grid-cols-4 gap-2">
          {BOARD_THEMES.map((b) => (
            <button
              key={b}
              type="button"
              role="radio"
              aria-checked={board === b}
              onClick={() => {
                setBoard(b);
                applyBoard(b);
                void update({ profile: { settings: { board: b } } });
              }}
              className="flex flex-col items-center gap-1.5 rounded-md p-1 text-xs font-semibold"
            >
              <span
                data-board={b}
                className={`block w-full overflow-hidden rounded-sm ring-offset-2 ring-offset-surface ${board === b ? "ring-[3px] ring-accent" : "ring-1 ring-border"}`}
              >
                <StaticBoard fen={START_FEN} coords={false} label={t(`settings.boards.${b}`)} />
              </span>
              <span className={`inline-flex items-center gap-1 ${board === b ? "text-fg" : "text-fg-muted"}`}>
                {board === b && <Check className="size-3.5 shrink-0 text-accent-text" strokeWidth={3} aria-hidden="true" />}
                {t(`settings.boards.${b}`)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
