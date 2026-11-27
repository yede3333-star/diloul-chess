import { locale } from "next/root-params";
import { redirect } from "@/i18n/navigation";

export default async function LearnIndex() {
  redirect({ href: "/learn/basics", locale: (await locale()) as "ar" | "fr" });
}
