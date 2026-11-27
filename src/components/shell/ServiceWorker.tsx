"use client";

import { useEffect } from "react";

/** Registers /sw.js in production builds only (never in `next dev`, where it would cache stale code). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Not fatal: the site works without it, only offline support is lost.
    });
  }, []);
  return null;
}
