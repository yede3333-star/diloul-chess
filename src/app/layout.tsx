import type { Metadata, Viewport } from "next";
import { Noto_Kufi_Arabic, Noto_Sans, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

// Headings in Arabic: Noto Kufi Arabic. Arabic body: Noto Sans Arabic. French and Latin: Noto Sans.
const kufi = Noto_Kufi_Arabic({ subsets: ["arabic", "latin"], variable: "--font-kufi", display: "swap" });
const naskhSans = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-naskh-sans", display: "swap" });
const latin = Noto_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-latin", display: "swap" });

export const metadata: Metadata = {
  title: "ديلول تشس",
  description: "تعلّم الشطرنج مجانًا · Apprends les échecs gratuitement",
};

export const viewport: Viewport = {
  themeColor: "#11152a",
  colorScheme: "dark light",
  viewportFit: "cover",
};

// Temporary root layout. Locale routing (next-intl, ar/fr) replaces lang/dir in step 3.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${kufi.variable} ${naskhSans.variable} ${latin.variable}`}>
      <body>{children}</body>
    </html>
  );
}
