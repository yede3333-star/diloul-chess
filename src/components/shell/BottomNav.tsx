"use client";

import { GraduationCap, Puzzle, Swords, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const ITEMS: { href: "/learn/basics" | "/games" | "/puzzles"; match: string; key: "learn" | "games" | "puzzles"; Icon: LucideIcon }[] = [
  { href: "/learn/basics", match: "/learn", key: "learn", Icon: GraduationCap },
  { href: "/games", match: "/games", key: "games", Icon: Swords },
  { href: "/puzzles", match: "/puzzles", key: "puzzles", Icon: Puzzle },
];

/**
 * Floating bottom bar with the three tabs (SPEC §4.3).
 * From the lg breakpoint it becomes a sidebar on the inline-start side.
 */
export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("main")}
      className="fixed inset-x-0 bottom-0 z-30 px-[max(16px,env(safe-area-inset-left))] pb-[max(12px,env(safe-area-inset-bottom))] lg:inset-x-auto lg:start-0 lg:top-[calc(3.5rem+env(safe-area-inset-top))] lg:w-56 lg:border-e lg:border-border lg:bg-bg lg:px-3 lg:py-6"
    >
      <ul className="mx-auto flex max-w-md gap-1 rounded-[24px] border border-border bg-nav p-1.5 shadow-float backdrop-blur-md lg:max-w-none lg:flex-col lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
        {ITEMS.map(({ href, match, key, Icon }) => {
          const active = pathname === match || pathname.startsWith(`${match}/`);
          return (
            <li key={key} className="flex-1 lg:flex-none">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[var(--tap-min)] flex-col items-center justify-center gap-0.5 rounded-[18px] py-2 text-xs font-semibold transition-colors duration-[var(--dur-fast)] lg:flex-row lg:justify-start lg:gap-3 lg:rounded-md lg:px-4 lg:py-3 lg:text-base ${
                  active ? "bg-accent-soft text-accent-text" : "text-fg-muted hover:text-fg"
                }`}
              >
                <Icon className="size-[22px] shrink-0" aria-hidden="true" />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
