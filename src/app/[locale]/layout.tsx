import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { LOCALE_DIR, routing } from "@/i18n/routing";
import { PREFS_INLINE_SCRIPT } from "@/lib/prefs/prefs";
import { PrefsSync } from "@/lib/prefs/PrefsSync";
import { fontVariables } from "../fonts";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return { title: { default: t("title"), template: `%s · ${t("title")}` }, description: t("description") };
}

export const viewport: Viewport = {
  themeColor: "#11152a",
  colorScheme: "dark light",
  viewportFit: "cover",
};

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    // data-theme / data-board are set before paint by the inline script, hence suppressHydrationWarning.
    <html lang={locale} dir={LOCALE_DIR[locale]} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREFS_INLINE_SCRIPT }} />
      </head>
      <body>
        <NextIntlClientProvider>
          <PrefsSync />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
