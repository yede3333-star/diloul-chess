import type { MetadataRoute } from "next";

// PWA manifest (SPEC §2): installable on Android and iOS home screens.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "ديلول تشس · Diloul Chess",
    short_name: "ديلول",
    description: "تعلّم الشطرنج مجانًا · Apprends les échecs gratuitement",
    lang: "ar",
    dir: "auto",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#11152a",
    theme_color: "#11152a",
    categories: ["education", "games"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
