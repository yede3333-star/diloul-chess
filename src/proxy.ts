import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Redirects "/" and locale-less URLs to /ar or /fr (browser language, then the saved cookie).
export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next internals, internal /dev pages and any file with an extension.
  matcher: ["/((?!api|_next|_vercel|dev|.*\\..*).*)"],
};
