"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/monitoring/report";

// Last-resort error page, used only if the root layout itself fails (no translations available here).
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportError(error, { digest: error.digest, scope: "global" });
  }, [error]);
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#11152a", color: "#eee7da", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 24 }}>
        <main>
          <h1>حدث خطأ غير متوقع</h1>
          <p lang="fr" dir="ltr">
            Une erreur inattendue s’est produite.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 16, padding: "12px 24px", border: 0, borderRadius: 999, background: "#e9b864", color: "#21160a", fontWeight: 700, fontSize: 16 }}
          >
            حاول مجددًا · Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
