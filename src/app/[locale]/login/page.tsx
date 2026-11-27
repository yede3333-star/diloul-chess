import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/brand/Logo";
import { Link } from "@/i18n/navigation";
import { BackArrow } from "@/components/ui/icons";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("title") };
}

export default async function LoginPage() {
  const t = await getTranslations();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col gap-6 px-[max(16px,env(safe-area-inset-left))] pt-[calc(env(safe-area-inset-top)+16px)] pb-8">
      <div className="flex items-center justify-between">
        <Link href="/learn/basics" className="btn btn-ghost btn-sm -ms-3">
          <BackArrow />
          {t("nav.learn")}
        </Link>
        <Logo name={t("brand.name")} size={28} />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold">{t("auth.title")}</h1>
        <p className="text-fg-muted">{t("auth.intro")}</p>
      </div>
      <LoginForm />
    </main>
  );
}
