import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageIntro } from "@/components/shell/PageIntro";
import { PrimaryAction } from "@/components/shell/PrimaryAction";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("learn.basics");
  return { title: t("title") };
}

export default async function Page() {
  const t = await getTranslations();
  return (
    <>
      <PageIntro title={t("learn.basics.title")} intro={t("learn.basics.intro")} coach={t("learn.basics.coach")} soon={t("common.soon")} />
      <PrimaryAction label={t("learn.cta")} />
    </>
  );
}
