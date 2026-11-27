"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Mascot } from "@/components/brand/Mascot";
import { reportError } from "@/lib/monitoring/report";

export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errorPage");
  useEffect(() => {
    reportError(error, { digest: error.digest });
  }, [error]);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <Mascot size={88} />
      <h1 className="text-2xl font-extrabold">{t("title")}</h1>
      <p className="text-fg-muted">{t("body")}</p>
      <button type="button" className="btn btn-primary" onClick={reset}>
        {t("retry")}
      </button>
    </main>
  );
}
