import { Flame, UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/Logo";
import { Link } from "@/i18n/navigation";

/** Top bar (SPEC §4.3): site name, daily streak flame with its day count, profile. */
export async function TopBar() {
  const t = await getTranslations();
  // The streak becomes real with storage (step 5). Gray = today's activity not done yet.
  const streak = 0;
  const doneToday = false;

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 px-[max(16px,env(safe-area-inset-left))] lg:max-w-none lg:px-6">
        <Link href="/learn/basics" aria-label={t("nav.home")} className="rounded-sm">
          <Logo name={t("brand.name")} size={30} />
        </Link>
        <div className="flex items-center gap-2">
          <span className="chip tabular" role="img" aria-label={t("streak.label", { count: streak })}>
            <Flame className={`size-[18px] ${doneToday ? "fill-current text-accent-text" : "text-fg-subtle"}`} aria-hidden="true" />
            <span aria-hidden="true">{streak}</span>
          </span>
          <Link
            href="/profile"
            aria-label={t("nav.profile")}
            className="grid size-10 place-items-center rounded-full bg-surface-2 text-fg-muted transition-colors hover:text-fg"
          >
            <UserRound className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
