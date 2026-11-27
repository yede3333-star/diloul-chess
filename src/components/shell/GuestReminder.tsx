"use client";

import { CloudUpload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useStorage } from "@/lib/storage/StorageProvider";

const SESSIONS_KEY = "diloul:sessions";
const DISMISSED_AT_KEY = "diloul:reminderDismissedAt";

/**
 * Gentle reminder for guests (SPEC §13.1): from the 3rd visit, "your progress is only on this device".
 * Dismissing hides it for 3 more visits. (The "first rank-up" trigger arrives with ranks in phase 1.)
 */
export function GuestReminder() {
  const t = useTranslations("guestReminder");
  const { status, mode, authAvailable } = useStorage();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      // Count visits once per browser session.
      let sessions = Number(localStorage.getItem(SESSIONS_KEY) ?? 0);
      if (!sessionStorage.getItem(SESSIONS_KEY)) {
        sessions += 1;
        localStorage.setItem(SESSIONS_KEY, String(sessions));
        sessionStorage.setItem(SESSIONS_KEY, "1");
      }
      const dismissedAt = Number(localStorage.getItem(DISMISSED_AT_KEY) ?? 0);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser-only storage after mount
      setShow(sessions >= 3 && (!dismissedAt || sessions - dismissedAt >= 3));
    } catch {}
  }, []);

  if (!show || status !== "ready" || mode !== "guest" || !authAvailable) return null;

  return (
    <div role="status" className="flex items-center gap-3 rounded-md border border-border bg-info-soft px-3.5 py-2.5 text-sm">
      <CloudUpload className="size-5 shrink-0 text-info" aria-hidden="true" />
      <p className="min-w-0 flex-1">{t("text")}</p>
      <Link href="/login" className="btn btn-primary btn-sm shrink-0">
        {t("action")}
      </Link>
      <button
        type="button"
        aria-label={t("dismiss")}
        className="grid size-8 shrink-0 place-items-center rounded-full text-fg-muted hover:text-fg"
        onClick={() => {
          try {
            localStorage.setItem(DISMISSED_AT_KEY, localStorage.getItem(SESSIONS_KEY) ?? "0");
          } catch {}
          setShow(false);
        }}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
