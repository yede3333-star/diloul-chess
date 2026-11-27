import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ديلول تشس",
  description: "تعلّم الشطرنج مجانًا · Apprends les échecs gratuitement",
};

// Temporary root layout. Locale routing (next-intl, ar/fr) replaces it in step 3.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
