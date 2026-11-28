import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default function AdminPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[880px] flex-col gap-6 px-[max(16px,env(safe-area-inset-left))] pt-[calc(env(safe-area-inset-top)+20px)] pb-10">
      <AdminDashboard />
    </main>
  );
}
