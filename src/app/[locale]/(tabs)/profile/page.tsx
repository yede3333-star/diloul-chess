import type { Metadata } from "next";
import { UserRound } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { DisplaySettings } from "@/components/settings/DisplaySettings";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profile");
  return { title: t("title") };
}

export default async function ProfilePage() {
  const t = await getTranslations();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-surface-2 text-fg-muted">
          <UserRound className="size-8" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col">
          <h1 className="text-2xl font-extrabold">{t("profile.guest")}</h1>
          <p className="text-sm text-fg-muted">{t("profile.guestNote")}</p>
        </div>
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t("settings.title")}</h2>
        <DisplaySettings />
      </section>
    </div>
  );
}
