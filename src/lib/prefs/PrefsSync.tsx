"use client";

import { useLocale } from "next-intl";
import { useLayoutEffect } from "react";
import { reapplyStoredPrefs } from "./prefs";

/**
 * Switching language re-renders <html> on the client, which drops the data-theme / data-board
 * attributes the inline script set. This puts them back before paint.
 */
export function PrefsSync() {
  const locale = useLocale();
  useLayoutEffect(() => {
    reapplyStoredPrefs();
  }, [locale]);
  return null;
}
