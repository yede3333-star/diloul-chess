import { defineRouting } from "next-intl/routing";

// Arabic is the default. Every URL carries its locale (/ar/..., /fr/...), and the NEXT_LOCALE
// cookie set by the proxy remembers the last choice (SPEC §4.2).
export const routing = defineRouting({
  locales: ["ar", "fr"],
  defaultLocale: "ar",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

export const LOCALE_DIR: Record<Locale, "rtl" | "ltr"> = { ar: "rtl", fr: "ltr" };
