import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AccountCard } from "@/components/settings/AccountCard";
import { DisplaySettings } from "@/components/settings/DisplaySettings";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("profile");
  return { title: t("title") };
}

export default async function ProfilePage() {
  const t = await getTranslations();
  return (
    <div className="flex flex-col gap-6">
      <AccountCard />
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t("settings.title")}</h2>
        <DisplaySettings />
      </section>
    </div>
  );
}
