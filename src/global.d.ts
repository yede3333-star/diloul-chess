import type { routing } from "@/i18n/routing";
import type messages from "@/messages/ar.json";

// Type-safe translation keys: a missing or misspelled key is a compile error.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
