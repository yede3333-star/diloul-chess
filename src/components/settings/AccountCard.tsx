"use client";

import { LayoutDashboard, LogIn, LogOut, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useStorage } from "@/lib/storage/StorageProvider";
import { getSupabase } from "@/lib/supabase/client";

/** Profile header: guest with a sign-up call, or the signed-in email with sign-out (SPEC §12, §13.1). */
export function AccountCard() {
  const t = useTranslations();
  const { status, mode, user, data, authAvailable, signOut, error } = useStorage();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    getSupabase()
      ?.from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
      .then(({ data: row }) => setIsAdmin(row?.role === "admin"));
  }, [user]);

  const level = data.profile?.onboardingLevel;
  const linked = Object.entries(data.profile?.linked ?? {}).filter(([, v]) => v);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-surface-2 text-fg-muted">
          <UserRound className="size-8" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-2xl font-extrabold">{mode === "user" ? (user?.email ?? t("profile.title")) : t("profile.guest")}</h1>
          {status === "ready" && mode === "guest" && <p className="text-sm text-fg-muted">{t("profile.guestNote")}</p>}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-warning-soft px-3 py-2 text-sm text-fg">
          {t("storage.error")}
        </p>
      )}

      <div className="card flex flex-col gap-3 p-4">
        <h2 className="text-sm font-semibold text-fg-muted">{t("profile.account")}</h2>
        {mode === "user" ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 truncate">{t("auth.signedInAs", { email: user?.email ?? "" })}</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void signOut()}>
              <LogOut aria-hidden="true" />
              {t("auth.signOut")}
            </button>
          </div>
        ) : authAvailable ? (
          <Link href="/login" className="btn btn-primary self-start">
            <LogIn aria-hidden="true" />
            {t("auth.guestCta")}
          </Link>
        ) : (
          <p className="text-sm text-fg-muted">{t("auth.notConfigured")}</p>
        )}
        {level && (
          <p className="text-sm">
            <span className="text-fg-muted">{t("profile.level")} </span>
            {t(`onboarding.level.${level}`)}
          </p>
        )}
        {linked.length > 0 && (
          <p className="text-sm">
            <span className="text-fg-muted">{t("profile.linked")} </span>
            {linked.map(([provider, name]) => (
              <bdi key={provider} className="me-3 inline-block" dir="ltr">
                {provider === "chesscom" ? "Chess.com" : "Lichess"}: {name}
              </bdi>
            ))}
          </p>
        )}
        {isAdmin && (
          <Link href="/admin" className="btn btn-ghost btn-sm self-start">
            <LayoutDashboard aria-hidden="true" />
            {t("profile.admin")}
          </Link>
        )}
      </div>
    </div>
  );
}
