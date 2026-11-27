import { getTranslations } from "next-intl/server";
import { Mascot } from "@/components/brand/Mascot";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <Mascot size={88} />
      <h1 className="text-2xl font-extrabold">{t("title")}</h1>
      <p className="text-fg-muted">{t("body")}</p>
      <Link href="/learn/basics" className="btn btn-primary">
        {t("back")}
      </Link>
    </main>
  );
}
