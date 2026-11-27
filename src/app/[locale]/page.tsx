import { locale } from "next/root-params";
import { redirect } from "@/i18n/navigation";

// No landing page yet (SPEC §17.9 comes later): open the Learn tab.
export default async function LocaleIndex() {
  redirect({ href: "/learn/basics", locale: (await locale()) as "ar" | "fr" });
}
