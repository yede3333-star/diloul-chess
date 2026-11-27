import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locale as rootLocale } from "next/root-params";
import { routing } from "./routing";

// The locale comes from the [locale] root segment via next/root-params, not from request headers,
// so pages stay statically renderable with Cache Components.
export default getRequestConfig(async () => {
  const param = await rootLocale();
  const locale = hasLocale(routing.locales, param) ? param : routing.defaultLocale;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    // Nouakchott is UTC+0. Per-player time zones for streaks come later (SPEC §17.5).
    timeZone: "Africa/Nouakchott",
  };
});
