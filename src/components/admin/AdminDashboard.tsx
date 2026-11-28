"use client";

import { Activity, CalendarDays, Flag, LayoutDashboard, Users, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useStorage } from "@/lib/storage/StorageProvider";
import { getSupabase } from "@/lib/supabase/client";

const SECTIONS: { key: "overview" | "reports" | "daily" | "users" | "health"; Icon: LucideIcon; phase: number }[] = [
  { key: "overview", Icon: LayoutDashboard, phase: 1 },
  { key: "reports", Icon: Flag, phase: 1 },
  { key: "daily", Icon: CalendarDays, phase: 2 },
  { key: "users", Icon: Users, phase: 1 },
  { key: "health", Icon: Activity, phase: 2 },
];

/**
 * Admin dashboard shell (SPEC §19.4). The page itself is public HTML; the role check here only
 * decides what to show. Real protection is in the database: admin data is readable only through
 * RLS policies that call public.is_admin().
 */
export function AdminDashboard() {
  const t = useTranslations("admin");
  const ta = useTranslations("auth");
  const { status, user } = useStorage();
  const [role, setRole] = useState<"checking" | "admin" | "user">("checking");

  useEffect(() => {
    if (!user) return;
    getSupabase()
      ?.from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setRole(data?.role === "admin" ? "admin" : "user"));
  }, [user]);

  if (status !== "ready" || (user && role === "checking")) return <p role="status">{t("loading")}</p>;

  if (!user)
    return (
      <div className="card flex flex-col items-start gap-3 p-5">
        <h1 className="text-xl font-extrabold">{t("title")}</h1>
        <p>{t("signInFirst")}</p>
        <Link href="/login" className="btn btn-primary">
          {ta("signIn")}
        </Link>
      </div>
    );

  if (role !== "admin")
    return (
      <div className="card flex flex-col gap-2 p-5">
        <h1 className="text-xl font-extrabold">{t("title")}</h1>
        <p role="alert">{t("forbidden")}</p>
      </div>
    );

  return (
    <>
      <h1 className="text-2xl font-extrabold">{t("title")}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map(({ key, Icon, phase }) => (
          <section key={key} className="card flex flex-col gap-2 p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent-text">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="text-lg font-bold">{t(`sections.${key}`)}</h2>
            </div>
            <p className="text-sm text-fg-muted">{t(`sectionHints.${key}`)}</p>
            <span className="chip self-start">{t("soonPhase", { phase })}</span>
          </section>
        ))}
      </div>
    </>
  );
}
