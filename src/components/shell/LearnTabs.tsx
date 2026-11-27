"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const TABS = ["basics", "openings", "endgames"] as const;

/** The three top tabs inside "Learn" (SPEC §4.3). */
export function LearnTabs() {
  const t = useTranslations("learn.tabs");
  const pathname = usePathname();

  return (
    <nav aria-label={t("label")} className="rounded-full bg-surface p-1">
      <ul className="flex gap-1">
        {TABS.map((tab) => {
          const href = `/learn/${tab}` as const;
          const active = pathname === href;
          return (
            <li key={tab} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-10 items-center justify-center rounded-full px-2 text-sm font-semibold transition-colors duration-[var(--dur-fast)] ${
                  active ? "bg-surface-3 text-fg" : "text-fg-muted hover:text-fg"
                }`}
              >
                {t(tab)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
