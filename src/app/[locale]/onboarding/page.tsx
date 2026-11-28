import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Onboarding } from "@/components/onboarding/Onboarding";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("onboarding");
  return { title: t("title") };
}

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col px-[max(16px,env(safe-area-inset-left))] pt-[calc(env(safe-area-inset-top)+16px)] pb-[calc(env(safe-area-inset-bottom)+24px)]">
      <Suspense>
        <Onboarding />
      </Suspense>
    </main>
  );
}
