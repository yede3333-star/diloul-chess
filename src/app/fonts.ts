import { Noto_Kufi_Arabic, Noto_Sans, Noto_Sans_Arabic } from "next/font/google";

// Headings in Arabic: Noto Kufi Arabic. Arabic body: Noto Sans Arabic. French and Latin: Noto Sans.
const kufi = Noto_Kufi_Arabic({ subsets: ["arabic", "latin"], variable: "--font-kufi", display: "swap" });
const naskhSans = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-naskh-sans", display: "swap" });
const latin = Noto_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-latin", display: "swap" });

export const fontVariables = `${kufi.variable} ${naskhSans.variable} ${latin.variable}`;
