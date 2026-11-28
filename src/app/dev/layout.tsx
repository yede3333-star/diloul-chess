import type { Metadata } from "next";
import { fontVariables } from "../fonts";
import "../globals.css";

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Root layout for internal /dev pages (outside locale routing). Arabic, dark.
export default function DevLayout({ children }: LayoutProps<"/dev">) {
  return (
    <html lang="ar" dir="rtl" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
